const {RelayPool} = require('nostr-relaypool');
const {nip19} = require('nostr-tools');

function decodeNote(noteId) {
  const note = nip19.decode(noteId);
  const type = note.type;

  console.log(note);
  console.log(type);

  if (type === 'nevent') {
    return note.data.id;
  }

  if (type === 'note') {
    return note.data;
  }
}

const verify = (identity, publicKey) => {
  return new Promise((res, rej) => {
    try {
      const noteId = identity.verificationInfo;
      const nostrPubkey = nip19.decode(identity.id).data;
      const isValidEvent =
        noteId.startsWith('note') || noteId.startsWith('nevent');

      if (!isValidEvent) {
        const error_msg = `Invalid nostr noteId: ${identity.verificationInfo}`;
        rej(new Error(error_msg));
      }

      const decodedNote = decodeNote(noteId);

      const filter = [{ids: [decodedNote], authors: [nostrPubkey]}];

      const defaultRelays = [
        'wss://nos.lol',
        'wss://relay.damus.io',
        'wss://nostr-pub.wellorder.net',
        'wss://nostr.mutinywallet.com',
        'wss://relay.snort.social',
      ];

      const pool = new RelayPool();

      const checkEventReturned = setTimeout(() => {
        pool.close();
        const error_msg = `Relays did not returned any events`;
        rej(new Error(error_msg));
      }, 2500);

      pool.subscribe(
        filter,
        defaultRelays,
        (event, isAfterEose, url) => {
          const isPublicKey = event.content.includes(publicKey);
          if (isPublicKey) {
            clearTimeout(checkEventReturned);
            pool.close();
            res(true);
          } else {
            const error_msg = `Nostr event does not contain public key ${publicKey}`;
            pool.close();
            rej(new Error(error_msg));
          }
        },
        undefined,
        undefined,
        {unsubscribeOnEose: true}
      );
    } catch (error) {
      console.log(error);
      pool.close();
      rej(error);
    }
  });
};

module.exports = verify;
