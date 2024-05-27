const fs = require("node:fs");
const path = require("node:path");
const { QuickDB } = require("quick.db");

const db = new QuickDB();
const games = db.table("games");
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

for (const file of inputFiles) {
	const filePath = path.join(inputsPath, file);
	const input = require(filePath);
	const { name, execute, aliases } = input;
	const names = [name];
	if (aliases) {
		names.push(...aliases);
	}
	client.on("messageCreate", async (message) => {
		if (
			message.author.bot ||
			!message.content.toLowerCase().startsWith(prefix)
		) {
			return;
		}
		const { channel } = message;
		const game = await games.get(channel.id);
		if (!game) {
			return await message.reply(
				`There's no game going on in this channel right now! Wait for a referee to start one.`
			);
		}
		console.log(game);
		const a = message.content.split(` `);
		if (names.reduce((acc, cv) => acc || a[0] == `${prefix}${cv}`, false)) {
			execute(message, game, ...a.slice(1));
		} else if (names.reduce((acc, cv) => acc || a[1] == cv, false)) {
			execute(message, game, ...a.slice(2));
		}
	});
}

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
		if (
			!message?.member?.permissions.has(
				PermissionsBitField.Flags.ManageGuild
			) ||
			!message.inGuild() ||
			message.author.bot ||
			!message.content.startsWith(ref_prefix)
		) {
			return;
		}
		const a = message.content.toLowerCase().split(` `);
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
