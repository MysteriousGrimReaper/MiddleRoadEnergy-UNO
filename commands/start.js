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
const history_button = new ButtonBuilder()
	.setCustomId(`history`)
	.setStyle(ButtonStyle.Success)
	.setLabel(`History`)
	.setEmoji(`🔄`);
const stats_button = new ButtonBuilder()
	.setCustomId(`stats`)
	.setStyle(ButtonStyle.Success)
	.setLabel(`Stats`)
	.setEmoji(`📊`);

const button_row = new ActionRowBuilder().setComponents([
	hand_button,
	table_button,
	history_button,
	stats_button,
]);
module.exports = {
	name: `start`,
	aliases: [`s`],
	description: `Use this command to start a game. Make sure that the starting cards are set BEFORE using this command.`,
	async execute(message) {
		// console.log(__dirname);
		const { channel } = message;
		const game = await games.get(channel.id);
		// console.log(game);
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
		if (game.players[0].hand.length >= 1) {
			return await channel.send(
				`A game has already started! Use \`ref continue\` to unpause it.`
			);
		}
		if (game.turn_indicator.length != game.bestof) {
			return await channel.send(`The turn indicator doesn't match the number of games! Use \`ref ti #-#-#-...\` or \`ref bestof #\` to set the proper number of games.`)
		}
		const starting_cards = game.cards;
		game.on = true;
		game.powerplay = false;
		const player1 = `${game.players[game.table.current_turn].name}`;
		game.table.cards.push(game.deck.pop());
		game.players[0].hand = [];
		game.players[1].hand = [];
		for (let i = 0; i < starting_cards; i++) {
			if (game.deck.length < 2) {
				// console.log(`Too many starting cards!`);
				break;
			}
			game.players[0].hand.push(game.deck.pop());
			game.players[1].hand.push(game.deck.pop());
		}
		if (!game.log) {
			game.log = [];
		}
		game.log.push({
			start: Date.now(),
			end: undefined,
			winner: undefined,
			cards: starting_cards,
		});
		const top_card = game.table.cards[game.table.cards.length - 1];
		const play_embed = new EmbedBuilder()
			.setDescription(
				`Starting UNO game with ${starting_cards} cards! The currently flipped card is:\n**${
					display_names[top_card.color]
				} ${top_card.icon}**.\n\nIt is now ${player1}'s turn!`
			)
			.setColor(parseInt(embed_colors[top_card.color], 16))
			.setThumbnail(
				`https://raw.githubusercontent.com/MysteriousGrimReaper/MiddleRoadEnergy-UNO/main/${game.settings.custom_cards ? `custom-cards` : `default-cards`}/${
					top_card.wild ? `` : top_card.color
				}${top_card.wild ? `WILD` : ``}${top_card.icon}.png`
			)
			.setFooter({
				iconURL: `https://raw.githubusercontent.com/MysteriousGrimReaper/MiddleRoadEnergy-UNO/main/${game.settings.custom_cards ? `custom-cards` : `default-cards`}/logo.png`,
				text: `Deck: ${game.deck.length} cards remaining | Discarded: ${game.table.cards.length}`,
			});
		await channel.send({
			embeds: [play_embed],
			components: [button_row],
		});

		const game_cache = require("../index");
		game_cache.setGame(channel.id, game);
		await games.set(`${channel.id}`, game);
	},
};
