const { QuickDB } = require("quick.db");
const { display_names, embed_colors } = require("../enums.json");
function shuffleArray(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]]; // Swap elements
	}
	return array;
}
const {
	EmbedBuilder,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
} = require("discord.js");
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
const db = new QuickDB();
const games = db.table("games");
module.exports = {
	name: `pass`,
	aliases: [`p`],
	description: `Moves to the next player.`,
	async execute(message) {
		const { channel, author } = message;
		const game = await games.get(channel.id);
		const { table, on } = game;
		const { current_turn, cards } = table;
		if (game.processing) {
			game.processing = undefined;
		}
		if (!on) {
			return await message.reply(`The game has not started yet!`);
		}

		const amount = 1;
		if (game.deck.length < amount) {
			await channel.send(`*Reshuffling the deck...*`);
			while (table.cards.length > 1) {
				const card = game.table.cards.shift()
				if (card.wild) {
					card.color = "WILD"
				}
				game.deck.push(card);
			}
			game.deck = shuffleArray(game.deck);
		}
		const draw_chunk = game.deck.splice(0, amount);
		game.players[current_turn].hand.push(...draw_chunk);
		game.players[current_turn].stats.cards_drawn += amount;
		game.table.current_turn = 1 - current_turn;
		const top_card = game.table.cards[game.table.cards.length - 1];
		const play_embed = new EmbedBuilder()
			.setDescription(
				`(inactive, pass) ${
					game.players[current_turn].name
				} drew a card. \n\nIt is now ${
					game.players[game.table.current_turn].name
				}'s turn!`
			)
			.setColor(parseInt(embed_colors[top_card.color], 16))
			.setThumbnail(
				`https://raw.githubusercontent.com/MysteriousGrimReaper/MiddleRoadEnergy-UNO/main/${game.settings.custom_cards ? `custom-cards` : `default-cards`}/${
					top_card.color
				}${top_card.wild ? `WILD` : ``}${top_card.icon}.png`
			)
			.setFooter({
				iconURL: `https://raw.githubusercontent.com/MysteriousGrimReaper/MiddleRoadEnergy-UNO/main/${game.settings.custom_cards ? `custom-cards` : `default-cards`}/logo.png`,
				text: `Deck: ${game.deck.length} cards remaining | Discarded: ${game.table.cards.length}`,
			});
		await channel.send({ embeds: [play_embed], components: [button_row] });

		if (game.powerplay && current_turn != game.table.current_turn) {
			const amount = 1;
			if (game.deck.length < amount) {
				await channel.send(`*Reshuffling the deck...*`);
				while (table.cards.length > 1) {
					const card = game.table.cards.shift()
					if (card.wild) {
						card.color = "WILD"
					}
					game.deck.push(card);
				}
				game.deck = shuffleArray(game.deck);
			}
			const draw_chunk = game.deck.splice(0, amount);
			game.players[game.table.current_turn].hand.push(...draw_chunk);
			game.players[game.table.current_turn].stats.cards_drawn += amount;
			game.table.current_turn++;
			game.table.current_turn %= 2;
			const pp_embed = new EmbedBuilder()
				.setDescription(
					`**POWER PLAY!!** ${
						game.players[1 - current_turn].name
					} drew a card.\n\nIt is now ${
						game.players[game.table.current_turn].name
					}'s turn!`
				)
				.setColor(parseInt(embed_colors[top_card.color], 16))
				.setThumbnail(
					`https://raw.githubusercontent.com/MysteriousGrimReaper/MiddleRoadEnergy-UNO/main/${game.settings.custom_cards ? `custom-cards` : `default-cards`}/${
						top_card.color
					}${top_card.wild ? `WILD` : ``}${top_card.icon}.png`
				)
				.setFooter({
					iconURL: `https://raw.githubusercontent.com/MysteriousGrimReaper/MiddleRoadEnergy-UNO/main/${game.settings.custom_cards ? `custom-cards` : `default-cards`}/logo.png`,
					text: `Deck: ${game.deck.length} cards remaining | Discarded: ${game.table.cards.length}`,
				});
			game.powerplay = undefined;
			await channel.send({
				embeds: [pp_embed],
				components: [button_row],
			});
		}
		game.powerplay = undefined;
		const game_cache = require("../index.js");
		game_cache.setGame(channel.id, game);
		await games.set(`${channel.id}`, game);
	},
};
