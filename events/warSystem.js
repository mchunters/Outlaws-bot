const {
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ChannelType,
  PermissionFlagsBits,
} = require('discord.js');

const {
  ANNOUNCEMENT_CHANNEL_ID,
  WAR_VC_NAME,
  START_ROLE_IDS,
  END_ROLE_IDS,
  hasAnyRole,
  setPanelState,
} = require('../functions/warSystem');

module.exports = {
  name: Events.InteractionCreate,

  async execute(interaction) {
    try {
      // =====================================================
      // START WAR BUTTON
      // =====================================================

      if (
        interaction.isButton() &&
        interaction.customId === 'outlaws-war-start'
      ) {
        if (!interaction.inGuild()) {
          return interaction.reply({
            content:
              '❌ This war system can only be used inside the server.',
            ephemeral: true,
          });
        }

        // Check permission
        if (!hasAnyRole(interaction.member, START_ROLE_IDS)) {
          return interaction.reply({
            content:
              '❌ You do not have permission to start a war.',
            ephemeral: true,
          });
        }

        // Check if another war is already active
        const existingWar = interaction.guild.channels.cache.find(
          (channel) =>
            channel.name === WAR_VC_NAME &&
            channel.isVoiceBased()
        );

        if (existingWar) {
          return interaction.reply({
            content:
              '🔴 A war is already active. End the current war before starting a new one.',
            ephemeral: true,
          });
        }

        // =====================================================
        // WAR MODAL
        // =====================================================

        const modal = new ModalBuilder()
          .setCustomId('outlaws-war-modal')
          .setTitle('⚔️ Start Outlaws War');

        // Game UID
        const uidInput = new TextInputBuilder()
          .setCustomId('war-uid')
          .setLabel('Game UID')
          .setPlaceholder('Enter your game UID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(50);

        // Enemy Gang
        const gangInput = new TextInputBuilder()
          .setCustomId('enemy-gang')
          .setLabel('Enemy Gang Name')
          .setPlaceholder('Enter the enemy gang name')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(100);

        // Reason
        const reasonInput = new TextInputBuilder()
          .setCustomId('war-reason')
          .setLabel('War Reason')
          .setPlaceholder('Why are you declaring this war?')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(500);

        modal.addComponents(
          new ActionRowBuilder().addComponents(uidInput),
          new ActionRowBuilder().addComponents(gangInput),
          new ActionRowBuilder().addComponents(reasonInput)
        );

        return interaction.showModal(modal);
      }

      // =====================================================
      // END WAR BUTTON
      // =====================================================

      if (
        interaction.isButton() &&
        interaction.customId === 'outlaws-war-end'
      ) {
        if (!interaction.inGuild()) {
          return;
        }

        // Outlaws role is NOT included in END_ROLE_IDS
        if (!hasAnyRole(interaction.member, END_ROLE_IDS)) {
          return interaction.reply({
            content:
              '❌ Only Leader, Co-Leader, Founder, and Moderator can end the war.',
            ephemeral: true,
          });
        }

        const warVC = interaction.guild.channels.cache.find(
          (channel) =>
            channel.name === WAR_VC_NAME &&
            channel.isVoiceBased()
        );

        if (!warVC) {
          await setPanelState(interaction.client, false);

          return interaction.reply({
            content: '⚠️ No active war was found.',
            ephemeral: true,
          });
        }

        // Delete War VC
        await warVC.delete('Outlaws war ended');

        // Announcement
        const announcementChannel =
          await interaction.client.channels.fetch(
            ANNOUNCEMENT_CHANNEL_ID
          );

        if (announcementChannel?.isTextBased()) {
          await announcementChannel.send(
            '🟢 **WAR ENDED — OUTLAWS**\n\n' +
              'The war has officially ended.\n' +
              'Stay alert and wait for further orders.'
          );
        }

        // Return permanent panel to START WAR
        await setPanelState(interaction.client, false);

        return interaction.reply({
          content:
            '✅ War ended successfully. The War VC has been deleted.',
          ephemeral: true,
        });
      }

      // =====================================================
      // WAR MODAL SUBMISSION
      // =====================================================

      if (
        interaction.isModalSubmit() &&
        interaction.customId === 'outlaws-war-modal'
      ) {
        if (!interaction.inGuild()) {
          return;
        }

        // Permission check
        if (!hasAnyRole(interaction.member, START_ROLE_IDS)) {
          return interaction.reply({
            content:
              '❌ You do not have permission to start a war.',
            ephemeral: true,
          });
        }

        // Check existing war
        const existingWar = interaction.guild.channels.cache.find(
          (channel) =>
            channel.name === WAR_VC_NAME &&
            channel.isVoiceBased()
        );

        if (existingWar) {
          return interaction.reply({
            content: '🔴 A war is already active.',
            ephemeral: true,
          });
        }

        // Get modal data
        const uid = interaction.fields
          .getTextInputValue('war-uid')
          .trim();

        const enemyGang = interaction.fields
          .getTextInputValue('enemy-gang')
          .trim();

        const reason = interaction.fields
          .getTextInputValue('war-reason')
          .trim();

        await interaction.deferReply({
          ephemeral: true,
        });

        // =====================================================
        // CREATE WAR VOICE CHANNEL
        // =====================================================

        const warVC = await interaction.guild.channels.create({
  name: WAR_VC_NAME,
  type: ChannelType.GuildVoice,

  // War VC will be created inside this category
  parent: '1547829452858331216',

  permissionOverwrites: [
    {
      id: interaction.guild.roles.everyone.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak,
      ],
    },
  ],
});

        // =====================================================
        // WAR ANNOUNCEMENT
        // =====================================================

        const announcementChannel =
          await interaction.client.channels.fetch(
            ANNOUNCEMENT_CHANNEL_ID
          );

        if (announcementChannel?.isTextBased()) {
          await announcementChannel.send(
            '⚔️ **WAR ALERT — OUTLAWS**\n\n' +
              '@everyone 🚨 **War is LIVE!**\n\n' +
              '⚔️ **Enemy:** ' +
              enemyGang +
              '\n' +
              '🎮 **UID:** ' +
              uid +
              '\n' +
              '📝 **Reason:** ' +
              reason +
              '\n\n' +
              '🔥 **All members, join the War VC ASAP!**\n' +
              'Stay alert and follow orders.\n\n' +
              '🔴 **WAR STATUS: ACTIVE**'
          );
        }

        // Change panel to END WAR
        await setPanelState(
          interaction.client,
          true
        );

        return interaction.editReply({
          content:
            '✅ **War started successfully!**\n\n' +
            '🔴 War VC: **' +
            warVC.name +
            '**\n' +
            '⚔️ Enemy: **' +
            enemyGang +
            '**',
        });
      }
    } catch (error) {
      console.error(
        '❌ War System Error:',
        error
      );

      const response = {
        content:
          '❌ Something went wrong while processing the war system.',
        ephemeral: true,
      };

      if (
        interaction.deferred ||
        interaction.replied
      ) {
        await interaction
          .editReply(response)
          .catch(() => {});
      } else {
        await interaction
          .reply(response)
          .catch(() => {});
      }
    }
  },
};
