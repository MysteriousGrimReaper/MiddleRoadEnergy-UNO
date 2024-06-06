const { Events, EmbedBuilder, PermissionsBitField } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const games = db.table("games");
const { display_names, embed_colors } = require("../enums.json");
const hand = require("../inputs/hand");
module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		try {
			const { user, channel, customId } = interaction;
			if (!interaction.isButton()) {
				return;
			}
			const game = await games.get(channel.id);
			if (!game) {
				return await interaction.editReply({
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
						return await interaction.editReply({
							ephemeral: true,
							content: `You're not in the game!`,
						});
					} else {
						try {
							const order = [`R`, `G`, `Y`, `B`, `WILD`];
							const player = players.find(
								(p) => p.id == author.id
							);
							const player_hand_a = player.hand.toSorted(
								(a, b) =>
									order.indexOf(a.color) -
									order.indexOf(b.color)
							);
							const player_hand = player_hand_a.reduce(
								(acc, cv, index) =>
									acc +
									`${
										cv.color !=
										player_hand_a[index - 1]?.color
											? `\n- `
											: ` | `
									}${
										cv.wild ||
										cv.color == top_card.color ||
										cv.icon == top_card.icon
											? `**`
											: ``
									}${display_names[cv.color]}${
										cv.wild && cv.icon == `` ? `` : ` `
									}${cv.icon}${
										cv.wild ||
										cv.color == top_card.color ||
										cv.icon == top_card.icon
											? `**`
											: ``
									}`,
								``
							);
							const hand_embed = new EmbedBuilder()
								.setAuthor({
									name: author.displayName,
									iconURL: author.avatarURL(),
								})
								.setDescription(player_hand)
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
										game.table.cards[
											game.table.cards.length - 1
										].icon
									}`,
								});
							return await interaction.editReply({
								ephemeral: true,
								embeds: [hand_embed],
							});
						} catch (error) {
							return await interaction.editReply({
								ephemeral: true,
								content: `An error has occurred!`,
							});
						}
					}
				case `table`:
					const table_embed = new EmbedBuilder()
						.setDescription(
							`It's currently ${
								players[current_turn].name
							}'s turn. The current card is **${
								display_names[top_card.color]
							} ${top_card.icon}**.\n\n${players[0].name} - **${
								players[0].hand.length
							} cards | ${players[0].pp} PP**\n${
								players[1].name
							} - **${players[1].hand.length} cards | ${
								players[1].pp
							} PP**`
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
					return await interaction.editReply({
						ephemeral: true,
						embeds: [table_embed],
					});
				case `history`:
					if (
						!game.players
							.map((p) => p.id)
							.includes(interaction.user.id) &&
						!interaction.member.permissions.has(
							PermissionsBitField.Flags.ManageGuild
						)
					) {
						return await interaction.editReply({
							ephemeral: true,
							content: `You can't view the history, you're not a player!`,
						});
					}
					const cards_played =
						game.players[0].stats.cards_played +
						game.players[1].stats.cards_played;
					const card_chart = game.table.cards.reduce(
						(acc, cv) => {
							console.log(acc);
							if (cv.wild) {
								acc["WILD"].push(cv);
							} else {
								acc[cv.color].push(cv.icon);
							}
							return acc;
						},
						{ R: [], G: [], Y: [], B: [], WILD: [] }
					);
					console.log(card_chart);
					const chart_text = `Red: ${card_chart.R.sort().join(
						`, `
					)}\nGreen: ${card_chart.G.sort().join(
						`, `
					)}\nYellow: ${card_chart.Y.sort().join(
						`, `
					)}\nBlue: ${card_chart.B.sort().join(
						`, `
					)}\nWild: ${card_chart.WILD.map(
						(card) => `WILD` + `${card.icon == `+4` ? ` +4` : ``}`
					)
						.sort()
						.join(`, `)}`;

					// currently unused
					const full_history = game.table.cards
						.map(
							(card) =>
								`${display_names[card.color]} ${
									card.icon == `` && card.color != `WILD`
										? `WILD`
										: card.icon
								}`
						)
						.join(` | `);

					const history_embed = new EmbedBuilder()
						.setTitle(
							`${cards_played} cards have been played so far. Card history is as follows:`
						)
						.setDescription(chart_text)
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
					return await interaction.editReply({
						ephemeral: true,
						embeds: [history_embed],
					});
			}
		} catch (error) {
			await interaction.editReply(`An error has occurred!`);
			console.log(error);
		}
	},
};
