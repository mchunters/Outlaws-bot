const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');

// ===============================
// OUTLAWS WAR SYSTEM CONFIG
// ===============================

const WAR_PANEL_CHANNEL_ID = '1556392634593972234';
const ANNOUNCEMENT_CHANNEL_ID = '1547928222711152761';

const WAR_VC_NAME = '🔴・OUTLAWS WAR';

// ===============================
// ROLES THAT CAN START WAR
// ===============================

const START_ROLE_IDS = [
  '1547791040243830844', // Outlaws
  '1547792026471243837', // Moderator
  '1547791289465184256', // Co-leader
  '1547499535365050398', // Leader
  '1547941486442717255', // Founder
];

// ===============================
// ROLES THAT CAN END WAR
// Outlaws is intentionally NOT here
// ===============================

const END_ROLE_IDS = [
  '1547792026471243837', // Moderator
  '1547791289465184256', // Co-leader
  '1547499535365050398', // Leader
  '1547941486442717255', // Founder
];

// ===============================
// ROLE CHECK
// ===============================

function hasAnyRole(member, roleIds) {
  return roleIds.some((roleId) => member.roles.cache.has(roleId));
}

// ===============================
// START WAR BUTTON
// ===============================

function startRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('outlaws-war-start')
      .setLabel('START WAR')
      .setEmoji('🟢')
      .setStyle(ButtonStyle.Success)
  );
}

// ===============================
// END WAR BUTTON
// ===============================

function endRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('outlaws-war-end')
      .setLabel('END WAR')
      .setEmoji('🛑')
      .setStyle(ButtonStyle.Danger)
  );
}

// ===============================
// WAR PANEL EMBED
// ===============================

function panelEmbed(active = false) {
  if (active) {
    return new EmbedBuilder()
      .setTitle('⚔️ OUTLAWS WAR SYSTEM')
      .setDescription(
        '**🔴 WAR STATUS: ACTIVE**\n\n' +
          'The Outlaws are currently in an active war.\n\n' +
          '🔥 All members should join the War VC and follow the instructions.\n\n' +
          '**Only Leader, Co-Leader, Founder, and Moderator can end the war.**'
      )
      .setColor(0xff0000);
  }

  return new EmbedBuilder()
    .setTitle('⚔️ OUTLAWS WAR SYSTEM')
    .setDescription(
      '**🟢 WAR STATUS: READY**\n\n' +
        'Ready to declare a war? Click **🟢 START WAR** and submit the required details.\n\n' +
        '**War Details Required:**\n' +
        '• Game UID\n' +
        '• Enemy Gang Name\n' +
        '• War Reason\n\n' +
        '⚠️ **Start War:** Outlaws, Leader, Co-Leader, Founder, Moderator\n' +
        '🛑 **End War:** Leader, Co-Leader, Founder, Moderator\n\n' +
        '**Stay alert. Follow orders. Fight together.**'
    )
    .setColor(0x00ff66);
}

// ===============================
// FIND EXISTING WAR PANEL
// ===============================

async function findPanelMessage(channel) {
  const messages = await channel.messages.fetch({
    limit: 50,
  });

  return messages.find((message) =>
    message.components?.some((row) =>
      row.components?.some(
        (component) =>
          component.customId === 'outlaws-war-start' ||
          component.customId === 'outlaws-war-end'
      )
    )
  );
}

// ===============================
// CREATE / UPDATE PERMANENT PANEL
// ===============================

async function getWarPanel(client) {
  const channel = await client.channels.fetch(WAR_PANEL_CHANNEL_ID);

  if (!channel || !channel.isTextBased()) {
    console.log('❌ War panel channel not found.');
    return;
  }

  const activeWar = channel.guild.channels.cache.some(
    (channel) =>
      channel.name === WAR_VC_NAME && channel.isVoiceBased()
  );

  let panelMessage = await findPanelMessage(channel);

  if (!panelMessage) {
    panelMessage = await channel.send({
      embeds: [panelEmbed(activeWar)],
      components: [activeWar ? endRow() : startRow()],
    });

    console.log('✅ Outlaws War panel created.');
    return panelMessage;
  }

  await panelMessage.edit({
    embeds: [panelEmbed(activeWar)],
    components: [activeWar ? endRow() : startRow()],
  });

  console.log('✅ Outlaws War panel updated.');

  return panelMessage;
}

// ===============================
// CHANGE PANEL STATE
// ===============================

async function setPanelState(client, active) {
  const channel = await client.channels.fetch(WAR_PANEL_CHANNEL_ID);

  if (!channel || !channel.isTextBased()) {
    console.log('❌ War panel channel not found.');
    return;
  }

  const panelMessage = await findPanelMessage(channel);

  if (!panelMessage) {
    await channel.send({
      embeds: [panelEmbed(active)],
      components: [active ? endRow() : startRow()],
    });

    return;
  }

  await panelMessage.edit({
    embeds: [panelEmbed(active)],
    components: [active ? endRow() : startRow()],
  });
}

module.exports = {
  ANNOUNCEMENT_CHANNEL_ID,
  WAR_VC_NAME,
  START_ROLE_IDS,
  END_ROLE_IDS,
  hasAnyRole,
  getWarPanel,
  setPanelState,
};
