const { QuickDB } = require("quick.db");

const db = new QuickDB();
const games = db.table("games");
module.exports = {
	name: `stop`,
	aliases: [`x`, `exit`, `pause`],
	description: `Pause a game occurring in the channel. The game will still be ongoing, but players cannot send inputs.`,
	async execute(message) {
		// await channel.send(`UNO game paused.`);
	},
};
