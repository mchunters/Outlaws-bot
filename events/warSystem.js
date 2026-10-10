const {
  Events,
  ChannelType,
  PermissionFlagsBits,
  MessageFlags,
} = require('discord.js');

const MirageUID = require('../models/MirageUID');

const {
  ANNOUNCEMENT_CHANNEL_ID,
  WAR_VC_NAME,
  START_ROLE_IDS,
  END_ROLE_IDS,
  hasAnyRole,
  setPanelState,
} = require('../functions/warSystem');

const WAR_VC_CATEGORY_ID = '1547829452858331216';

module.exports = {
  name: Events.InteractionCreate,

  async execute(interaction) {
    try {
      // START WAR — no form, one tap
      if (
        interaction.isButton() &&
        interaction.customId === 'outlaws-war-start'
      ) {
        if (!interaction.inGuild()) {
          return interaction.reply({
            content: '❌ This system can only be used inside the server.',
            flags: MessageFlags.Ephemeral,
          });
        }

        // Find the starter's saved UID
        const uidRecord = await MirageUID.findOne({
          guildId: interaction.guild.id,
          discordUserId: interaction.user.id,
        }).lean();

        // UID missing: send the requested English message
        if (!uidRecord || !String(uidRecord.gameUid || '').trim()) {
          return interaction.reply({
            content:
              '❌ You are not registered as an Outlaws member. Please create a ticket and contact the Leader or Co-Leader to get your Game UID added.',
            flags: MessageFlags.Ephemeral,
          });
        }

        // Preserve existing role permissions
        if (!hasAnyRole(interaction.member, START_ROLE_IDS)) {
          return interaction.reply({
            content: '❌ You do not have permission to start a war.',
            flags: MessageFlags.Ephemeral,
          });
        }

        // Prevent duplicate active wars
        const existingWar = interaction.guild.channels.cache.find(
          (channel) =>
            channel.name === WAR_VC_NAME &&
            channel.isVoiceBased()
        );

        if (existingWar) {
          return interaction.reply({
            content:
              '🔴 A war is already active. End the current war before starting another one.',
            flags: MessageFlags.Ephemeral,
          });
        }

        await interaction.deferReply({
          flags: MessageFlags.Ephemeral,
        });

        // Create War VC in the configured category
        const warVC = await interaction.guild.channels.create({
          name: WAR_VC_NAME,
          type: ChannelType.GuildVoice,
          parent: WAR_VC_CATEGORY_ID,
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
          reason: `War started by ${interaction.user.tag}`,
        });

        try {
          const announcementChannel =
            await interaction.client.channels.fetch(
              ANNOUNCEMENT_CHANNEL_ID
            );

          if (!announcementChannel?.isTextBased()) {
            throw new Error(
              'War announcement channel is unavailable.'
            );
          }

          await announcementChannel.send({
            content:
              '⚔️ **WAR ALERT — OUTLAWS**\n\n' +
              '@everyone 🚨 **War is LIVE!**\n\n' +
              `👤 **Started By:** <@${interaction.user.id}>\n` +
              `🎮 **Game UID:** \`${String(uidRecord.gameUid).trim()}\`\n\n` +
              '🔥 **All members, join the War VC ASAP!**\n' +
              'Stay alert and follow orders.\n\n' +
              '🔴 **WAR STATUS: ACTIVE**',
            allowedMentions: {
              parse: ['everyone'],
              users: [interaction.user.id],
            },
          });
        } catch (error) {
          await warVC
            .delete('Could not publish war announcement')
            .catch(() => {});

          throw error;
        }

        await setPanelState(interaction.client, true);

        return interaction.editReply({
          content:
            '✅ **War started successfully!**\n\n' +
            `🔴 War VC: **${warVC.name}**\n` +
            `👤 Started By: <@${interaction.user.id}>\n` +
            `🎮 Game UID: \`${String(uidRecord.gameUid).trim()}\``,
          allowedMentions: {
            users: [interaction.user.id],
          },
        });
      }

      // END WAR
      if (
        interaction.isButton() &&
        interaction.customId === 'outlaws-war-end'
      ) {
        if (!interaction.inGuild()) return;

        if (!hasAnyRole(interaction.member, END_ROLE_IDS)) {
          return interaction.reply({
            content:
              '❌ Only the Leader, Co-Leader, Founder, or Moderator can end the war.',
            flags: MessageFlags.Ephemeral,
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
            flags: MessageFlags.Ephemeral,
          });
        }

        await warVC.delete('Outlaws war ended');

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

        await setPanelState(interaction.client, false);

        return interaction.reply({
          content:
            '✅ War ended successfully. The War VC has been deleted.',
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (error) {
      console.error('❌ War System Error:', error);

      const response = {
        content:
          '❌ Something went wrong while processing the war system. Please contact a server administrator.',
        flags: MessageFlags.Ephemeral,
      };

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(response).catch(() => {});
      } else {
        await interaction.reply(response).catch(() => {});
      }
    }
  },
};
