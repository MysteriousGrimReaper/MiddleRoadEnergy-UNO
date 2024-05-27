const { QuickDB } = require("quick.db");

const db = new QuickDB();
const games = db.table("games");
module.exports = {
	name: `close`,
	aliases: [`closegame`],
	async execute(message) {
		const channel = message?.mentions?.channels?.first() ?? message.channel;
		const game = await games.delete(channel.id);
		await message.reply(`Match in ${channel} closed.`);
		console.log(game);
	},
};
