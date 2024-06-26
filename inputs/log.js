const { QuickDB } = require("quick.db");
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
		let log_text = ``;
		if (log.length > 0) {
			const total_time = log
				.map((l) => l.end - l.start)
				.reduce((acc, cv) => acc + cv, 0);

			const avg_time = total_time / log.length;
			log_text +=
				log.reduce(
					(acc, cv) =>
						acc +
						`**Game ${log.indexOf(cv) + 1} - ${
							players[cv.winner].name
						} - ${cv.cards} cards - ${Math.floor(
							(cv.end - cv.start) / 1000 / 60
						)}m ${
							Math.floor((cv.end - cv.start) / 1000) % 60
						}s**\n`,
					``
				) +
				`\n**Total Time: ${Math.floor(total_time / 1000 / 60)}m ${
					Math.floor(total_time / 1000) % 60
				}s**\n**Average Time: ${Math.floor(avg_time / 1000 / 60)}m ${
					Math.floor(avg_time / 1000) % 60
				}s**`;
		}

		if (game.on) {
			const current_time = Date.now();
			const t_diff = current_time - game.log[game.log.length - 1].start;
			log_text += `\n\nCurrent game has lasted **${Math.floor(
				t_diff / 1000 / 60
			)}m ${Math.floor(t_diff / 1000) % 60}s**.`;
		}
		return await channel.send(log_text);
	},
};
