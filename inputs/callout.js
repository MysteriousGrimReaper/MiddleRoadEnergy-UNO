const { QuickDB } = require("quick.db");
const { display_names, embed_colors } = require("../enums.json");
const { EmbedBuilder } = require("discord.js");
const db = new QuickDB();
const games = db.table("games");
module.exports = {
	name: `callout`,
	aliases: [`c`],
	async execute(message, game, content) {
		const { author, channel } = message;
		const { on, table, deck, players } = game;
		if (!on) {
			return;
		}
		if (author.id != players[0].id && author.id != players[1].id) {
			return;
		}
		const player = players.findIndex((p) => p.id == author.id);
		const player_called_out = players[1 - player];
		if (
			player_called_out.uno == true ||
			player_called_out.hand.length != 1
		) {
			return await channel.send(`There is nobody to call out!`);
		}
		game.players[1 - player].uno = true;
		const amount = 3;
		if (game.deck.length < amount) {
			await channel.send(`*Reshuffling the deck...*`);
			while (table.cards.length > 1) {
				game.deck.push(game.table.cards.shift());
			}
			game.deck = shuffleArray(game.deck);
		}
		const draw_chunk = game.deck.splice(0, amount);
		game.players[1 - player].hand.push(...draw_chunk);
		game.players[1 - player].stats.cards_drawn += amount;
		await channel.send(
			`Uh oh! **${player_called_out.name}**, you didn't say UNO! Pick up 3!`
		);
		return await games.set(channel.id, game);
	},
};
