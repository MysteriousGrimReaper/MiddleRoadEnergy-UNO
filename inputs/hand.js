const { QuickDB } = require("quick.db");
const { display_names, embed_colors } = require("../enums.json");
const { EmbedBuilder } = require("discord.js");
const GameEmbeds = require("../structures/embeds");
const db = new QuickDB();
const games = db.table("games");
module.exports = {
	name: `hand`,
	aliases: [`h`],
	async execute(message, game) {
		const { author, channel } = message;
		const { on, table, deck, players } = game;
		if (!on) {
			return;
		}
		if (author.id != players[0].id && author.id != players[1].id) {
			return;
		}
		const player = players.find((p) => p.id == author.id);
		const player_hand = player.hand
			.map((card) => `- ${display_names[card.color]} ${card.icon}`)
			.sort();
		const top_card = game.table.cards[game.table.cards.length - 1];
		const hand_embed = (await GameEmbeds.defaultEmbed(game))
			.setAuthor({
				name: author.displayName,
				iconURL: author.avatarURL(),
			})
			.setDescription(player_hand.join(`\n`))
		try {
			await author.send({ embeds: [hand_embed] });
		} catch {
			await author.send(
				`<@${player.id}>, I couldn't send you your hand! Make sure you have DMs enabled.`
			);
		}
	},
};
