const { QuickDB } = require("quick.db");
const { display_names, embed_colors } = require("../enums.json");
const { EmbedBuilder } = require("discord.js");
const db = new QuickDB();
const names = db.table("names");
const games = db.table("games");
module.exports = {
	name: `register`,
	aliases: [`r`, `name`],
	async execute(message, game) {
		const { author, channel } = message;
		const args = message.content.split(` `);
		args[0] = args[0].toLowerCase();
		let content = ``;
		if (
			args[0] == `unor` ||
			args[0] == `unoregister` ||
			args[0] == `unoname`
		) {
			args.shift();
			content = args.join(` `);
		} else {
			args.shift();
			args.shift();
			content = args.join(` `);
		}
		if (content.length < 1) {
			return await channel.send(`Invalid name.`);
		}
		await channel.send(`Name set to \`${content}\`.`);
		if (game.players[0].id == author.id) {
			game.players[0].name = content;
		}
		if (game.players[1].id == author.id) {
			game.players[1].name = content;
		}
		await names.set(author.id, content);
		await games.set(channel.id, game);
	},
};
