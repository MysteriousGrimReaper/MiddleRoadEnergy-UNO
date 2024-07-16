const { QuickDB } = require("quick.db");

const db = new QuickDB();
const games = db.table("games");
const game_cache = require("../index.js");
module.exports = {
	name: `close`,
	aliases: [`closegame`],
	description: `Close a match occurring in the channel. \n⚠️ **WARNING!** - deletes the whole match. This should only be used when a game is cancelled or likewise.`,
	async execute(message) {
		const channel = message?.mentions?.channels?.first() ?? message.channel;
		const game = await games.delete(channel.id);
		game_cache.deleteGame(message.channel.id);
		await message.reply(`Match in ${channel} closed.`);
		// console.log(game);
	},
};
