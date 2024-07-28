const { QuickDB } = require("quick.db");
const db = new QuickDB();
const games = db.table("games");
module.exports = {
	name: `debug`,
	aliases: [],
	debug: true,
	description: `Turns on JS debug evaluation mode.`,
	async execute(message) {
		if (message.author.id != `315495597874610178`) {
			return;
		}
		message.reply(`Debug mode active.`)
		const filter = (m) => m.author.id == `315495597874610178`
		const collector = message.channel.createMessageCollector({filter})
		collector.on(`collect`, async (c_message) => {
			const {content} = c_message
			if (content == `stop`) {
				collector.stop()
				return
			}
			const game = await games.get(message.channel.id)
			try {
				await eval(`(async () => {${content}})()`)
				console.log(`Evaluated command ${content}`)
			}
			catch (error) {
				c_message.reply(`An error occurred: ${error}`)
			}
		})
		collector.on(`end`, () => {
			message.channel.send(`Debug session closed.`)
		})
	},
};
