const { QuickDB } = require("quick.db");

const db = new QuickDB();
const games = db.table("games");
module.exports = {
	name: `turn_indicator`,
	aliases: [`ti`],
	description: `Sets the turn indicator for a match.`,
	async execute(message) {
		const { channel } = message;
		function isValidTurnIndicator(turnIndicator) {
			const pattern = /^(\d+-)*\d+$/;
			return pattern.test(turnIndicator);
		}

		if (!(await games.get(channel.id))) {
			return await message.reply(
				`No match has been initialized yet! Use \`ref init <@player1> <@player2>\` to initialize a match.`
			);
		}
		const args = message.content.split(` `);
		const turn_i = args.find((a) => isValidTurnIndicator(a));
		if (!turn_i) {
			return await message.reply(`Couldn't find a valid turn indicator.`);
		}
		const turn_indicator = turn_i.split(`-`);
		console.log(turn_indicator);
		const start_indicator = turn_indicator.reduce((acc, cv, index) => {
			acc.push(...Array(parseInt(cv)).fill(index % 2));
			return acc;
		}, []);
		console.log(start_indicator);
		await games.set(`${channel.id}.turn_indicator`, start_indicator);
		await channel.send(
			`Turn indicator set to ${turn_indicator.join(`-`)}.`
		);
	},
};
