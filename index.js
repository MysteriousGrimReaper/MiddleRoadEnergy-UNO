const fs = require("node:fs");
const path = require("node:path");
const { QuickDB } = require("quick.db");

class GameCache {
	constructor() {}
	getGame(id) {
		return this[id];
	}
	setGame(id, game) {
		this[id] = game;
		return this;
	}
}
const game_cache = new GameCache();
module.exports = game_cache;
const db = new QuickDB();
const games = db.table("games");
const settings = db.table("settings");
const {
	Client,
	Collection,
	GatewayIntentBits,
	Partials,
	PermissionsBitField,
} = require("discord.js");
const { testToken, token, test, prefix, ref_prefix } = require("./config.json");
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildVoiceStates,
	],
	partials: [Partials.Channel, Partials.Message],
	allowedMentions: { parse: ["users"] },
});

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
	.readdirSync(eventsPath)
	.filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

// player commands
const inputsPath = path.join(__dirname, "inputs");
const inputFiles = fs
	.readdirSync(inputsPath)
	.filter((file) => file.endsWith(".js"));
const command_inputs = [];
for (const file of inputFiles) {
	const filePath = path.join(inputsPath, file);
	const input = require(filePath);
	const { name, execute, aliases } = input;
	const names = [name];
	if (aliases) {
		names.push(...aliases);
	}
	command_inputs.push({ names, input, execute });
}
const uno_message_listener = async (message) => {
	client.off("messageCreate", uno_message_listener);
	console.log(message.id);
	let { content } = message;
	content = content.toLowerCase();
	if (message.author.bot || !content.toLowerCase().startsWith(prefix)) {
		client.on("messageCreate", uno_message_listener);
		return;
	}
	const { channel, guildId } = message;
	const game = await games.get(channel.id);
	if (!game) {
		client.on("messageCreate", uno_message_listener);
		return await message.reply(
			`There's no game going on in this channel right now! Wait for a referee to start one.`
		);
	}
	if (!game.command_list) {
		game.command_list = [];
	}
	// console.log(game);
	const commands = content.split(`&&`);
	if (game.settings.max_command_chain > 0) {
		commands.splice(game?.settings?.max_command_chain);
	}
	for (c of commands) {
		const a = c.trim().split(` `);
		for (ci of command_inputs) {
			const { names, execute, input } = ci;
			// console.log(ci);
			if (
				names.reduce(
					(acc, cv) =>
						acc ||
						a[0] == `${prefix}${cv}` ||
						(a[0] == cv && commands.indexOf(c) > 0),
					false
				)
			) {
				await execute(message, game, c.trim());
			} else if (names.reduce((acc, cv) => acc || a[1] == cv, false)) {
				await execute(message, game, c.trim());
			}
		}
	}
	client.on("messageCreate", uno_message_listener);
};
client.on("messageCreate", uno_message_listener);

// ref commands
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
	.readdirSync(commandsPath)
	.filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	const { name, execute, aliases } = command;
	const names = [name];
	if (aliases) {
		names.push(...aliases);
	}
	client.on("messageCreate", (message) => {
		let { content } = message;
		content = content.toLowerCase();
		if (
			!message?.member?.permissions.has(
				PermissionsBitField.Flags.ManageGuild
			) ||
			!message.inGuild() ||
			message.author.bot ||
			!content.startsWith(ref_prefix)
		) {
			return;
		}
		const a = content.split(` `);
		if (
			names.reduce(
				(acc, cv) => acc || a[0] == `${ref_prefix}${cv}`,
				false
			)
		) {
			execute(message, ...a.slice(1));
		} else if (names.reduce((acc, cv) => acc || a[1] == cv, false)) {
			execute(message, ...a.slice(2));
		}
	});
}
async function cacheInitialize() {
	(await games.all()).forEach((g) => {
		game_cache.setGame(g.id, g.value);
	});
}
cacheInitialize();
client.login(test ? testToken : token);
/*
const yourUserId = "1014413186017021952";

process.on("uncaughtException", (error) => {
	// Retrieve your user object
	const user = client.users.cache.get(yourUserId);

	// Send the error message to yourself via DM
	user.send(`An error occurred: ${error}`);
});
*/
