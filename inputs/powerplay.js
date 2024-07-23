const { QuickDB } = require("quick.db");
const { display_names, embed_colors } = require("../enums.json");
const {
	EmbedBuilder,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
} = require("discord.js");
function shuffleArray(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]]; // Swap elements
	}
	return array;
}
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
	name: `powerplay`,
	aliases: [`pp`, `PP`, `Pp`],
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
		const calling_player_index = players.findIndex((p) => p.id == author.id)
		const calling_player = players[calling_player_index]
		if (calling_player.pp < 1) {
			return await message.reply(`You used your power play already!`);
		}
		// first turn of game / cant call it right after opponent has used one
		if (!(players[0].has_played_since_last_pp && players[1].has_played_since_last_pp)) {
			return await message.reply(`Invalid power play! Wait until both players have played a card before using a power play.`)
		}
		// defensive (using a pp on the opponents turn) is when the player has played at least one card and their turn is still going
		if (!players[1 - calling_player_index].currently_running && current_turn != calling_player_index) {
			return await message.reply(`A defensive power play can only be used mid-chain!`)
		}
		// offensive PPs (using a pp on your turn) they have to be before you play any card
		if (calling_player.currently_running) {
			return await message.reply(`You can't use an offensive power play mid-chain!`)
		}
		// can't call pp on uno
		if (players[1 - calling_player_index].hand.length == 1) {
			return await message.reply(`You can't call a power play when your opponent has 1 card left!`)
		}
		if (game.powerplay) {
			return await message.reply(`A power play is already active!`);
		}
		players[0].has_played_since_last_pp = false
		players[1].has_played_since_last_pp = false
		
		game.powerplay = true;
		game.players.find((p) => p.id == author.id).pp--;
		if (
			(current_turn == 0 && author.id != players[0].id) ||
			(current_turn == 1 && author.id != players[1].id)
		) {
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
			game.table.current_turn++;
			game.table.current_turn %= 2;
			game.powerplay = undefined;
			const top_card = game.table.cards[game.table.cards.length - 1];
			const play_embed = new EmbedBuilder()
				.setDescription(
					`**POWER PLAY!!** ${
						game.players[current_turn].name
					} drew a card.\n\nIt is now ${
						game.players[game.table.current_turn].name
					}'s turn!`
				)
				.setColor(
					parseInt(
						embed_colors[
							game.table.cards[game.table.cards.length - 1].color
						],
						16
					)
				)
				.setThumbnail(
					`https://raw.githubusercontent.com/MysteriousGrimReaper/MiddleRoadEnergy-UNO/main/${game.settings.custom_cards ? `custom-cards` : `default-cards`}/${
						top_card.color
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
		} else {
			await channel.send(
				`**POWER PLAY!!** Your opponent will be forced to draw a card.`
			);
		}
		const game_cache = require("../index");
		game_cache.setGame(channel.id, game);
		await games.set(`${channel.id}`, game);
	},
};
