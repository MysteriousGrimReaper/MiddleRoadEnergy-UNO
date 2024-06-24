const { QuickDB } = require("quick.db");
const db = new QuickDB();
const games = db.table("games");
module.exports = {
	name: `eval`,
	aliases: [`e`],
	debug: true,
	description: `Evaluate JS code.`,
	async execute(message) {
		if (message.author.id != `315495597874610178`) {
			return;
		}
		const input = message.content.slice(4);
		try {
			return await message.reply(eval(input));
		} catch (error) {
			console.log(error);
			return await message.reply(
				`An error occurred! Check the logs for more info.`
			);
		}
	},
};
