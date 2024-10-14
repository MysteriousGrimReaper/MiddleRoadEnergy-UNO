const { QuickDB } = require("quick.db");
const db = new QuickDB();
const games = db.table("games");
const GameEmbeds = require("../structures/embeds");
const button_row = require("../structures/button-row")
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
		const play_embed = GameEmbeds.startEmbed(game)
		await channel.send({
			embeds: [play_embed],
			components: [button_row],
		});

		const game_cache = require("../index");
		game_cache.setGame(channel.id, game);
		await games.set(`${channel.id}`, game);
	},
};
