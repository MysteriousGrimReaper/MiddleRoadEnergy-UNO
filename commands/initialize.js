const { QuickDB } = require("quick.db");
const { base, oops_all_wild, large } = require("../deck.json");
const db = new QuickDB();
const games = db.table("games");
const setting = db.table("settings");
function shuffleArray(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]]; // Swap elements
	}
	return array;
}
const names = db.table("names");
module.exports = {
	name: `initialize`,
	aliases: [`init`, `i`],
	description: `Initialize a match between two players by pinging them. This should only be run once at the start of a game set.`,
	async execute(message) {
		let settings = await setting.get(message.guildId);
		if (!settings) {
			settings = {
				max_command_chain: 0,
				viewers_see_history: false,
				viewers_see_table: true,
				players_see_history: true,
				custom_cards: true,
			};
		}
		const stats = {
			cards_played: 0,
			plus_4s_played: 0,
			times_switched_color: 0,
			cards_drawn: 0,
			plus_2s_played: 0,
			wilds_played: 0,
			reverses_played: 0,
			skips_played: 0,
			longest_chain: 0,
			chain: 0,
			self_cards_drawn: 0,
		};
		const no_pp = message.content.includes(`0pp`);
		const channel = message?.mentions?.channels?.first() ?? message.channel;
		const first_player = message?.mentions?.members?.at(0);
		const second_player = message?.mentions?.members?.at(1);
		function isValidTurnIndicator(turnIndicator) {
			const pattern = /^(\d+-)*\d+$/;
			return pattern.test(turnIndicator);
		}
		const args = message.content.split(` `);
		const turn_i = args.find((a) => isValidTurnIndicator(a));
		let turn_indicator = [0, 0, 1, 1, 0, 1, 0];
		if (turn_i) {
			turn_indicator = turn_i.split(`-`).reduce((acc, cv, index) => {
				acc.push(...Array(parseInt(cv)).fill(index % 2));
				return acc;
			}, []);
		}

		if (await games.get(`${channel.id}`)) {
			await message.reply(
				`A match has already been set up in this channel! Use \`ref close\` to close it.`
			);
			return;
		}
		if (!first_player || !second_player) {
			await message.reply(
				`You haven't chosen either a first or second player!`
			);
			return;
		}
		const first_name =
			(await names.get(first_player.user.id)) ??
			first_player.nickname ??
			first_player.user.globalName ??
			first_player.user.username ??
			`<@${first_player.id}>`;
		const second_name =
			(await names.get(second_player.user.id)) ??
			second_player.nickname ??
			second_player.user.globalName ??
			second_player.user.username ??
			`<@${second_player.id}>`;
		const game = {
			on: false,
			bestof: 7,
			cards: 7,
			clock: 0,
			turn_indicator,
			table: {
				cards: [],
				current_turn: 0,
			},
			deck: shuffleArray(base), // SWITCH THIS BACK TO base
			settings,
			players: [
				{
					name: first_name,
					id: first_player.user.id,
					hand: [],
					pp: no_pp ? 0 : 1,
					wins: 0,
					points: 0,
					stats,
					ping: false,
					has_played_since_last_pp: false,
					currently_running: false
				},
				{
					name: second_name,
					id: second_player.user.id,
					hand: [],
					pp: no_pp ? 0 : 1,
					wins: 0,
					points: 0,
					stats,
					ping: false,
					has_played_since_last_pp: false,
					currently_running: false
				},
			],
			matches_finished: 0,
			log: [],
			history: [],
		};
		await games.set(`${channel.id}`, game);
		await message.reply(
			`UNO match initialized between ${first_name} and ${second_name} in ${channel}.${
				no_pp ? ` Both players start with 0 PP.` : ``
			}`
		);
	},
};
