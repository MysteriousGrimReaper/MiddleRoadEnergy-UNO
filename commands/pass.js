const { QuickDB } = require("quick.db");
const { base } = require("../deck.json");
const db = new QuickDB();
const games = db.table("games");
module.exports = {
	name: `pass`,
	aliases: [`pass`],
	description: `Moves to the next player.`,
	async execute(message) {
		const { channel, author } = message;
		const game = await games.get(channel.id);
		const { current_turn, cards } = table;
		if (game.processing) {
			game.processing = undefined;
		}
		if (!on) {
			return await message.reply(`The game has not started yet!`);
		}

		const amount = 1;
		if (game.deck.length < amount) {
			await channel.send(`*Reshuffling the deck...*`);
			while (table.cards.length > 1) {
				game.deck.push(game.table.cards.shift());
			}
			game.deck = shuffleArray(game.deck);
		}
		const draw_chunk = game.deck.splice(0, amount);
		game.players[current_turn].hand.push(...draw_chunk);
		game.players[current_turn].stats.cards_drawn += amount;
		game.table.current_turn = 1 - current_turn;
		const top_card = game.table.cards[game.table.cards.length - 1];
		const play_embed = new EmbedBuilder()
			.setDescription(
				`(inactive, pass) <@${
					game.players[current_turn].id
				}> drew a card. \n\nIt is now <@${
					game.players[game.table.current_turn].id
				}>'s turn!`
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
		await channel.send({ embeds: [play_embed], components: [button_row] });

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
			game.players[game.table.current_turn].stats.cards_drawn += amount;
			game.table.current_turn++;
			game.table.current_turn %= 2;
			const pp_embed = new EmbedBuilder()
				.setDescription(
					`**POWER PLAY!!** <@${
						game.players[1 - current_turn].id
					}> drew a card.\n\nIt is now <@${
						game.players[game.table.current_turn].id
					}>'s turn!`
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
			game.powerplay = undefined;
			await channel.send({
				embeds: [pp_embed],
				components: [button_row],
			});
		}
		game.powerplay = undefined;
		await games.set(`${channel.id}`, game);
	},
};
