const SOURCE = (process.env.GET_MESSAGES_FROM || '').trim();     // '@username' або '-100…'

export async function messageSource(msg) { // Array should get and check array
    // Check by group ID
    const peerIdVal = msg?.peerId?.channelId?.value;
    const byId = peerIdVal && SOURCE.startsWith('-100') && `-100${peerIdVal}` === SOURCE;
  
    // Check by username
    let byUsername = false;
    if (SOURCE.startsWith('@') && msg?.peerId instanceof Api.PeerChannel) {
      const ent = await client.getEntity(msg.peerId);
      if (ent?.username) byUsername = `@${ent.username}`.toLowerCase() === SOURCE.toLowerCase();
    }
  
    return byId || byUsername;
}