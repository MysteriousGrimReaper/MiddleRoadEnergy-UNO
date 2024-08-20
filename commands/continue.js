const { QuickDB } = require("quick.db");

const db = new QuickDB();
const games = db.table("games");
module.exports = {
	name: `continue`,
	aliases: [`cont`],
	description: `Continue a game occurring in the channel if it has been pasued by \`ref stop\`.`,
	async execute(message) {
		/*
		const { channel } = message;
		const game = await games.get(channel.id);
		if (game.on) {
			await channel.send(`The game is already ongoing!`);
			return;
		}
		game.on = true;
		await games.set(`${channel.id}`, game);
		await channel.send(`UNO game resuming.`);
		*/
	},
};
