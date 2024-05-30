const { Events, EmbedBuilder } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const games = db.table("games");
const { display_names, embed_colors } = require("../enums.json");
const hand = require("../inputs/hand");
module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		const { user, channel, customId } = interaction;
		if (!interaction.isButton()) {
			return;
		}
		const game = await games.get(channel.id);
		if (!game) {
			return await interaction.reply({
				ephemeral: true,
				content: `There's no game happening in this channel!`,
			});
		}
		const { players, table } = game;
		const { current_turn, cards } = table;
		const top_card = cards[cards.length - 1];
		const author = user;
		switch (customId) {
			case `hand`:
				if (!game.players.map((p) => p.id).includes(user.id)) {
					return await interaction.reply({
						ephemeral: true,
						content: `You're not in the game!`,
					});
				} else {
					const player = players.find((p) => p.id == author.id);
					const player_hand = player.hand
						.map(
							(card) =>
								`- ${display_names[card.color]} ${card.icon}`
						)
						.sort();
					const hand_embed = new EmbedBuilder()
						.setAuthor({
							name: author.displayName,
							iconURL: author.avatarURL(),
						})
						.setDescription(player_hand.join(`\n`))
						.setColor(
							parseInt(
								embed_colors[
									game.table.cards[
										game.table.cards.length - 1
									].color
								],
								16
							)
						)
						.setFooter({
							text: `${
								player.hand.length
							} cards | Current card: ${
								display_names[
									game.table.cards[
										game.table.cards.length - 1
									].color
								]
							} ${
								game.table.cards[game.table.cards.length - 1]
									.icon
							}`,
						});
					return await interaction.reply({
						ephemeral: true,
						embeds: [hand_embed],
					});
				}
			case `table`:
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
						`https://raw.githubusercontent.com/MysteriousGrimReaper/MiddleRoadEnergy-UNO/main/cards/${top_card.color}${top_card.icon}.png`
					)
					.setFooter({
						iconURL: `https://raw.githubusercontent.com/MysteriousGrimReaper/MiddleRoadEnergy-UNO/main/cards/logo.png`,
						text: `Deck: ${game.deck.length} cards remaining | Discarded: ${game.table.cards.length}`,
					});
				return await interaction.reply({
					ephemeral: true,
					embeds: [table_embed],
				});
		}
	},
};
