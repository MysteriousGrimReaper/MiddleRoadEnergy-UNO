const { QuickDB } = require("quick.db");

const db = new QuickDB();
const games = db.table("games");
module.exports = {
	name: `play`,
	aliases: [`p`],
	async execute(message, game) {},
};
