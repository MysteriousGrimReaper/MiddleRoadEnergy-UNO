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
	deleteGame(id) {
		delete this[id];
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

const input_queue = [];
let is_processing_commands = false;
const uno_message_listener = async (m) => {
	if (m.author.bot || !m.content.toLowerCase().startsWith(prefix)) {
		return;
	}
	input_queue.push(m);
	// console.log(input_queue);
	if (input_queue.length > 1) {
		return;
	}
	is_processing_commands = true;
	while (input_queue.length > 0) {
		const message = input_queue[0];
		let { content } = message;
		content = content.toLowerCase();
		const { channel, guildId } = message;
		const game =
			game_cache.getGame(channel.id) ?? (await games.get(channel.id));
		if (!game) {
			input_queue.shift();
			is_processing_commands = false;
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
					) || names.reduce((acc, cv) => acc || a[1] == cv, false)
				) {
					await execute(message, game, c.trim());
				}
			}
		}
		input_queue.shift();
		is_processing_commands = false;
	}
};
client.on("messageCreate", uno_message_listener);

// ref commands
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
	.readdirSync(commandsPath)
	.filter((file) => file.endsWith(".js"));
const ref_commands = []
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	const { name, execute, aliases } = command;
	const names = [name];
	if (aliases) {
		names.push(...aliases);
	}
	ref_commands.push({ names, command, execute });
}
const ref_message_listener = async (m) => {
	console.log(m.content)
	if (
		!m.inGuild() ||
		m.author.bot ||
		!m.content.startsWith(ref_prefix)
	) {
		return;
	}
	const practice_channel_ids = [
		`1110377721877499974`,
		`967583535290548244`,
		`1209164498624319518`,
		`1209164739125710868`,
		`1217987116521226250`,
		`1217987181768081489`,
		`1217987181768081489`,
		`1273424231782158409`,
		`1273424302858829896`,
	]
	if (!m?.member?.permissions.has(
		PermissionsBitField.Flags.ManageRoles
	) && !practice_channel_ids.includes(m.channel.id)) {
		return
	}
	input_queue.push(m);
	if (input_queue.length > 1) {
		return;
	}
	is_processing_commands = true;
	while (input_queue.length > 0) {
		const message = input_queue[0];
		let { content } = message;
		content = content.toLowerCase();
		const { channel, guildId } = message;
		const game =
			game_cache.getGame(channel.id) ?? (await games.get(channel.id));
		// console.log(game);
		const commands = content.split(`&&`);
		if (game?.settings?.max_command_chain > 0) {
			commands.splice(game?.settings?.max_command_chain);
		}
		for (c of commands) {
			console.log(c)
			const a = c.trim().split(` `);
			for (ci of ref_commands) {
				const { names, execute, input } = ci;
				console.log(ci);
				if (
					names.reduce(
						(acc, cv) =>
							acc ||
							a[0] == `${ref_prefix}${cv}` ||
							(a[0] == cv && commands.indexOf(c) > 0),
						false
					) || names.reduce((acc, cv) => acc || a[1] == cv, false)
				) {
					await execute(message, game, c.trim());
					console.log(`match`)
				}
				else {
					console.log(`no match`)
				}
			}
		}
		input_queue.shift();
		is_processing_commands = false;
	}
};
client.on("messageCreate", ref_message_listener)
async function cacheInitialize() {
	(await games.all()).forEach((g) => {
		game_cache.setGame(g.id, g.value);
	});
}
cacheInitialize();

client.login(test ? testToken : token);

const yourUserId = "315495597874610178";
const user = client.users.fetch(yourUserId);
process.on("uncaughtException", (error) => {
	// Retrieve your user object

	console.log(error)
});

