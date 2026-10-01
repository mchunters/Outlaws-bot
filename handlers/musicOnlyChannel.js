const MUSIC_CHANNEL_ID = '1555156668596224020';

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.channel.id !== MUSIC_CHANNEL_ID) return;

    try {
      await message.delete().catch(() => null);

      const warning = await message.channel.send(
        '⚠️ This channel is for music commands only. Please use the available music commands instead of sending regular messages.'
      );

      setTimeout(() => {
        warning.delete().catch(() => null);
      }, 2000);
    } catch (error) {
      console.error('Music-only channel handler error:', error);
    }
  });
}
