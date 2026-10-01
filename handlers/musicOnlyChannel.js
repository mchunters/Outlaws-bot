const MUSIC_CHANNEL_ID = '1547515109667241984';

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    // Ignore bot messages
    if (message.author.bot) return;

    // Only work in the music channel
    if (message.channel.id !== MUSIC_CHANNEL_ID) return;

    try {
      // Delete the user's normal message
      await message.delete().catch(() => null);

      // Send temporary warning in the same channel
      const warning = await message.channel.send({
        content:
          '⚠️ This channel is for music commands only. Please use the available music commands instead of sending regular messages.',
      });

      // Delete warning after 2 seconds
      setTimeout(() => {
        warning.delete().catch(() => null);
      }, 2000);

    } catch (error) {
      console.error('Music-only channel handler error:', error);
    }
  });
};

কোথায় বসাবে

GitHub repo:

"Outlaws-bot" → "handlers" → "musicOnlyChannel.js"

আগের "musicOnlyChannel.js" থাকলে পুরো code replace করে উপরেরটা বসাও।

তারপর Commit changes → Render redeploy/restart করো।

Result

কেউ লিখলে:

"Hello"

➡️ তার message delete হবে
➡️ Bot channel-এ warning দেখাবে
➡️ 2 seconds পরে warning-ও delete হবে
➡️ কোনো DM যাবে না
➡️ "/play", "/pause", "/skip" ইত্যাদি slash command এই handler delete করবে না।
