const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Everything is up!');
});

app.listen(10000, () => {
  console.log('✅ Express server running on http://localhost:10000');
});

require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
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
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// ===============================
// Lavalink v4 Configuration
// ===============================

client.lavalink = new LavalinkManager({
  nodes: [
    {
      id: process.env.LL_NAME || 'Outlaws',

      host: process.env.LL_HOST,

      port: Number(process.env.LL_PORT || 13592),

      authorization: process.env.LL_PASSWORD,

      secure: false,

      retryAmount: 5,

      retryDelay: 10000,

      requestSignalTimeoutMS: 10000,

      closeOnError: false,
    },
  ],

  sendToShard: (guildId, payload) => {
    return client.guilds.cache.get(guildId)?.shard?.send(payload);
  },

  autoSkip: true,

  client: {
    id: process.env.DISCORD_CLIENT_ID,
    username: 'Lanya',
  },

  playerOptions: {
    onEmptyQueue: {
      destroyAfterMs: 30000,
      autoPlayFunction: autoPlayFunction,
    },
  },
});

// ===============================
// Send Discord Gateway Data
// to Lavalink
// ===============================

client.on('raw', (data) => {
  client.lavalink.sendRawData(data);
});

// ===============================
// Discord Ready
// ===============================

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  client.lavalink.init(client.user);

  console.log('🎵 Lavalink v4 manager initialized');
});

// ===============================
// Lavalink Events
// ===============================

client.lavalink.nodeManager.on('connect', (node) => {
  console.log(`🎵 Lavalink node connected: ${node.id}`);
});

client.lavalink.nodeManager.on('disconnect', (node, reason) => {
  console.warn(
    `⚠️ Lavalink node disconnected: ${node.id}`,
    reason
  );
});

client.lavalink.nodeManager.on('error', (node, error) => {
  console.error(
    `❌ Lavalink node error: ${node?.id || 'unknown'}`,
    error
  );
});

// ===============================
// Styles
// ===============================

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

// ===============================
// Load Handlers
// ===============================

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
  global.styles.successColor(
    `✅ Successfully loaded ${counter} handlers`
  )
);

// ===============================
// Login
// ===============================

client.login(process.env.DISCORD_TOKEN);
