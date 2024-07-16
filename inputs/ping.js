const { QuickDB } = require("quick.db");
const { display_names, embed_colors } = require("../enums.json");
const { EmbedBuilder } = require("discord.js");
const db = new QuickDB();
const games = db.table("games");
module.exports = {
	name: `ping`,
	aliases: [],
	async execute(message, game) {
		const { author, channel } = message;
		if (game.players[0].id == author.id) {
			await channel.send(
				`You will ${
					game.players[0].ping ? `not ` : ``
				}be pinged when it's your turn.`
			);
			game.players[0].ping = !game.players[0].ping;
		}
		if (game.players[1].id == author.id) {
			await channel.send(
				`You will ${
					game.players[1].ping ? `not ` : ``
				}be pinged when it's your turn.`
			);
			game.players[1].ping = !game.players[1].ping;
		}
		const game_cache = require("../index");
		game_cache.setGame(channel.id, game);
		await games.set(channel.id, game);
	},
};
