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
		const valid_toggles = [
			`max_command_chain`,
			`viewers_see_history`,
			`viewers_see_table`,
			`players_see_history`,
			`custom_cards`,
			`defaults`
		];
		if (!valid_toggles.includes(c[0])) {
			return await message.reply(`\`${c[0]}\` isn't a valid setting!`);
		}
		if (c[0] == `defaults`) {
			await settings.set(`${channel.id}.max_command_chain`, 2)
			await settings.set(`${channel.id}.viewers_see_history`, false)
			await settings.set(`${channel.id}.players_see_history`, false)
			const game = await games.get(channel.id);
			if (game) {
				await games.set(`${channel.id}.settings.max_command_chain`, 2);
				await games.set(`${channel.id}.settings.viewers_see_history`, false)
				await games.set(`${channel.id}.settings.players_see_history`, false)
			}
			return await message.reply(`Default settings applied:\n\`max_command_chain: 2\`\n\`viewers_see_history: false\`\n\`players_see_history: false\``)
		}
		const conditional =
			c[1] == `true` ? true : c[1] == `false` ? false : c[1];
		await settings.set(`${message.channel.id}.${c[0]}`, conditional);
		await message.reply(`\`${c[0]}\` set to ${c[1]}.`);
		const game = await games.get(channel.id);
		if (game) {
			await games.set(`${channel.id}.settings.${c[0]}`, conditional);
		}
	},
};
