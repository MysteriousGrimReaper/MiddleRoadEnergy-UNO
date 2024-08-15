const path = require("path")
const {
    AttachmentBuilder
} = require("discord.js")
module.exports = {
	name: `gamestate`,
	aliases: [`gs`],
	debug: true,
	description: `DMs the gamestate to MGR.`,
	async execute(message) {
		if (message.author.id != `315495597874610178`) {
			return;
		}
        const filePath = path.join(__dirname, `../json.sqlite`)
        const attachment = new AttachmentBuilder()
        .setFile(filePath)
        message.author.send({files: [attachment]})
	},
};
