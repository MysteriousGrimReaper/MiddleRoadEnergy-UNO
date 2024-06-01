const { QuickDB } = require("quick.db");
const {
	EmbedBuilder,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
} = require("discord.js");
const { embed_colors, display_names } = require("../enums.json");
const db = new QuickDB();
const games = db.table("games");
const fs = require("node:fs");
const path = require("node:path");
const hand_button = new ButtonBuilder()
	.setCustomId(`hand`)
	.setStyle(ButtonStyle.Primary)
	.setLabel(`Hand`)
	.setEmoji(`🎴`);
const table_button = new ButtonBuilder()
	.setCustomId(`table`)
	.setStyle(ButtonStyle.Secondary)
	.setLabel(`Table`)
	.setEmoji(`🎨`);
const button_row = new ActionRowBuilder().setComponents([
	hand_button,
	table_button,
]);
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
		if (game.on) {
			return await channel.send(
				`There's a game going on in this channel already!`
			);
		}
		const starting_cards = game.cards;
		game.on = true;
		const player1 = `<@${game.players[0].id}>`;
		game.table.cards.push(game.deck.pop());
		for (let i = 0; i < starting_cards; i++) {
			game.players[0].hand.push(game.deck.pop());
			game.players[1].hand.push(game.deck.pop());
		}
		await games.set(`${channel.id}`, game);
		const top_card = game.table.cards[0];
		console.log();
		const play_embed = new EmbedBuilder()
			.setDescription(
				`Starting UNO game with ${starting_cards} cards! The currently flipped card is:\n**${
					display_names[top_card.color]
				} ${top_card.icon}**.\n\nIt is now ${player1}'s turn!`
			)
			.setColor(parseInt(embed_colors[top_card.color], 16))
			.setThumbnail(
				`https://raw.githubusercontent.com/MysteriousGrimReaper/MiddleRoadEnergy-UNO/main/cards/${
					top_card.wild ? `` : top_card.color
				}${top_card.wild ? `WILD` : ``}${top_card.icon}.png`
			)
			.setFooter({
				iconURL: `https://raw.githubusercontent.com/MysteriousGrimReaper/MiddleRoadEnergy-UNO/main/cards/logo.png`,
				text: `Deck: ${game.deck.length} cards remaining | Discarded: ${game.table.cards.length}`,
			});
		await channel.send({
			embeds: [play_embed],
			components: [button_row],
		});
	},
};
