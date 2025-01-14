const { EmbedBuilder } = require("discord.js");
module.exports = {
	name: `help`,
	aliases: [],
	async execute(message) {
		const help_embed = new EmbedBuilder()
			.setTitle(`Referee Commands`)
			.addFields(
				{name: `Start Commands`, value: `**ref init <@player1> <@player2>** - Start a series between the two players. The player pinged first will start the first game.\n**ref start** - Start the game.`},
				{name: `Setting Commands`, value: `**ref cards <number>** - Set the number of starting cards.
**ref bestof** - Set the total number of games the series could last.
**ref pp <number>** - Set the number of power plays each player has.
**ref ti <#-#-#-#-...>** - Set the order in which players start. For example, 2-2-2-1 means that Player 1 starts 2 matches, Player 2 starts 2 matches, Player 1 starts 2 matches, and Player 2 starts the final match.
**ref theme** - Set the card theme of the game.
\`set\` - Sets the theme.
\`add\` - Adds a theme.
\`remove\` - Removes a theme.
\`load\` - Loads a theme.`},
                {name: `Administrative Commands`, value: `**ref close** - Closes the series.\n**ref pass** - Skips the current player's turn.`},
                {name: `Toggles`, value: `These settings apply guild-wide, so there's no need to run them in multiple channels.\n**ref toggle max_command_chain <number>** - Set the maximum number of commands that can be listed in 1 message (set to 0 for no limit).\n**ref toggle viewers_see_history true/false** - Set whether viewers can see game history.\n**ref toggle viewers_see_table true/false** - Set whether viewers can see the table.\n**ref toggle players_see_history true/false** - Set whether players can see the game history.\n**ref toggle custom_cards true/false** - Set whether the game uses custom cards or not.`}
            )
			.setColor(0xdddddd);
		return await message.reply({
			embeds: [help_embed],
		});
	},
};
