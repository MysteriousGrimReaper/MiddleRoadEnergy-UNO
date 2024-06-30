const { QuickDB } = require("quick.db");
const { display_names, embed_colors } = require("../enums.json");
const { base, large } = require("../deck.json");
function shuffleArray(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]]; // Swap elements
	}
	return array;
}
const {
	EmbedBuilder,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
} = require("discord.js");
const db = new QuickDB();
const games = db.table("games");
const settings = db.table("settings");
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
const stats_button = new ButtonBuilder()
	.setCustomId(`stats`)
	.setStyle(ButtonStyle.Success)
	.setLabel(`Stats`)
	.setEmoji(`📊`);
const button_row = new ActionRowBuilder().setComponents([
	hand_button,
	table_button,
	history_button,
	stats_button,
]);
module.exports = {
	name: `play`,
	aliases: [`p`],
	async execute(message, game, content) {
		const { author, channel, client } = message;
		const { on, table, deck, players } = game;
		const { current_turn, cards } = table;
		const chain_update = () => {
			if (game.table.current_turn == current_turn) {
				game.players[current_turn].chain++;
			} else {
				game.players[current_turn].chain = 0;
			}
			if (
				game.players[current_turn].stats.longest_chain <=
				game.players[current_turn].chain + 1
			) {
				game.players[current_turn].stats.longest_chain =
					game.players[current_turn].chain + 1;
			}
		};
		if (game.processing) {
			return;
		}
		if (!on) {
			return await message.reply(`The game has not started yet!`);
		}
		if (author.id != players[0].id && author.id != players[1].id) {
			return await message.reply(`You're not in the game!`);
		}
		if (
			(current_turn == 0 && author.id != players[0].id) ||
			(current_turn == 1 && author.id != players[1].id)
		) {
			return await message.reply(`It's not your turn yet!`);
		}
		const users = [];
		for (const p of players) {
			users.push(await client.users.fetch(p.id));
		}
		const parseColor = (color) => {
			switch ((color || "").toLowerCase()) {
				case "red":
				case "r":
					color = "R";
					break;
				case "yellow":
				case "y":
					color = "Y";
					break;
				case "green":
				case "g":
					color = "G";
					break;
				case "blue":
				case "b":
					color = "B";
					break;
				default:
					color = "";
					break;
			}
			return color;
		};
		let args = content.toUpperCase().split(" ");
		args = args.filter((a) => !a.includes(`!`));
		const uno_flag = content.includes(`!`);
		while (
			args[0] == `UNO` ||
			args[0] == `P` ||
			args[0] == `PLAY` ||
			args[0] == `UNOP` ||
			args[0] == `UNOPLAY`
		) {
			args.shift();
		}

		const getCard = async () => {
			let color, icon;

			if (args.length === 1) {
				let f = args[0][0].toLowerCase();
				let _c = parseColor(f);
				if (_c) {
					color = _c;
					icon = args[0].substring(1);
				} else {
					icon = args[0];
				}
			} else {
				color = args[0];
				icon = args[1];
			}
			if (!icon) {
				await message.reply(
					"Something went wrong. Did you provide a proper card?"
				);
				return null;
			}
			let wild = ["WILD", "WILD+4"];
			let alias = {
				W: "WILD",
				"W+4": "WILD+4",
				REV: "REVERSE",
				R: "REVERSE",
				NOU: "REVERSE",
				S: "SKIP",
				"W +4": "WILD+4",
			};
			let _color = parseColor(color);

			if (!_color) {
				if (
					!color &&
					(wild.includes(icon.toUpperCase()) ||
						wild.includes(alias[icon.toUpperCase()]))
				) {
					await games.set(`${channel.id}.processing`, true);
					let first = true;
					while (!_color) {
						if (first) {
							await message.reply(
								"You played a **wild card**! In your next message, say just the color you want the **wild card** to be."
							);
						} else {
							await channel.send(
								"Say just the color for your **wild card**. One of: red, yellow, green, or blue."
							);
						}
						const card_promise = new Promise((resolve, reject) => {
							const collector = channel.createMessageCollector({
								filter: (m) => m.author.id == message.author.id,
							});
							collector.on(`collect`, (msg) => {
								_color = parseColor(msg.content);
								collector.stop();
							});
							collector.on(`end`, () => resolve(_color));
						});
						await card_promise;
						first = false;
					}
				} else {
					[color, icon] = [icon, color];
					_color = parseColor(color);
					if (!_color) {
						await channel.send(
							"You have to specify a valid color! Colors are **red**, **yellow**, **green**, and **blue**." +
								"\n`uno play <color> <value>`"
						);
						return null;
					}
				}
			}
			await games.delete(`${channel.id}.processing`);
			color = _color;
			if (alias[icon.toUpperCase()]) {
				icon = alias[icon.toUpperCase()];
			}
			const hand =
				message.author.id == players[0].id
					? players[0].hand
					: players[1].hand;
			if (["WILD", "WILD+4"].includes(icon.toUpperCase())) {
				let card = hand.find(
					(c) =>
						c.icon === icon.toUpperCase() ||
						"WILD" + c.icon === icon.toUpperCase()
				);
				if (!card) {
					return undefined;
				}
				card.color = color;
				return card;
			} else {
				return hand.find(
					(c) => c.icon === icon.toUpperCase() && c.color === color
				);
			}
		};
		let card = await getCard();
		if (card === null) {
			return;
		}
		if (!card) {
			return "It doesn't seem like you have that card! Try again.";
		}
		let top_card = table.cards[table.cards.length - 1];
		if (
			!top_card.color ||
			card.wild ||
			top_card.color == `WILD` ||
			card.icon === top_card.icon ||
			card.color === top_card.color
		) {
			if (card.color != top_card.color) {
				game.players[current_turn].stats.times_switched_color++;
			}
			game.table.cards.push(card);
			game.players[current_turn].hand.splice(
				game.players[current_turn].hand.indexOf(card),
				1
			);
			game.players[current_turn].stats.cards_played++;
			game.players[current_turn].uno = false;

			let extra = "";
			// stats switch
			switch (card.icon) {
				case "REVERSE":
					game.players[current_turn].stats.reverses_played++;
					break;
				case "SKIP":
					game.players[current_turn].stats.skips_played++;
					break;
				case "+2":
					game.players[current_turn].stats.plus_2s_played++;
					break;
				case "+4": {
					// let player = game.queue.shift();
					game.players[current_turn].stats.plus_4s_played++;
				}
			}
			switch (card.icon) {
				case "REVERSE":
				case "SKIP":
					game.table.current_turn++;
					game.table.current_turn %= 2;
					extra = `Sorry, ${
						game.players[game.table.current_turn].name
					}! Skip a turn! `;
					break;
				case "+2":
					let amount = 0;
					for (let i = table.cards.length - 1; i >= 0; i--) {
						if (table.cards[i].icon === "+2") {
							amount += 2;
						} else {
							break;
						}
					}
					if (game.deck.length < amount) {
						await channel.send(`*Reshuffling the deck...*`);
						while (table.cards.length > 1) {
							game.deck.push(game.table.cards.shift());
						}
						game.deck = shuffleArray(game.deck);
					}
					const draw_chunk = game.deck.splice(0, amount);
					game.players[1 - current_turn].hand.push(...draw_chunk);
					game.players[1 - current_turn].stats.cards_drawn += amount;
					extra = `${
						game.players[1 - current_turn].name
					} picks up ${amount} cards! Tough break. `;
					extra += " Also, skip a turn!";
					game.table.current_turn++;
					game.table.current_turn %= 2;
					break;
				case "WILD":
					extra = `In case you missed it, the current color is now **${
						display_names[
							game.table.cards[game.table.cards.length - 1]
						]
					}**! `;
					break;
				case "+4": {
					// let player = game.queue.shift();
					const amount = 4;
					if (game.deck.length < amount) {
						await channel.send(`*Reshuffling the deck...*`);
						while (table.cards.length > 1) {
							game.deck.push(game.table.cards.shift());
						}
						game.deck = shuffleArray(game.deck);
					}
					const draw_chunk = game.deck.splice(0, amount);
					game.players[1 - current_turn].hand.push(...draw_chunk);
					game.players[1 - current_turn].stats.cards_drawn += amount;
					extra = `${
						game.players[1 - current_turn].name
					} picks up 4! The current color is now **${
						display_names[
							game.table.cards[game.table.cards.length - 1].color
						]
					}**! `;
					extra += " Also, skip a turn!";
					game.table.current_turn++;
					game.table.current_turn %= 2;
					break;
				}
			}
			if (card.wild && card.icon != `+4`) {
				game.players[current_turn].stats.wilds_played++;
			}
			game.table.current_turn++;
			game.table.current_turn %= 2;
			console.log(game.table.current_turn);
			top_card = game.table.cards[game.table.cards.length - 1];
			game.history.push({
				player: game.players[current_turn].name,
				top_card,
			});
			const play_embed = new EmbedBuilder()
				.setDescription(
					`A **${display_names[top_card.color]} ${
						top_card.wild ? `WILD` : ``
					}${
						top_card.icon
					}** has been played. ${extra}\n\nIt is now ${
						game.players[game.table.current_turn].name
					}'s turn!`
				)
				.setColor(parseInt(embed_colors[top_card.color], 16))
				.setThumbnail(
					`https://raw.githubusercontent.com/MysteriousGrimReaper/MiddleRoadEnergy-UNO/main/custom-cards/${
						top_card.color
					}${top_card.wild ? `WILD` : ``}${top_card.icon}.png`
				)
				.setFooter({
					iconURL: `https://raw.githubusercontent.com/MysteriousGrimReaper/MiddleRoadEnergy-UNO/main/custom-cards/logo.png`,
					text: `Deck: ${game.deck.length} cards remaining | Discarded: ${game.table.cards.length}`,
				});
			await channel.send({
				embeds: [play_embed],
				components: [button_row],
			});
			if (game.players[current_turn].hand.length === 0) {
				await channel.send(
					`Good game! ${game.players[current_turn].name} has won!`
				);
				game.players[current_turn].wins++;
				// reset
				while (game.players[0].hand.length > 0) {
					game.deck.push(game.players[0].hand.pop());
				}
				while (game.players[1].hand.length > 0) {
					game.deck.push(game.players[1].hand.pop());
				}
				while (game.table.cards.length > 0) {
					game.deck.push(game.table.cards.pop());
				}
				game.deck = shuffleArray(base);
				game.on = false;
				game.log[game.matches_finished].end = Date.now();
				game.log[game.matches_finished].winner = current_turn;
				game.matches_finished++;
				game.powerplay = false;
				chain_update();
				game.table.current_turn =
					game.turn_indicator[game.matches_finished];

				const status =
					game.players[0].wins > game.players[1].wins
						? 1
						: game.players[0].wins < game.players[1].wins
						? -1
						: 0;
				const names = players.map((p) => p.name);
				const scoreboard = `${status >= 0 ? `**` : ``}${names[0]} ${
					game.players[0].wins
				}${status > 0 ? `**` : ``} - ${status < 0 ? `**` : ``}${
					game.players[1].wins
				} ${names[1]}${status <= 0 ? `**` : ``}`;
				const match_is_finished =
					game.bestof / 2 < game.players[0].wins ||
					game.bestof / 2 < game.players[1].wins ||
					game.matches_finished == game.bestof;
				const final_embed_title = match_is_finished
					? status > 0
						? `${names[0]} HAS WON THE SERIES! (${game.players[0].wins}-${game.players[1].wins})`
						: `${names[1]} HAS WON THE SERIES! (${game.players[1].wins}-${game.players[0].wins})`
					: `Current Match Statistics`;
				const stats_embed = new EmbedBuilder()
					.setTitle(final_embed_title)
					.setDescription(`${scoreboard}`)
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
							name: `⛓️ Longest Card Chain`,
							value: `${names[0]} - ${game.players[0].stats.longest_chain}\n${names[1]} - ${game.players[1].stats.longest_chain}`,
						}
					)
					.setColor(parseInt(embed_colors[top_card.color], 16))
					.setThumbnail(users[current_turn].avatarURL())
					.setFooter({
						text: match_is_finished
							? `Congratulations, ${
									status > 0 ? names[0] : names[1]
							  }!`
							: `${
									players[game.table.current_turn].name
							  } starts the next match! Referee, make sure to use ref cards <number> to set the card count before the match starts.`,
						iconURL: match_is_finished
							? status > 0
								? users[0].avatarURL()
								: users[1].avatarURL()
							: users[game.table.current_turn].avatarURL(),
					});

				await channel.send({ embeds: [stats_embed] });
				const game_cache = require("../index");
				game_cache.setGame(channel.id, game);
				return await games.set(`${channel.id}`, game);
			}

			if (game.powerplay && current_turn != game.table.current_turn) {
				const amount = 1;
				if (game.deck.length < amount) {
					await channel.send(`*Reshuffling the deck...*`);
					while (table.cards.length > 1) {
						game.deck.push(game.table.cards.shift());
					}
					game.deck = shuffleArray(game.deck);
				}
				const draw_chunk = game.deck.splice(0, amount);
				game.players[game.table.current_turn].hand.push(...draw_chunk);
				game.players[game.table.current_turn].stats.cards_drawn +=
					amount;
				game.table.current_turn++;
				game.table.current_turn %= 2;
				const pp_embed = new EmbedBuilder()
					.setDescription(
						`**POWER PLAY!!** ${
							game.players[1 - current_turn].name
						} drew a card. ${extra}\n\nIt is now ${
							game.players[game.table.current_turn].name
						}'s turn!`
					)
					.setColor(parseInt(embed_colors[top_card.color], 16))
					.setThumbnail(
						`https://raw.githubusercontent.com/MysteriousGrimReaper/MiddleRoadEnergy-UNO/main/custom-cards/${
							top_card.color
						}${top_card.wild ? `WILD` : ``}${top_card.icon}.png`
					)
					.setFooter({
						iconURL: `https://raw.githubusercontent.com/MysteriousGrimReaper/MiddleRoadEnergy-UNO/main/custom-cards/logo.png`,
						text: `Deck: ${game.deck.length} cards remaining | Discarded: ${game.table.cards.length}`,
					});
				game.powerplay = undefined;
				await channel.send({
					embeds: [pp_embed],
					components: [button_row],
				});
			}
			if (uno_flag && game.players[current_turn].hand.length == 1) {
				game.players[current_turn].uno = uno_flag;
				await channel.send(
					`**UNO!!** ${game.players[current_turn].name} only has 1 card left!`
				);
			}
			chain_update();
			const game_cache = require("../index");
			game_cache.setGame(channel.id, game);
			return await games.set(`${channel.id}`, game);
		} else {
			return await channel.send("Sorry, you can't play that card here!");
		}
	},
};
