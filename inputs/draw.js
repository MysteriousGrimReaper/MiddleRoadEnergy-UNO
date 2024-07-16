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
	name: `draw`,
	aliases: [`d`],
	async execute(message, game) {
		const start_time = Date.now();
		const { author, channel } = message;
		const { on, table, deck, players } = game;

		const { current_turn, cards } = table;
		if (game.processing) {
			return;
		}
		if (!on) {
			return await message.reply(`The game has not started yet!`);
		}
		if (author.id != players[0].id && author.id != players[1].id) {
			return await message.reply(`You're not in the game!`);
		}
		if (
			(current_turn == 0 && author.id != players[0].id) ||
			(current_turn == 1 && author.id != players[1].id)
		) {
			return await message.reply(`It's not your turn yet!`);
		}
		const amount = 1;
		if (game.deck.length < amount) {
			await channel.send(`*Reshuffling the deck...*`);
			while (table.cards.length > 1) {
				game.deck.push(game.table.cards.shift());
			}
			game.deck = shuffleArray(game.deck);
		}
		const draw_chunk = game.deck.splice(0, amount);
		game.players[current_turn].hand.push(...draw_chunk);
		game.players[current_turn].stats.cards_drawn += amount;
		game.players[current_turn].stats.self_cards_drawn += amount;
		game.table.current_turn++;
		game.table.current_turn %= 2;
		const top_card = game.table.cards[game.table.cards.length - 1];
		const ping = Date.now() - start_time;
		const play_embed = new EmbedBuilder()
			.setDescription(
				`${
					game.players[current_turn].name
				} drew a card. \n\nIt is now ${
					game.players[game.table.current_turn].name
				}'s turn!`
			)
			.setColor(parseInt(embed_colors[top_card.color], 16))
			.setThumbnail(
				`https://raw.githubusercontent.com/MysteriousGrimReaper/MiddleRoadEnergy-UNO/main/custom-cards/${
					top_card.color
				}${top_card.wild ? `WILD` : ``}${top_card.icon}.png`
			)
			.setFooter({
				iconURL: `https://raw.githubusercontent.com/MysteriousGrimReaper/MiddleRoadEnergy-UNO/main/custom-cards/logo.png`,
				text: `Deck: ${game.deck.length} cards remaining | Discarded: ${game.table.cards.length}`,
			});
		await channel.send({ embeds: [play_embed], components: [button_row] });

		if (game.powerplay && current_turn != game.table.current_turn) {
			const amount = 1;
			if (game.deck.length < amount) {
				await channel.send(`*Reshuffling the deck...*`);
				while (table.cards.length > 1) {
					game.deck.push(game.table.cards.shift());
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
					`https://raw.githubusercontent.com/MysteriousGrimReaper/MiddleRoadEnergy-UNO/main/custom-cards/${
						top_card.color
					}${top_card.wild ? `WILD` : ``}${top_card.icon}.png`
				)
				.setFooter({
					iconURL: `https://raw.githubusercontent.com/MysteriousGrimReaper/MiddleRoadEnergy-UNO/main/custom-cards/logo.png`,
					text: `Deck: ${
						game.deck.length
					} cards remaining | Discarded: ${
						game.table.cards.length
					} | Ping: ${
						ping > 500 ? `🔴` : ping > 250 ? `🟡` : `🟢`
					}${ping} ms`,
				});
			game.powerplay = undefined;
			await channel.send({
				embeds: [pp_embed],
				components: [button_row],
			});
		}
		game.powerplay = undefined;
		if (game.players[game.table.current_turn].ping) {
			await channel.send(
				`<@${game.players[game.table.current_turn].id}>`
			);
		}
		const game_cache = require("../index");
		game_cache.setGame(channel.id, game);
		await games.set(`${channel.id}`, game);
	},
};
