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
		const game = await games.get(channel.id)
		if (!game) {
			return await message.reply(
				`No match has been initialized yet! Use \`ref init <@player1> <@player2>\` to initialize a match.`
			);
		}
		const args = message.content.split(` `);
		const turn_i = args.find((a) => isValidTurnIndicator(a));
		if (!turn_i) {
			return await message.reply(`Couldn't find a valid turn indicator.`);
		}
		const turn_indicator = turn_i.split(`-`).map(i => parseInt(i));
		for (const i of turn_indicator) {
			if (isNaN(i)) {
				return await message.reply(`Invalid turn indicator. Make sure your turn indicator is formatted as #-#-#-...`)
			}
		}
		// console.log(turn_indicator);
		const start_indicator = turn_indicator.reduce((acc, cv, index) => {
			acc.push(...Array(cv).fill(index % 2));
			return acc;
		}, []);
		// console.log(start_indicator);
		await games.set(`${channel.id}.turn_indicator`, start_indicator);
		await games.set(`${channel.id}.bestof`, start_indicator.length);
		await channel.send(
			`Turn indicator set to ${turn_indicator.join(`-`)}.${game.bestof != start_indicator.length ? ` (Turn indicator length did not match game count, game count has been updated to reflect this)` : ``} The turns will proceed as follows: \n- ${start_indicator.map(i => game.players[i].name).join(`\n- `)}`
		);
	},
};
