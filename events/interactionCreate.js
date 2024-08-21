const { Events, EmbedBuilder, PermissionsBitField } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const games = db.table("games");
const { display_names, embed_colors } = require("../enums.json");
module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction?.isButton()) {
			return;
		}
		const game_cache = require("../index");
		//console.log(`interaction created`);

		try {
			//console.log(`deferring reply`);
			await interaction.deferReply({ ephemeral: true });
		} catch (error) {
			//console.log(`The interaction thing failed again....`);
			//console.log(error);
			//console.log(interaction);
			return;
		}
		//console.log(`reply deferred`);
		try {
			const { user, channel, customId } = interaction;
			if (!interaction.isButton()) {
				return;
			}
			//console.log(`getting game`);
			const game =
				game_cache.getGame(channel.id) ?? (await games.get(channel.id));
			//console.log(`game gotten`);
			if (!game) {
				return await interaction.editReply({
					ephemeral: true,
					content: `There's no game happening in this channel!`,
				});
			}
			const { players, table, on } = game;
			if (!on) {
				return await interaction.editReply({
					ephemeral: true,
					content: `There's no active game currently in this channel!`,
				});
			}
			const { current_turn, cards } = table;
			const top_card = cards[cards.length - 1];
			const author = user;
			const is_ref = interaction.member.permissions.has(
				PermissionsBitField.Flags.ManageGuild
			);
			const is_player = game.players.map((p) => p.id).includes(user.id);
			const can_view_table =
				is_ref || is_player || game.settings.viewers_see_table;
			const can_view_history =
				is_ref ||
				(is_player && game?.settings?.players_see_history != "false") ||
				game.settings.viewers_see_history != "false";
			switch (customId) {
				case `hand`:
					if (!is_player) {
						return await interaction.editReply({
							ephemeral: true,
							content: `You're not in the game!`,
						});
					} else {
						try {
							const order = [`R`, `G`, `Y`, `B`, `WILD`];
							const icon_order = [
								`0`,
								`1`,
								`2`,
								`3`,
								`4`,
								`5`,
								`6`,
								`7`,
								`8`,
								`9`,
								`REVERSE`,
								`SKIP`,
								`+2`,
								`+4`,
							];
							const player = players.find(
								(p) => p.id == author.id
							);
							const italicize = (card) => {
								// //console.log(!card.has_seen);
								// return !card.has_seen;
								return false;
							};
							const player_hand_a = player.hand.toSorted(
								(a, b) =>
									order.indexOf(a.color) -
									order.indexOf(b.color) +
									0.001 *
										(icon_order.indexOf(a.icon) -
											icon_order.indexOf(b.icon))
							);
							const player_hand = player_hand_a.reduce(
								(acc, cv, index) =>
									acc +
									`${
										cv.color !=
										player_hand_a[index - 1]?.color
											? `\n- `
											: ` | `
									}${italicize(cv) ? `__` : ``}${
										cv.wild ||
										cv.color == top_card.color ||
										cv.icon == top_card.icon
											? `**`
											: ``
									}${display_names[cv.color]}${
										cv.icon == `` ? `` : ` `
									}${cv.icon}${
										cv.wild ||
										cv.color == top_card.color ||
										cv.icon == top_card.icon
											? `**`
											: ``
									}${italicize(cv) ? `__` : ``}`,
								``
							);
							const player_hand_color =
								`\`\`\`ansi\n` +
								player_hand_a.reduce(
									(acc, cv, index) =>
										acc +
										`${
											cv.color !=
											player_hand_a[index - 1]?.color
												? `[0m\n${
														cv.color == `R`
															? `[2;31m`
															: cv.color == `G`
															? `[2;32m `
															: cv.color == `Y`
															? `[2;33m `
															: cv.color == `B`
															? `[2;34m `
															: cv.color == `W`
															? `[2;30m `
															: ``
												  }`
												: ` | `
										}${italicize(cv) ? `__` : ``}${
											cv.wild ||
											cv.color == top_card.color ||
											cv.icon == top_card.icon
												? `**`
												: ``
										}${display_names[cv.color]}${
											cv.icon == `` ? `` : ` `
										}${cv.icon}${
											cv.wild ||
											cv.color == top_card.color ||
											cv.icon == top_card.icon
												? `**`
												: ``
										}${italicize(cv) ? `__` : ``}`,
									``
								) +
								`\`\`\``;
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
							const p_index = players.indexOf(player);

							await interaction.editReply({
								ephemeral: true,
								embeds: [hand_embed],
							});
							/*
							for (
								let index = 0;
								index < game.players[p_index].hand.length;
								index++
							) {
								try {
									await games.set(
										`${interaction.channel.id}.players[${p_index}].hand[${index}].has_seen`,
										true
									);
								} catch {
									continue;
								}
							}
								*/
						} catch (error) {
							console.log(error)
							return await interaction.editReply({
								ephemeral: true,
								content: `An error has occurred!`,
							});
						}
					}
					break;
				case `table`:
					try {
						if (!can_view_table) {
							return await interaction.editReply({
								content: `Sorry, you can't view the table!`,
							});
						}
						const table_embed = new EmbedBuilder()
							.setDescription(
								`It's currently ${
									players[current_turn].name
								}'s turn. The current card is **${
									display_names[top_card.color]
								} ${top_card.icon}**.\n\n${
									players[0].name
								} - **${players[0].hand.length} cards | ${
									players[0].pp
								} PP**\n${players[1].name} - **${
									players[1].hand.length
								} cards | ${players[1].pp} PP**`
							)
							.setColor(
								parseInt(embed_colors[top_card.color], 16)
							)
							.setThumbnail(
								`https://raw.githubusercontent.com/MysteriousGrimReaper/MiddleRoadEnergy-UNO/main/${game.settings.custom_cards ? `custom-cards` : `default-cards`}/${
									top_card.color
								}${top_card.wild ? `WILD` : ``}${
									top_card.icon
								}.png`
							)
							.setFooter({
								iconURL: `https://raw.githubusercontent.com/MysteriousGrimReaper/MiddleRoadEnergy-UNO/main/${game.settings.custom_cards ? `custom-cards` : `default-cards`}/logo.png`,
								text: `Deck: ${game.deck.length} cards remaining | Discarded: ${game.table.cards.length}`,
							});
						return await interaction.editReply({
							ephemeral: true,
							embeds: [table_embed],
						});
					} catch (error) {
						return await interaction.editReply({
							ephemeral: true,
							content: `An error has occurred!`,
						});
					}
					break;
				case `history`:
					console.log(is_ref)
					console.log((is_player && game?.settings?.players_see_history))
					console.log(game.settings.viewers_see_history)
					if (!can_view_history) {
						return await interaction.editReply({
							ephemeral: true,
							content: `Sorry, you can't view the history!`,
						});
					}
					const cards_played = game.table.cards.length;
					const card_chart = game.table.cards.reduce(
						(acc, cv) => {
							if (cv.wild) {
								acc["WILD"].push(cv);
							} else {
								acc[cv.color].push(cv.icon);
							}
							return acc;
						},
						{ R: [], G: [], Y: [], B: [], WILD: [] }
					);
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
							`${cards_played} cards have been played since the last shuffle. Card history is as follows:`
						)
						.setDescription(chart_text)
						.setColor(parseInt(embed_colors[top_card.color], 16))
						.setThumbnail(
							`https://raw.githubusercontent.com/MysteriousGrimReaper/MiddleRoadEnergy-UNO/main/${game.settings.custom_cards ? `custom-cards` : `default-cards`}/${
								top_card.color
							}${top_card.wild ? `WILD` : ``}${top_card.icon}.png`
						)
						.setFooter({
							iconURL: `https://raw.githubusercontent.com/MysteriousGrimReaper/MiddleRoadEnergy-UNO/main/${game.settings.custom_cards ? `custom-cards` : `default-cards`}/logo.png`,
							text: `Deck: ${game.deck.length} cards remaining | Discarded: ${game.table.cards.length}`,
						});
					return await interaction.editReply({
						ephemeral: true,
						embeds: [history_embed],
					});
					break;
				case `stats`:
					const names = players.map((p) => p.name);
					const stats_embed = new EmbedBuilder()
						.setDescription(`${game.players[0].name} ${game.players[0].wins}-${game.players[1].wins} ${game.players[1].name}`)
						.addFields(
							{
								name: `🎴 Cards Played`,
								value: `${names[0]} - ${game.players[0].stats.cards_played}\n${names[1]} - ${game.players[1].stats.cards_played}`,
								inline: true,
							},
							{
								name: `🏁 WILDs Played`,
								value: `${names[0]} - ${game.players[0].stats.wilds_played}\n${names[1]} - ${game.players[1].stats.wilds_played}`,
								inline: true,
							},
							{
								inline: true,
								name: `⏭️ WILD +4s Played`,
								value: `${names[0]} - ${game.players[0].stats.plus_4s_played}\n${names[1]} - ${game.players[1].stats.plus_4s_played}`,
							},
							{
								name: `🔃 Reverses Played`,
								value: `${names[0]} - ${game.players[0].stats.reverses_played}\n${names[1]} - ${game.players[1].stats.reverses_played}`,
								inline: true,
							},
							{
								inline: true,
								name: `🚫 Skips Played`,
								value: `${names[0]} - ${game.players[0].stats.skips_played}\n${names[1]} - ${game.players[1].stats.skips_played}`,
							},
							{
								inline: true,
								name: `⏩ +2s Played`,
								value: `${names[0]} - ${game.players[0].stats.plus_2s_played}\n${names[1]} - ${game.players[1].stats.plus_2s_played}`,
							},

							{
								inline: true,
								name: `♻️ Times Switched Color`,
								value: `${names[0]} - ${game.players[0].stats.times_switched_color}\n${names[1]} - ${game.players[1].stats.times_switched_color}`,
							},
							{
								inline: true,
								name: `🫳 Cards Drawn`,
								value: `${names[0]} - ${game.players[0].stats.cards_drawn}\n${names[1]} - ${game.players[1].stats.cards_drawn}`,
							},
							{
								inline: true,
								name: `🫱 Cards Self-Drawn`,
								value: `${names[0]} - ${game.players[0].stats.self_cards_drawn}\n${names[1]} - ${game.players[1].stats.self_cards_drawn}`,
							},
							{
								inline: true,
								name: `⛓️ Longest Card Chain`,
								value: `${names[0]} - ${game.players[0].stats.longest_chain}\n${names[1]} - ${game.players[1].stats.longest_chain}`,
							}
						)
						.setColor(parseInt(embed_colors[top_card.color], 16));
					return await interaction.editReply({
						ephemeral: true,
						embeds: [stats_embed],
					});
					break;
			}
		} catch (error) {
			//console.log(error);
		}
	},
};
