module.exports = {
	name: `help`,
	aliases: [],
	async execute(message) {
		const help_embed = new EmbedBuilder()
			.setDescription(
				`Play a card: **uno play <color> <number>**\nDraw: **uno draw**\nSay "UNO!": **uno!**\nUse a power play: **uno pp**`
			)
			.setColor(0xdddddd);
		return await message.reply({
			embeds: [help_embed],
		});
	},
};
