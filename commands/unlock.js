const { QuickDB } = require("quick.db");

const db = new QuickDB();
const games = db.table("games");
module.exports = {
	name: `unlock`,
	aliases: [`u`, `ul`],
	async execute(message) {
		const { channel } = message;
		const game = games.get(channel.id);
		game.processing = undefined;
		await games.set(channel.id, game);
		await channel.send(`WILD lock stopped.`);
	},
};
