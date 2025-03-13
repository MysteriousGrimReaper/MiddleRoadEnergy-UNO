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
if (!fs.readdirSync("./").includes("config.json")) {
	fs.writeFileSync("./config.json", `{
	"token": "PASTE_YOUR_BOT_TOKEN_HERE",
	"prefix": "uno",
	"ref_prefix": "ref"
}`)
		throw Error("config.json file just made. Please open config.json and paste your bot token in there as indicated.")
}
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

const input_queue = {};
let is_processing_commands = false;
const uno_message_listener = async (m) => {
	try {
	if (m.author.bot || !m.content.toLowerCase().startsWith(prefix)) {
		return;
	}
	if (!input_queue[m.channel.id]) {
		input_queue[m.channel.id] = []
	}
	input_queue[m.channel.id].push(m);
	if (input_queue[m.channel.id].length > 1) {
		return;
	}
	is_processing_commands = true;
	while (input_queue[m.channel.id].length > 0) {
		const message = input_queue[m.channel.id][0];
		let { content } = message;
		content = content.toLowerCase();
		const { channel, guildId } = message;
		const game =
			game_cache.getGame(channel.id) ?? (await games.get(channel.id));
		if (!game) {
			input_queue[m.channel.id].shift();
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
					)
				) {
					await execute(message, game, c.trim());
				} else if (
					names.reduce((acc, cv) => acc || a[1] == cv, false)
				) {
					await execute(message, game, c.trim());
				}
			}
		}
		input_queue[m.channel.id].shift();
		is_processing_commands = false;
	}
	}
	catch (error) { 
		console.error(error)
	}
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
		try {
			let { content } = message;
			content = content.toLowerCase();
			if (
				!message.inGuild() ||
				message.author.bot ||
				!content.startsWith(ref_prefix)
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
			if (!message?.member?.permissions.has(
				PermissionsBitField.Flags.ViewGuildInsights
			) && !practice_channel_ids.includes(message.channel.id)) {
				return
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
		}
		catch (error) {
			console.error(error)
		}
		
	});
}
async function cacheInitialize() {
	(await games.all()).forEach((g) => {
		game_cache.setGame(g.id, g.value);
	});
}
cacheInitialize();

client.login(token);

const yourUserId = "315495597874610178";
process.on("uncaughtException", async (error) => {
	console.error(error)
	await (await client.users.fetch("315495597874610178")).send(`<@315495597874610178>\n${error}`)
});

