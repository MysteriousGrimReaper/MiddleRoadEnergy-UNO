const { EmbedBuilder } = require("discord.js");
const { display_names, embed_colors } = require("../enums.json");
const { Catbox } = require('node-catbox');
const catbox = new Catbox();
const {QuickDB} = require("quick.db");
const db = new QuickDB();
const card_link_db = db.table("card_links");
const card_url_cache = {}
module.exports = class GameEmbeds {
	static async loadCardLinks(theme, channel=null) {
		const card_links = await card_link_db.get(theme) ?? {};
		for (const link in card_links) {
			if (!card_links[link]) {
				try {
					const response = await catbox.uploadFile({
						path: card_image_link
					});
					card_url_cache[card_image_link] = response;
				} catch (err) {
					console.log(`If you're seeing this, it likely means at least 1 of the cards when using \`ref theme load\` failed to load. If this messsage only shows up 1-2 times it's probably fine, but if it shows up more, consider running the command again (after you receive confirmation that it has loaded for the first time.)`);
				}
			}
			card_url_cache[link] = card_links[link];
		}
		await card_link_db.set(theme, card_url_cache);
		if (channel) {
			await channel.send(`Cards loaded for \`${theme}\`.`)
		}
	}
	static async getCardImageLink(theme, card) {
		const card_image_link = `cards/${theme}/${
			card.color != `WILD` ? card.color : ``
		}${card.wild ? `WILD` : ``}${card.icon}.png`;
		if (card_url_cache[card_image_link]) {
			return card_url_cache[card_image_link]
		}
		try {
			const response = await catbox.uploadFile({
				path: card_image_link
			});
			card_url_cache[card_image_link] = response;
		} catch (err) {
			console.error(err); // -> error message from server
		}
		return card_url_cache[card_image_link] ?? `https://raw.githubusercontent.com/MysteriousGrimReaper/MiddleRoadEnergy-UNO/main/cards/default/${
					card.color != `WILD` ? card.color : ``
				}${card.wild ? `WILD` : ``}${card.icon}.png`
	}
	static async defaultEmbed(game) {
		const { on, table, deck, players } = game;
		const { current_turn, cards } = table;
        const top_card = cards[cards.length - 1];

		const card_image_link = await GameEmbeds.getCardImageLink(game.settings.theme, top_card);
        return new EmbedBuilder()
			.setColor(parseInt(embed_colors[top_card.color], 16))
			.setThumbnail(card_image_link)
			.setFooter({
				iconURL: `https://raw.githubusercontent.com/MysteriousGrimReaper/MiddleRoadEnergy-UNO/main/cards/default/logo.png`,
				text: `Deck: ${deck.length} cards remaining | Discarded: ${cards.length}`,
			});
	}
    static async drawEmbed(game) {
        const { on, table, deck, players } = game;
		const { current_turn, cards } = table;
        const top_card = cards[cards.length - 1];
		return (await GameEmbeds.defaultEmbed(game))
		.setDescription(
			`${
				players[1 - current_turn].name
			} drew a card. \n\nIt is now ${
				players[current_turn].name
			}'s turn!`
		)
    }
	static async playEmbed(game, extra) {
		const { on, table, deck, players } = game;
		const { current_turn, cards } = table;
        const top_card = cards[cards.length - 1];
		return (await GameEmbeds.defaultEmbed(game))
		.setDescription(
			`A **${display_names[top_card.color]} ${
				top_card.wild ? `WILD` : ``
			}${
				top_card.icon
			}** has been played. ${extra}\n\nIt is now ${
				players[game.table.current_turn].name
			}'s turn!`
		)
	}
	static async ppEmbed(game, extra = "") {
		const { on, table, deck, players } = game;
		const { current_turn, cards } = table;
        const top_card = cards[cards.length - 1];
		return (await GameEmbeds.defaultEmbed(game))
		.setDescription(
			`**POWER PLAY!!** ${
				game.players[1 - current_turn].name
			} drew a card. ${extra}\n\nIt is now ${
				game.players[current_turn].name
			}'s turn!`
		)
	}
	static async tableEmbed(game) {
        const { on, table, deck, players } = game;
		const { current_turn, cards } = table;
        const top_card = cards[cards.length - 1];
		return (await GameEmbeds.defaultEmbed(game))
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
    }
	static async passEmbed(game) {
		const { on, table, deck, players } = game;
		const { current_turn, cards } = table;
        const top_card = cards[cards.length - 1];
		return (await GameEmbeds.defaultEmbed(game))
		.setDescription(
			`(inactive, pass) ${
				game.players[1 - current_turn].name
			} drew a card. \n\nIt is now ${
				game.players[game.table.current_turn].name
			}'s turn!`
		)
	}
	static async startEmbed(game) {
		const { on, table, deck, players } = game;
		const { current_turn, cards } = table;
        const top_card = cards[cards.length - 1];
		const starting_cards = game.cards;
		const player1 = `${game.players[game.table.current_turn].name}`;
		return (await GameEmbeds.defaultEmbed(game))
		.setDescription(
			`Starting UNO game with ${starting_cards} cards! The currently flipped card is:\n**${
				display_names[top_card.color]
			} ${top_card.icon}**.\n\nIt is now ${player1}'s turn!`
		)
		
	}
	static statsEmbed(game, top_card) {
		const { on, table, deck, players } = game;
		const { current_turn, cards } = table;
		const names = players.map((p) => p.name);
		return new EmbedBuilder()
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
	}
}