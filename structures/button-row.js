const { ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");

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

module.exports = button_row