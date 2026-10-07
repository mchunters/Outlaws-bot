const express = require('express');
const app = express();

require('dotenv').config();

// ==========================================
// 🌐 RENDER WEB SERVER
// ==========================================

const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.status(200).send('Everything is up!');
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    bot: client?.isReady?.() ? 'ready' : 'starting',
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Express server running on port ${PORT}`);
});

// ==========================================
// 🤖 DISCORD
// ==========================================

const {
  Client,
  GatewayIntentBits,
  Partials,
} = require('discord.js');

const { LavalinkManager } = require('lavalink-client');

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const {
  autoPlayFunction,
} = require('./functions/autoPlay');

// ==========================================
// 🔐 ENVIRONMENT CHECK
// ==========================================

const requiredEnv = [
  'DISCORD_TOKEN',
  'DISCORD_CLIENT_ID',
];

const missingEnv = requiredEnv.filter(
  (name) => !process.env[name]
);

if (missingEnv.length > 0) {
  console.error(
    `❌ Missing required environment variables: ${missingEnv.join(', ')}`
  );
}

// Lavalink variables
if (!process.env.LL_HOST) {
  console.warn('⚠️ LL_HOST is missing.');
}

if (!process.env.LL_PORT) {
  console.warn('⚠️ LL_PORT is missing.');
}

if (!process.env.LL_PASSWORD) {
  console.warn('⚠️ LL_PASSWORD is missing.');
}

if (!process.env.LL_NAME) {
  console.warn('⚠️ LL_NAME is missing.');
}

// ==========================================
// 🤖 DISCORD CLIENT
// ==========================================

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

// ==========================================
// 🎵 LAVALINK
// ==========================================

const lavalinkPort = Number.parseInt(
  process.env.LL_PORT,
  10
);

client.lavalink = new LavalinkManager({
  nodes: [
    {
      authorization: process.env.LL_PASSWORD,
      host: process.env.LL_HOST,
      port: Number.isNaN(lavalinkPort)
        ? 2333
        : lavalinkPort,
      id: process.env.LL_NAME || 'Outlaws',
    },
  ],

  sendToShard: (guildId, payload) => {
    try {
      return client.guilds.cache
        .get(guildId)
        ?.shard?.send(payload);
    } catch (error) {
      console.error(
        '❌ Lavalink sendToShard error:',
        error
      );
    }
  },

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

// ==========================================
// 🎨 CONSOLE STYLES
// ==========================================

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

// ==========================================
// 🧩 LOAD HANDLERS
// ==========================================

try {
  const handlersPath = path.join(
    __dirname,
    'handlers'
  );

  if (!fs.existsSync(handlersPath)) {
    throw new Error('handlers folder not found.');
  }

  const handlerFiles = fs
    .readdirSync(handlersPath)
    .filter((file) => file.endsWith('.js'));

  let counter = 0;

  for (const file of handlerFiles) {
    try {
      const handler = require(
        path.join(handlersPath, file)
      );

      if (typeof handler === 'function') {
        handler(client);
        counter++;
        console.log(
          `✅ Handler loaded: ${file}`
        );
      }
    } catch (error) {
      console.error(
        `❌ Failed to load handler: ${file}`
      );
      console.error(error);
    }
  }

  console.log(
    global.styles.successColor(
      `✅ Successfully loaded ${counter} handlers`
    )
  );
} catch (error) {
  console.error(
    '❌ Handler system failed:',
    error
  );
}

// ==========================================
// 📩 DM LOG SYSTEM
// ==========================================

const DM_LOG_CHANNEL_ID =
  '1556254987712200824';

client.on('messageCreate', async (message) => {
  try {
    // Ignore bots
    if (message.author.bot) return;

    // Only process DMs
    if (message.channel.type !== 1) return;

    const logChannel =
      await client.channels.fetch(
        DM_LOG_CHANNEL_ID
      );

    if (!logChannel) {
      console.error(
        '❌ DM log channel not found.'
      );
      return;
    }

    await logChannel.send(
      `📩 **New DM Received**\n\n` +
      `👤 **User:** ${message.author.tag}\n` +
      `🆔 **User ID:** <@${message.author.id}>\n` +
      `💬 **Message:** ${
        message.content || '*No text message*'
      }`
    );

    console.log(
      `📩 DM received from ${message.author.tag}: ${message.content}`
    );
  } catch (error) {
    console.error(
      '❌ DM Log Error:',
      error
    );
  }
});

// ==========================================
// 🟢 DISCORD CONNECTION LOGS
// ==========================================

client.on('error', (error) => {
  console.error(
    '❌ Discord Client Error:',
    error
  );
});

client.on('warn', (warning) => {
  console.warn(
    '⚠️ Discord Warning:',
    warning
  );
});

client.on('shardError', (error) => {
  console.error(
    '❌ Discord Shard Error:',
    error
  );
});

client.on('shardDisconnect', (event, shardId) => {
  console.error(
    `🔴 Discord Shard Disconnected | Shard: ${shardId}`,
    event
  );
});

client.on('shardReconnecting', (shardId) => {
  console.warn(
    `🔄 Discord Shard Reconnecting | Shard: ${shardId}`
  );
});

client.on('shardReady', (shardId) => {
  console.log(
    `🟢 Discord Shard Ready | Shard: ${shardId}`
  );
});

// ==========================================
// 🚀 LOGIN
// ==========================================

if (!process.env.DISCORD_TOKEN) {
  console.error(
    '❌ DISCORD_TOKEN is missing. Bot cannot login.'
  );
} else {
  console.log('🔐 Connecting to Discord...');

  client
    .login(process.env.DISCORD_TOKEN)
    .then(() => {
      console.log(
        '✅ Discord login request completed.'
      );
    })
    .catch((error) => {
      console.error(
        '❌ DISCORD LOGIN FAILED:'
      );
      console.error(error);

      // Keep the reason visible in Render logs.
      // Exit so Render can restart the service.
      process.exit(1);
    });
}

// ==========================================
// 🛑 PROCESS ERROR HANDLERS
// ==========================================

process.on('unhandledRejection', (error) => {
  console.error(
    '❌ UNHANDLED PROMISE REJECTION:'
  );
  console.error(error);
});

process.on('uncaughtException', (error) => {
  console.error(
    '❌ UNCAUGHT EXCEPTION:'
  );
  console.error(error);

  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log(
    '🛑 SIGTERM received. Shutting down...'
  );

  try {
    client.destroy();
  } catch (error) {
    console.error(error);
  }

  process.exit(0);
});

process.on('SIGINT', () => {
  console.log(
    '🛑 SIGINT received. Shutting down...'
  );

  try {
    client.destroy();
  } catch (error) {
    console.error(error);
  }

  process.exit(0);
});
