const { QuickDB } = require("quick.db");

const db = new QuickDB();
const games = db.table("games");
const game_cache = require("../index.js");
module.exports = {
	name: `close`,
	aliases: [`closegame`],
	description: `Close a match occurring in the channel. \n⚠️ **WARNING!** - deletes the whole match. This should only be used when a game is cancelled or likewise.`,
	async execute(message) {
		// LOG TEXT
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
		await games.delete(channel.id);
		game_cache.deleteGame(message.channel.id);
		await message.reply(`Match in ${channel} closed. Game log:\n\n${log_text}`);
		// console.log(game);
	},
};
