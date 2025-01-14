const { QuickDB } = require("quick.db");

const db = new QuickDB();
const setting = db.table("settings");
const fs = require("fs")
let themes = fs.readdirSync(`./cards`)
const decompress = require("decompress");
const card_list = fs.readdirSync(`./cards/default`)
async function attachmentToBuffer(message) {
	// Get the first attachment from the message
	const attachment = message.attachments.first();
	
	if (!attachment) {
	  throw new Error('No attachment found');
	}
  
	// Fetch the attachment content as an ArrayBuffer
	const response = await fetch(attachment.url);
	const arrayBuffer = await response.arrayBuffer();
  
	// Convert ArrayBuffer to Buffer
	const buffer = Buffer.from(arrayBuffer);
  
	return buffer;
  }
module.exports = {
	name: `theme`,
	aliases: [`th`],
	description: `Set the card theme.`,
	async execute(message) {
		const args = message.content.split(' ')
		if (args.length < 3) {
			await message.reply(`You need to specify a command. Your choices are: ${'`set`'}`)
		}
		switch (args[2]) {
			case `set`:
				const theme_chosen = args[3]
				if (themes.includes(theme_chosen)) {
					await setting.set(`${message.guildId}.theme`, theme_chosen)
					await message.reply(`Theme set to \`${theme_chosen}\`.`)
				}
				else {
					await message.reply(`Couldn't set the theme (invalid theme). Your choices are: ${'`' + themes.join('` `')+'`'}`)
				}
				break
			case `add`:
				const theme_added = args[3]
				if (!themes.includes(theme_added) && theme_added.length > 0) {
					const card_dir = `./cards/${theme_added}`
					themes = fs.readdirSync(`./cards`)
					fs.mkdirSync(card_dir)
					try {
						const zip_buffer = await attachmentToBuffer(message)
						await decompress(zip_buffer, card_dir)
						const new_theme_card_list = fs.readdirSync(card_dir)
						for (const card of card_list) {
							if (!new_theme_card_list.includes(card)) {
								await message.reply(`:warning: Couldn't add the theme (missing card \`${card}\`).\nPlease make sure that in the zip file, there are no folders - only the cards.`)
								fs.rmSync(card_dir, { recursive: true })
								return
							}
						}
						themes = fs.readdirSync(`./cards`)
						await message.reply(`Theme \`${theme_added}\` added.`)
					}
					catch {
						await message.reply(`:warning: Couldn't add the theme (invalid zip file).`)
						fs.rmSync(card_dir, { recursive })
					}
					
				}
				else {
					await message.reply(`Couldn't add the theme (theme \`${theme_added}\` already exists).`)
				}
				break
			case `remove`:
				const theme_removed = args[3]
				if (theme_removed == "default") { await message.reply(`You can't remove the default theme.`); return }
				if (themes.includes(theme_removed)) {
					const card_dir = `./cards/${theme_removed}`
					fs.rmdirSync(card_dir, { recursive: true })
					themes = fs.readdirSync(`./cards`)
					await message.reply(`Theme \`${theme_removed}\` removed.`)
				}
				else {
					await message.reply(`Couldn't remove the theme (invalid theme). Your choices are: ${'`' + themes.join('` `')+'`'}`)
				}
				break
			default:
				await message.reply(`Invalid command. Your choices are: ${'`set`'}`)
		}
		
	},
};
