const { QuickDB } = require("quick.db");
const { base } = require("../deck.json");
const db = new QuickDB();
const games = db.table("games");
module.exports = {
	name: `log`,
	aliases: [`l`],
	description: `Prints the game log.`,
	async execute(message) {
		const { channel, author } = message;
		const game = await games.get(channel.id);
		if (!game) {
			return await channel.send(
				`No game has been set up in the channel yet!`
			);
		}
		let { table, log, players } = game;
		log = log.filter((l) => l.end);
		if (log?.length < 1) {
			return await channel.send(`There are no logs for this game yet!`);
		}
		const log_text =
			log.reduce(
				(acc, cv) =>
					acc +
					`**Game ${log.indexOf(cv) + 1} - ${
						players[cv.winner].name
					} - ${cv.cards} cards - ${
						Math.floor((cv.end - cv.start) / 1000 / 60) % 60
					} minutes**\n`,
				``
			) +
			`\n\n**Total Time: ${
				Math.floor(
					(log[log.length - 1].end - log[0].start) / 1000 / 60
				) % 60
			}`;
		return await channel.send(log_text);
	},
};
