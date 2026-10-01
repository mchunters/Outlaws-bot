const MUSIC_CHANNEL_ID = '1547515109667241984';

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    // Ignore bots
    if (message.author.bot) return;

    // Only apply this rule to the music channel
    if (message.channel.id !== MUSIC_CHANNEL_ID) return;

    try {
      // Delete the normal message/photo/file
      await message.delete().catch(() => null);

      // Send the warning privately to the user through DM
      await message.author.send(
        '⚠️ This channel is for music commands only. Please use the available music commands instead of sending regular messages.'
      ).catch(() => null);

    } catch (error) {
      console.error('Music-only channel handler error:', error);
    }
  });
};
