const { EmbedBuilder } = require('discord.js');
const MirageUID = require('../models/MirageUID');

const UID_CHANNEL_ID = '1554458478649675836';

async function updateMirageUIDChannel(client, guildId) {
  try {
    const channel = await client.channels.fetch(UID_CHANNEL_ID);

    if (!channel || !channel.isTextBased()) {
      throw new Error('UID channel not found or is not a text channel.');
    }

    if (channel.guildId !== guildId) {
      throw new Error('UID channel belongs to a different server.');
    }

    const members = await MirageUID.find({ guildId })
      .sort({ username: 1 })
      .lean();

    let description = '';

    if (members.length === 0) {
      description = '📭 No Mirage City UIDs have been added yet.';
    } else {
      description = members
        .map(
          (member, index) =>
            `**${index + 1}. ${member.username}**\n` +
            `🎮 UID: \`${member.gameUid}\`\n`
        )
        .join('\n');
    }

    const embed = new EmbedBuilder()
      .setColor(0x8b0000)
      .setTitle('🏴 OUTLAWS — MIRAGE CITY UID LIST')
      .setDescription(description)
      .setFooter({
        text: `Total Members: ${members.length} • Outlaws`,
      })
      .setTimestamp();

    // Find the existing UID message
    const messages = await channel.messages.fetch({ limit: 100 });

    let uidMessage = messages.find(
      (message) =>
        message.author.id === client.user.id &&
        message.embeds.length > 0 &&
        message.embeds[0].title === '🏴 OUTLAWS — MIRAGE CITY UID LIST'
    );

    // If message does not exist, create it
    if (!uidMessage) {
      uidMessage = await channel.send({
        embeds: [embed],
      });
    } else {
      // Update existing message
      await uidMessage.edit({
        embeds: [embed],
      });
    }

    return uidMessage;
  } catch (error) {
    console.error('❌ UID Channel Update Error:', error);
    throw error;
  }
}

module.exports = updateMirageUIDChannel;
