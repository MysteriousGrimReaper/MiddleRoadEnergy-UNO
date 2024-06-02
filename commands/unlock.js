const { QuickDB } = require("quick.db");

const db = new QuickDB();
const games = db.table("games");
module.exports = {
	name: `unlock`,
	aliases: [`u`, `ul`],
	description: `In the event that a WILD card was played, the bot will stop listening to other commands until a color is selected. Use this command to undo that (e.g. if the player happens to go AFK at that moment)`,
	async execute(message) {
		const { channel } = message;
		const game = games.get(channel.id);
		game.processing = undefined;
		await games.set(channel.id, game);
		await channel.send(`WILD lock stopped.`);
	},
};
