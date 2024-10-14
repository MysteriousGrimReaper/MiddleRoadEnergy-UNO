const { QuickDB } = require("quick.db");

const db = new QuickDB();
const setting = db.table("settings");
const themes = [`default`, `custom`, `greek`]
module.exports = {
	name: `theme`,
	aliases: [`th`],
	description: `Pause a game occurring in the channel. The game will still be ongoing, but players cannot send inputs.`,
	async execute(message) {
		const theme_chosen = message.content.split(' ')[2]
		if (themes.includes(theme_chosen)) {
			await setting.set(`${message.guildId}.theme`, theme_chosen)
			await message.reply(`Theme set to \`${theme_chosen}\`.`)
		}
		else {
			await message.reply(`Couldn't set the theme (invalid theme). Your choices are: ${'`' + themes.join('` `')+'`'}`)
		}
	},
};
