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
const GameEmbeds = require("../structures/embeds");
const InputProcessor = require("../structures/input-processor");
const button_row = require("../structures/button-row")
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

		if (!(await InputProcessor.turnCheck(game, message))) {
			return;
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
		game.players[current_turn].stats.self_cards_drawn += amount;
		game.players[current_turn].currently_running = false
		game.players[current_turn].has_played_since_last_pp = true
		game.table.current_turn++;
		game.table.current_turn %= 2;
		const top_card = game.table.cards[game.table.cards.length - 1];
		const ping = Date.now() - start_time;
		const play_embed = await GameEmbeds.drawEmbed(game)
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
			const pp_embed = await GameEmbeds.ppEmbed(game)
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
