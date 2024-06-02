const { QuickDB } = require("quick.db");

const db = new QuickDB();
const games = db.table("games");
module.exports = {
	name: `cards`,
	aliases: [`c`],
	description: `Sets the number of cards that both players will start with.`,
	async execute(message, cards) {
		const { channel } = message;
		if (isNaN(cards) || cards < 1) {
			return await channel.send(`Invalid number of cards.`);
		}

		if (!(await games.get(channel.id))) {
			return await message.reply(
				`No match has been initialized yet! Use \`ref init <@player1> <@player2>\` to initialize a match.`
			);
		}
		await games.set(`${channel.id}.cards`, cards);
		await channel.send(`Starting card count set to ${cards}.`);
	},
};
