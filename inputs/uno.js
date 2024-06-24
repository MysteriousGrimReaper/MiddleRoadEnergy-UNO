const { QuickDB } = require("quick.db");
const { display_names, embed_colors } = require("../enums.json");
const { EmbedBuilder } = require("discord.js");
const db = new QuickDB();
const games = db.table("games");
module.exports = {
	name: `!`,
	aliases: [`!`],
	async execute(message, game) {
		const { author, channel } = message;
		const { on, players } = game;
		if (!on) {
			return;
		}
		if (author.id != players[0].id && author.id != players[1].id) {
			return;
		}
		const player = players.findIndex((p) => p.id == author.id);
		if (game.players[player].hand.length != 1) {
			game.players[player].uno = false;
			return await channel.send(`You have more than 1 card left!`);
		}
		game.players[player].uno = true;
		await channel.send(
			`**UNO!!** ${players[player].name} only has 1 card left!`
		);
		const game_cache = require("../index");
		game_cache.setGame(channel.id, game);
		await games.set(channel.id, game);
	},
};
