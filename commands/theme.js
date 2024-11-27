const { QuickDB } = require("quick.db");

const db = new QuickDB();
const setting = db.table("settings");
const fs = require("fs")
const themes = fs.readdirSync(`./cards`)
module.exports = {
	name: `theme`,
	aliases: [`th`],
	description: `Set the card theme.`,
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
