const { QuickDB } = require("quick.db");

const db = new QuickDB();
const settings = db.table("settings");
const games = db.table("games");
module.exports = {
	name: `toggle`,
	aliases: [],
	description: `In the event that a WILD card was played, the bot will stop listening to other commands until a color is selected. Use this command to undo that (e.g. if the player happens to go AFK at that moment)`,
	async execute(message) {
		const { guildId, channel } = message;
		const c = message.content
			.toLowerCase()
			.split(" ")
			.filter((a) => {
				return a != `ref` && a != `toggle` && a != `reftoggle`;
			});
		console.log(c);
		const valid_toggles = [
			`max_command_chain`,
			`viewers_see_history`,
			`viewers_see_table`,
			`players_see_history`,
			`custom_cards`,
		];
		if (!valid_toggles.includes(c[0])) {
			return await message.reply(`\`${c[0]}\` isn't a valid setting!`);
		}
		const conditional =
			c[1] == `true` ? true : c[1] == false ? false : c[1];
		await settings.set(`${message.channel.id}.${c[0]}`, conditional);
		await message.reply(`\`${c[0]}\` set to ${c[1]}.`);
		const game = await games.get(channel.id);
		if (game) {
			await games.set(`${channel.id}.settings.${c[0]}`, conditional);
		}
	},
};
