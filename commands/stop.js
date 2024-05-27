const { QuickDB } = require("quick.db");

const db = new QuickDB();
const games = db.table("games");
module.exports = {
	name: `stop`,
	aliases: [`x`, `exit`],
	async execute(message) {
		const { channel } = message;
		if (!(await games.get(`${channel.id}.on`))) {
			await channel.send(`No game is ongoing in this channel right now!`);
			return;
		}
		await games.set(`${channel.id}.on`, false);
		await channel.send(`UNO game stopped.`);
	},
};
