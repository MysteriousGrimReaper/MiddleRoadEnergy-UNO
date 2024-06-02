const { QuickDB } = require("quick.db");
const { display_names, embed_colors } = require("../enums.json");
const {
	EmbedBuilder,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
} = require("discord.js");
const db = new QuickDB();
const games = db.table("games");
module.exports = {
	name: `table`,
	aliases: [`t`],
	async execute(message, game) {
		const { author, channel } = message;
		const { on, table, deck, players } = game;
		const { cards, current_turn } = table;
		if (!on) {
			return;
		}
		const top_card = cards[cards.length - 1];
		const table_embed = new EmbedBuilder()
			.setDescription(
				`It's currently <@${
					players[current_turn].id
				}>'s turn. The current card is **${
					display_names[top_card.color]
				} ${top_card.icon}**.\n\n<@${players[0].id}> - **${
					players[0].hand.length
				} cards**\n<@${players[1].id}> - **${
					players[1].hand.length
				} cards**`
			)
			.setColor(parseInt(embed_colors[top_card.color], 16))
			.setThumbnail(
				`https://raw.githubusercontent.com/MysteriousGrimReaper/MiddleRoadEnergy-UNO/main/cards/${
					top_card.color
				}${top_card.wild ? `WILD` : ``}${top_card.icon}.png`
			)
			.setFooter({
				iconURL: `https://raw.githubusercontent.com/MysteriousGrimReaper/MiddleRoadEnergy-UNO/main/cards/logo.png`,
				text: `Deck: ${game.deck.length} cards remaining | Discarded: ${game.table.cards.length}`,
			});
		const hand_button = new ButtonBuilder()
			.setCustomId(`hand`)
			.setStyle(ButtonStyle.Primary)
			.setLabel(`Hand`)
			.setEmoji(`🎴`);
		const table_button = new ButtonBuilder()
			.setCustomId(`table`)
			.setStyle(ButtonStyle.Secondary)
			.setLabel(`Table`)
			.setEmoji(`🎨`);
		const history_button = new ButtonBuilder()
			.setCustomId(`history`)
			.setStyle(ButtonStyle.Success)
			.setLabel(`History`)
			.setEmoji(`🔄`);

		const button_row = new ActionRowBuilder().setComponents([
			hand_button,
			table_button,
			history_button,
		]);
		return await message.reply({
			embeds: [table_embed],
			components: [button_row],
		});
	},
};
