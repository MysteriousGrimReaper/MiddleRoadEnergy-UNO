const { QuickDB } = require("quick.db");
const { EmbedBuilder } = require("discord.js");
const { embed_colors, display_names } = require("../enums.json");
const db = new QuickDB();
const games = db.table("games");
const fs = require("node:fs");
const path = require("node:path");
module.exports = {
	name: `start`,
	aliases: [`s`],
	async execute(message) {
		console.log(__dirname);
		const { channel } = message;
		const game = await games.get(channel.id);
		console.log(game);
		if (!game) {
			return await channel.send(
				`A match has not been initialized in this channel yet! Use \`ref init <@first_player> <@second_player>\` to initialize a match.`
			);
		}
		if (await games.get(`${channel.id}.on`)) {
			return await channel.send(
				`There's a game going on in this channel already!`
			);
		}
		const starting_cards = game.cards;
		const player1 = `<@${game.player1.id}>`;
		game.table.cards.push(game.deck.pop());
		for (let i = 0; i < starting_cards; i++) {
			game.player1.hand.push(game.deck.pop());
			game.player2.hand.push(game.deck.pop());
		}
		await games.set(`${channel.id}.player1.hand`, game.player1.hand);
		await games.set(`${channel.id}.player2.hand`, game.player2.hand);
		await games.set(`${channel.id}.table`, game.table);
		await games.set(`${channel.id}.deck`, game.deck);
		await games.set(`${channel.id}.on`, true);
		const top_card = game.table.cards[0];
		const play_embed = new EmbedBuilder()
			.setDescription(
				`Starting UNO game with ${starting_cards} cards! The currently flipped card is: **${
					display_names[top_card.color]
				} ${top_card.icon}**`
			)
			.setColor(parseInt(embed_colors[top_card.color], 16));
		await channel.send({
			embeds: [play_embed],
			files: [
				`./cards/${top_card.color == `W` ? `WILD` : top_card.color}${
					top_card.icon
				}.png`,
			],
		});
	},
};
