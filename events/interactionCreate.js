const { Events, EmbedBuilder, PermissionsBitField } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const games = db.table("games");
const { display_names, embed_colors } = require("../enums.json");
const GameEmbeds = require("../structures/embeds");
module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction?.isButton()) {
			return;
		}
		const game_cache = require("../index");
		//console.log(`interaction created`);

		try {
			// console.log(`deferring reply`);
			await interaction.deferReply({ ephemeral: true });
		} catch (error) {
			console.log(`The interaction thing failed again....`);
			console.log(error);
			console.log(interaction);
			await (await interaction.client.users.fetch("315495597874610178")).send(`<@315495597874610178>\n${error}`)
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
				(!is_player && game.settings.viewers_see_history != "false");
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
							const hand_embed = (await GameEmbeds.defaultEmbed(game))
								.setAuthor({
									name: author.displayName,
									iconURL: author.avatarURL(),
								})
								.setDescription(player_hand)
							const p_index = players.indexOf(player);

							await interaction.editReply({
								ephemeral: true,
								embeds: [hand_embed],
							});
						} catch (error) {
							console.log(error)
							await interaction.channel.send(`<@315495597874610178> ${error}`)
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
						const table_embed = await GameEmbeds.tableEmbed(game)
						return await interaction.editReply({
							ephemeral: true,
							embeds: [table_embed],
						});
					} catch (error) {
						console.log(error)
						await interaction.channel.send(`<@315495597874610178> ${error}`)
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

					const history_embed = (await GameEmbeds.defaultEmbed(game))
						.setTitle(
							`${cards_played} cards have been played since the last shuffle. Card history is as follows:`
						)
						.setDescription(chart_text)
					return await interaction.editReply({
						ephemeral: true,
						embeds: [history_embed],
					});
					break;
				case `stats`:
					const stats_embed = GameEmbeds.statsEmbed(game, top_card)
						
					return await interaction.editReply({
						ephemeral: true,
						embeds: [stats_embed],
					});
					break;
			}
		} catch (error) {
			await interaction.channel.send(`<@315495597874610178> ${error}`)
		}
	},
};
