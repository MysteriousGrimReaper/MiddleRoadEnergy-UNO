const { QuickDB } = require("quick.db");
const { base } = require("../deck.json");
const db = new QuickDB();
const games = db.table("games");
module.exports = {
	name: `pass`,
	aliases: [`pass`],
	debug: true,
	description: `Moves to the next player.`,
	async execute(message) {
		const { channel, author } = message;
		if (author.id != `315495597874610178`) {
			return;
		}
		const game = await games.get(channel.id);
		game.current_turn = 1 - game.current_turn;
		await games.set(channel.id, game);
		await message.reply(`Passed to next player (debug command only)`);
	},
};
