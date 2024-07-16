const { EmbedBuilder } = require("discord.js");
module.exports = {
	name: `help`,
	aliases: [],
	async execute(message) {
		const help_embed = new EmbedBuilder()
			.setTitle(`Basic Commands`)
			.setDescription(
				`Play a card: **uno play <color> <number>**\nDraw: **uno draw**\nSay "UNO!": **uno!**\nCall out someone not saying UNO: **uno callout**\nUse a power play: **uno pp**`
			)
			.setColor(0xdddddd);
		const adv_embed = new EmbedBuilder()
			.setTitle(`Extra Commands`)
			.setDescription(
				`See the game log: **uno log**\nGet pinged when it's your turn: **uno ping**\nChange your name: **uno name <name>**`
			);
		return await message.reply({
			embeds: [help_embed, adv_embed],
		});
	},
};
