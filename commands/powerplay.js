const { QuickDB } = require("quick.db");

const db = new QuickDB();
const games = db.table("games");
module.exports = {
	name: `pp`,
	aliases: [`powerplay`],
	description: `Set the number of power plays each player has. Use this at the **start** of a match in order to avoid resetting all the players' power plays.`,
	async execute(message, pp) {
		const { channel } = message;
		const game = await games.get(channel.id);
		if (isNaN(pp)) {
			return await channel.send(`Invalid number of games.`);
		}
		if (!game) {
			return await message.reply(
				`No match has been initialized yet! Use \`ref init <@player1> <@player2>\` to initialize a match.`
			);
		}
		game.players[0].pp = pp;
		game.players[1].pp = pp;
		await games.set(`${channel.id}`, game);
		await channel.send(`Power plays set to ${pp}.`);
		
	},
};
