const { QuickDB } = require("quick.db");
const { display_names, embed_colors } = require("../enums.json");
const {
	EmbedBuilder,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
} = require("discord.js");
const db = new QuickDB();
const games = db.table("games");
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
	name: `powerplay`,
	aliases: [`pp`],
	async execute(message, game) {
		if (game.processing) {
			return;
		}
		const { author, channel } = message;
		const { on, table, deck, players } = game;

		const { current_turn, cards } = table;
		if (!on) {
			return await message.reply(`The game has not started yet!`);
		}
		if (author.id != players[0].id && author.id != players[1].id) {
			return await message.reply(`You're not in the game!`);
		}
		if (!(players.find((p) => p.id == author.id).pp < 1)) {
			return await message.reply(`You used your power play already!`);
		}
		let extra = ``;
		if (
			(current_turn == 0 && author.id != players[0].id) ||
			(current_turn == 1 && author.id != players[1].id)
		) {
			extra += `**POWER PLAY!!** `;
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
			game.current_turn++;
			game.current_turn %= 2;
			const play_embed = new EmbedBuilder()
				.setDescription(
					`${extra}<@${
						game.players[current_turn].id
					}> drew a card. ${extra}\n\nIt is now <@${
						game.players[game.current_turn].id
					}>'s turn!`
				)
				.setColor(
					embed_colors[
						game.table.cards[game.table.cards.length - 1].color
					]
				)
				.setThumbnail(
					`https://raw.githubusercontent.com/MysteriousGrimReaper/MiddleRoadEnergy-UNO/main/cards/${top_card.color}${top_card.icon}.png`
				)
				.setFooter({
					iconURL: `https://raw.githubusercontent.com/MysteriousGrimReaper/MiddleRoadEnergy-UNO/main/cards/logo.png`,
					text: `Deck: ${game.deck.length} cards remaining | Discarded: ${game.table.cards.length}`,
				});
			return await channel.send({
				embeds: [play_embed],
				components: [button_row],
			});
		} else {
			await games.set(`${channel.id}.powerplay`, true);
			await channel.send(
				`**POWER PLAY!!** Your opponent will be forced to draw a card.`
			);
		}
	},
};
