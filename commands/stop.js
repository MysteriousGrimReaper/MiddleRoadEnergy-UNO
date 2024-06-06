const { QuickDB } = require("quick.db");

const db = new QuickDB();
const games = db.table("games");
module.exports = {
	name: `stop`,
	aliases: [`x`, `exit`],
	description: `Pause a game occurring in the channel. The game will still be ongoing, but players cannot send inputs.`,
	async execute(message) {
		const { channel } = message;
		if (!(await games.get(`${channel.id}.on`))) {
			await channel.send(`No game is ongoing in this channel right now!`);
			return;
		}
		await games.set(`${channel.id}.on`, false);
		await channel.send(`UNO game paused.`);
	},
};
