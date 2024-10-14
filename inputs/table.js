const GameEmbeds = require("../structures/embeds");
const button_row = require("../structures/button-row")
module.exports = {
	name: `table`,
	aliases: [`t`],
	async execute(message, game) {
		const { on } = game;
		if (!on) {
			return;
		}
		const table_embed = GameEmbeds.tableEmbed(game)
		return await message.reply({
			embeds: [table_embed],
			components: [button_row],
		});
	},
};
