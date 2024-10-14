module.exports = class InputProcessor {
    static async turnCheck(game, message) {
        const { author, channel } = message;
        const { on, table, deck, players } = game;
        const {current_turn} = table
        if (game.processing) {
			return false;
		}
		if (!on) {
			await message.reply(`The game has not started yet!`);
            return false
		}
		if (author.id != players[0].id && author.id != players[1].id) {
			await message.reply(`You're not in the game!`);
            return false
		}
		if (
			(current_turn == 0 && author.id != players[0].id) ||
			(current_turn == 1 && author.id != players[1].id)
		) {
			await message.reply(`It's not your turn yet!`);
            return false
		}
        return true
    }
}