const { QuickDB } = require("quick.db");

const db = new QuickDB();
const settings = db.table("settings");
module.exports = {
	name: `toggle`,
	aliases: [],
	description: `In the event that a WILD card was played, the bot will stop listening to other commands until a color is selected. Use this command to undo that (e.g. if the player happens to go AFK at that moment)`,
	async execute(message) {
		const { guildId } = message;
		const c = message.content
			.toLowerCase()
			.split(" ")
			.filter((a) => a != `ref` || a != `toggle` || a != `reftoggle`);
		const valid_toggles = [
			`max_command_chain`,
			`viewers_see_history`,
			`viewers_see_table`,
			`players_see_history`,
			`custom_cards`,
		];
		if (!valid_toggles.includes(c[0])) {
			return;
		}
		await settings.set(`${guildId}.${c[0]}`, `${c[1]}`);
		await message.reply(`${c[0]} set to ${c[1]}.`);
	},
};
