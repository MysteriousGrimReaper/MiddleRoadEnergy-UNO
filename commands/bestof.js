const { QuickDB } = require("quick.db");

const db = new QuickDB();
const games = db.table("games");
module.exports = {
	name: `bestof`,
	aliases: [`bo`, `b`, `best`, `games`, `g`],
	description: `Set the number of games in the match.`,
	async execute(message, bestof) {
		const { channel } = message;
		if (isNaN(bestof) || bestof < 1 || bestof > 99) {
			return await channel.send(`Invalid number of games.`);
		}
		if (!(await games.get(channel.id))) {
			return await message.reply(
				`No match has been initialized yet! Use \`ref init <@player1> <@player2>\` to initialize a match.`
			);
		}
		await games.set(`${channel.id}.bestof`, bestof);
		await channel.send(
			`Game count set to ${bestof}.${
				bestof % 2 == 0
					? `\n⚠️ **Warning!** Number of games is an even number. There might be some unexpected behavior.`
					: ``
			}`
		);
	},
};
