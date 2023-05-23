const { Client, Intents, MessageEmbed, Collection } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_INVITES] });
const loggingChannelId = 'YOUR_LOGGING_CHANNEL_ID';

// Invite storage
const invites = new Collection();

client.once('ready', () => {
  console.log('Bot is ready!');
});

client.on('inviteCreate', async (invite) => {
  console.log('Invite created:', invite.code);
  const { code, inviter, uses, maxUses, channel } = invite;
  const guild = channel.guild;
  const inviterMember = await guild.members.fetch(inviter.id);

  const embed = new MessageEmbed()
    .setColor('#00ff00')
    .setTitle('Invite Created')
    .addField('Code', code)
    .addField('Inviter', inviterMember?.user?.tag || 'Unknown')
    .addField('Uses', `${uses} / ${maxUses || '∞'}`)
    .addField('Channel', channel.toString())
    .setTimestamp();

  const loggingChannel = await client.channels.fetch(loggingChannelId);
  if (loggingChannel?.isText()) {
    loggingChannel.send({ embeds: [embed] });
  }

  // Update invite storage
  invites.set(code, { inviter: inviterMember.user.tag, uses, maxUses });
});

client.on('guildMemberAdd', async (member) => {
  console.log('Member joined:', member.user.tag);
  const { user, guild, joinedAt } = member;

  // Check the invite used by the member
  const invitesBefore = invites.clone();
  const invitesAfter = await guild.invites.fetch();

  const usedInvite = invitesAfter.find((invite) => {
    const before = invitesBefore.get(invite.code);
    return before && invite.uses > before.uses;
  });

  const embed = new MessageEmbed()
    .setColor('#0000ff')
    .setTitle('User Joined')
    .setDescription(`**${user.tag}** joined the server.`)
    .addField('Invited By', usedInvite?.inviter || 'Unknown')
    .addField('Invite Code', usedInvite?.code || 'Unknown')
    .addField('Joined At', joinedAt)
    .setTimestamp();

  const loggingChannel = await client.channels.fetch(loggingChannelId);
  if (loggingChannel?.isText()) {
    loggingChannel.send({ embeds: [embed] });
  }
});

client.on('guildCreate', async (guild) => {
  // Fetch all invites and populate invite storage
  const fetchedInvites = await guild.invites.fetch();
  fetchedInvites.forEach((invite) => {
    invites.set(invite.code, { inviter: invite.inviter?.tag || 'Unknown', uses: invite.uses, maxUses: invite.maxUses });
  });
});

// Replace 'YOUR_BOT_TOKEN' with your actual bot token
client.login('YOUR_BOT_TOKEN');
