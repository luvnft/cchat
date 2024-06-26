import {connectPeer, disconnectPeer} from '../../lib/swarm';
import {use} from '../../lib/state-tree';
import { getNpubFromInfo } from '../../nostr/nostr';

export default function WebRtcConnections({swarm, hasMediasoup}) {
  const webRtcConnections = new Set();
  const checkIfSpeakerFromNpub = true;

  return function WebRtcConnections({roomState}) {
    let {
      iAmSpeaker,
      room: {speakers, stageOnly},
    } = roomState;
    let peers = use(swarm, 'peers');

    const allConnections = new Set();
    for (let peer of Object.values(peers)) {
      for (let connection of Object.values(peer.connections)) {
        allConnections.add(connection);
      }
    }

    // webrtc connections are a subset of all websocket connections
    for (let connection of webRtcConnections) {
      if (!allConnections.has(connection)) {
        webRtcConnections.delete(connection);
      }
    }

    for (let connection of allConnections) {
      // if mediasoup is used, only speakers should connect with each other
      // otherwise, speakers should connect with everyone and audience only with speakers
      let theyAreSpeaker = stageOnly || speakers.includes(connection.peerId);
      if (checkIfSpeakerFromNpub && !theyAreSpeaker) {
        let peerObject = sessionStorage.getItem(connection.peerId);
        if (peerObject != undefined) {
          let peerNpub = getNpubFromInfo(peerObject);
          if (peerNpub != undefined) {
            for (let id of speakers) {
              if (id == peerNpub) {
                theyAreSpeaker = true;
                break;
              }
            }
          }
        }
      }
      let shouldConnect = hasMediasoup
        ? iAmSpeaker && theyAreSpeaker
        : iAmSpeaker || theyAreSpeaker;

      // TODO is this always correct?
      if (shouldConnect && !webRtcConnections.has(connection)) {
        webRtcConnections.add(connection);
        connectPeer(connection);
      } else if (!shouldConnect && webRtcConnections.has(connection)) {
        webRtcConnections.delete(connection);
        disconnectPeer(connection);
      }
    }
  };
}
