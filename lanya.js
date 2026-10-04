const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Everything is up!');
});

app.listen(10000, () => {
  console.log('✅ Express server running on http://localhost:10000');
});
require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { LavalinkManager } = require('lavalink-client');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { autoPlayFunction } = require('./functions/autoPlay');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],

  partials: [
    Partials.Channel,
  ],
});

client.lavalink = new LavalinkManager({
  nodes: [
    {
      authorization: process.env.LL_PASSWORD,
      host: process.env.LL_HOST,
      port: parseInt(process.env.LL_PORT, 10),
      id: process.env.LL_NAME,
    },
  ],
  sendToShard: (guildId, payload) =>
    client.guilds.cache.get(guildId)?.shard?.send(payload),
  autoSkip: true,
  client: {
    id: process.env.DISCORD_CLIENT_ID,
    username: 'Lanya',
  },
  playerOptions: {
    onEmptyQueue: {
      destroyAfterMs: 30_000,
      autoPlayFunction: autoPlayFunction,
    },
  },
});

const styles = {
  successColor: chalk.bold.green,
  warningColor: chalk.bold.yellow,
  infoColor: chalk.bold.blue,
  commandColor: chalk.bold.cyan,
  userColor: chalk.bold.magenta,
  errorColor: chalk.red,
  highlightColor: chalk.bold.hex('#FFA500'),
  accentColor: chalk.bold.hex('#00FF7F'),
  secondaryColor: chalk.hex('#ADD8E6'),
  primaryColor: chalk.bold.hex('#FF1493'),
  dividerColor: chalk.hex('#FFD700'),
};

global.styles = styles;

const handlerFiles = fs
  .readdirSync(path.join(__dirname, 'handlers'))
  .filter((file) => file.endsWith('.js'));
let counter = 0;
for (const file of handlerFiles) {
  counter += 1;
  const handler = require(`./handlers/${file}`);
  if (typeof handler === 'function') {
    handler(client);
  }
}
console.log(
  global.styles.successColor(`✅ Successfully loaded ${counter} handlers`)
);

// ===============================
// 📩 DM LOG SYSTEM
// ===============================
const DM_LOG_CHANNEL_ID = '1556254987712200824';

client.on('messageCreate', async (message) => {
  // Bot-এর নিজের message ignore করবে
  if (message.author.bot) return;

  // শুধু DM message ধরবে
  if (message.channel.type !== 1) return;

  try {
    const logChannel = await client.channels.fetch(DM_LOG_CHANNEL_ID);

    if (!logChannel) {
      console.log('❌ DM log channel not found.');
      return;
    }

    await logChannel.send(
      `📩 **New DM Received**\n\n` +
      `👤 **User:** ${message.author.tag}\n` +
      `🆔 **User ID:** <@${message.author.id}>\n` +
      `💬 **Message:** ${message.content || '*No text message*'}`
    );

    console.log(
      `📩 DM received from ${message.author.tag}: ${message.content}`
    );

  } catch (error) {
    console.error('❌ DM Log Error:', error);
  }
});

// ===============================
// 🚀 LOGIN
// ===============================
client.login(process.env.DISCORD_TOKEN);
