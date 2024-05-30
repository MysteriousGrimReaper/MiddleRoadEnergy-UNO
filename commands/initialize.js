const { QuickDB } = require("quick.db");
const { base } = require("../deck.json");
const db = new QuickDB();
const games = db.table("games");
function shuffleArray(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]]; // Swap elements
	}
	return array;
}
module.exports = {
	name: `initialize`,
	aliases: [`init`, `i`],
	async execute(message) {
		const no_pp = message.content.includes(`0pp`);
		const channel = message?.mentions?.channels?.first() ?? message.channel;
		const first_player = message?.mentions?.users?.at(0);
		const second_player = message?.mentions?.users?.at(1);
		if (await games.get(`${channel.id}`)) {
			await message.reply(
				`A game has already been set up in this channel! Use \`ref close\` to close it.`
			);
			return;
		}
		if (!first_player || !second_player) {
			await message.reply(
				`You haven't chosen either a first or second player!`
			);
			return;
		}
		const game = {
			on: false,
			bestof: 7,
			cards: 7,
			table: {
				cards: [],
				current_turn: 0,
			},
			deck: shuffleArray(base),
			players: [
				{
					id: first_player.id,
					hand: [],
					pp: no_pp ? 0 : 1,
				},
				{
					id: second_player.id,
					hand: [],
					pp: no_pp ? 0 : 1,
				},
			],
		};
		await games.set(`${channel.id}`, game);
		await message.reply(
			`UNO match initialized between ${first_player} and ${second_player} in ${channel}.${
				no_pp ? ` Both players start with 0 PP.` : ``
			}`
		);
	},
};
