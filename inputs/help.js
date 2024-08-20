const { EmbedBuilder } = require("discord.js");
module.exports = {
	name: `help`,
	aliases: [],
	async execute(message) {
		const help_embed = new EmbedBuilder()
			.setTitle(`Player Commands`)
			.addFields(
				{name: `Basic Commands`, value: `**uno play <color> <number>** - Play a card.\n**uno draw** - Draw a card.\n**uno!** - Say "UNO!"\n**uno callout** - Call out someone not saying UNO.\n**uno pp** - Use a power play.`},
				{name: `Extra Commands`, value: `**uno log** - See the game log.\n**uno ping** - Get pinged when it's your turn.\n**uno name <name>** - Change your name.`},
				{name: `Chaining Commands`, value: `Put \`&&\` between commands in order to run multiple in a row. As an example:\n\`uno p g6&&p b6\` will play a Green 6, and then a Blue 6 afterwards.\nYou can also chain UNO calls, draws, and power plays.`}
			)
			.setColor(0xdddddd);
		return await message.reply({
			embeds: [help_embed],
		});
	},
};
