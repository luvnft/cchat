import {encode} from './identity-utils';
import {clear, emit, is, on, until} from 'minimal-state';
import {doorbell} from './doorbell';

const PING_INTERVAL = 5000; // allowed 25000 on backend

export default async function signalws({
  url,
  roomId,
  myPeerId,
  myConnId,
  sign,
  subscriptions = [],
}) {
  if (!url) throw new Error('signaling url required');
  if (!roomId) throw new Error('room id required');
  if (!myPeerId) throw new Error('peer id required');
  if (!myConnId) myConnId = String(Math.random()).slice(2, 10);

  url = url.indexOf('://') === -1 ? 'wss://' + url : url;
  url = url.replace('http', 'ws');
  if (!url.endsWith('/')) url += '/';
  let token = encode(new TextEncoder().encode(JSON.stringify(await sign({}))));
  let subs = subscriptions.join(',');
  url += `${roomId}?id=${myPeerId}.${myConnId}&token=${token}&subs=${subs}&bd=BUILD_DATE`;

  let ws = new WebSocket(url);

  ws.addEventListener('open', () => {
    is(hub, 'opened', true);
    hub.interval = setInterval(() => {
      send(hub, {t: 'ping', b: 'BUILD_DATE'});
    }, PING_INTERVAL);
  });
  ws.addEventListener('message', ({data}) => {
    let msg = parse(data);
    if (msg === undefined) return;
    let {t: topic, d, p, r: requestId} = msg;
    if (window.DEBUG && d?.peerId !== myPeerId) {
      console.log('ws message', data);
    }
    if (topic === 'opened' || topic === 'closed') return;
    let payload = d ?? {};
    if (p) {
      let [peerId, connId] = p.split('.');
      payload.peerId = peerId;
      payload.connId = connId;
    }
    doorbell(d, myPeerId, roomId);
    /* if (topic === 'error') {
      // on errors, announce in an alert, and bounce the user to the homepage
      setTimeout(async () => {
        window.location.href = window.location.href.substring(0,window.location.href.lastIndexOf('/'));
      },3000);
      alert(d);
      return;
    } else */ if (topic === 'response') {
      requestAccepted(requestId, payload);
      return;
    } else if (topic === 'server') {
      let accept = requestId
        ? data => sendAccept(hub, requestId, data)
        : () => {};
      emit(hub, topic, payload, accept);
    } else {
      emit(hub, topic, payload);
    }
  });
  ws.addEventListener('error', () => {
    if (window.DEBUG) {
      console.error('ws error');
    }
  });
  ws.addEventListener('close', () => {
    if (window.DEBUG) console.log('ws closed');
    is(hub, 'closed', true);
    clear(hub);
    clearInterval(hub.interval);
  });

  const hub = {
    opened: false,
    closed: false,
    interval: null,
    myPeerId,
    ws,
    subs: subscriptions,
    subscribe(topic, onMessage) {
      return subscribe(hub, topic, onMessage);
    },
    broadcast(topic, message = {}) {
      return broadcast(hub, topic, message);
    },
    sendDirect(receiverId, message = {}) {
      return sendDirect(hub, receiverId, message);
    },
    sendRequest(topic, message = {}) {
      return sendRequest(hub, topic, message);
    },
    close() {
      close(hub);
    },
  };
  return hub;
}

function subscribe(hub, topic, onMessage) {
  let {subs} = hub;
  if (!subs.includes(topic)) {
    subs.push(topic);
    until(hub, 'opened').then(() => send(hub, {s: topic}));
  }
  return on(hub, topic, data => onMessage(data));
  // TODO: send unsubscribe msg on unsubscribing
}

async function broadcast(hub, topic, message) {
  await until(hub, 'opened');
  return send(hub, {t: topic, d: message});
}

async function sendDirect(hub, {peerId, connId}, message) {
  await until(hub, 'opened');
  return send(hub, {t: 'direct', d: message, p: `${peerId}.${connId}`});
}

async function sendRequest(hub, topic, message) {
  await until(hub, 'opened');
  let {id, promise} = newRequest();
  send(hub, {t: topic, d: message, r: id});
  return promise;
}

async function sendAccept(hub, requestId, message) {
  return send(hub, {t: 'response', d: message, r: requestId});
}

function close({ws, closed}, code = 1000) {
  if (!closed) ws.close(code);
}

function send(hub, msg) {
  let {ws} = hub;
  let jsonMsg = JSON.stringify(msg);
  if (window.DEBUG && msg?.t !== 'ping') console.log('ws sending', jsonMsg);
  try {
    ws.send(jsonMsg);
    return true;
  } catch (err) {
    if (window.DEBUG) {
      console.error('ws error');
      console.error(err);
    }
    close(hub);
    return false;
  }
}

function parse(data) {
  try {
    return JSON.parse(data);
  } catch (err) {
    return undefined;
  }
}

// request / response

const REQUEST_TIMEOUT = 20000;
const clientId = Math.random().toString(32).slice(2, 12);
const requests = new Map();

let nextRequestId = 0;

function newRequest(timeout = REQUEST_TIMEOUT) {
  let requestId = `${clientId};${nextRequestId++}`;
  const request = {id: requestId};
  request.promise = new Promise((resolve, reject) => {
    request.accept = data => {
      clearTimeout(request.timeout);
      resolve(data);
    };
    request.timeout = setTimeout(() => {
      reject(new Error('request timeout'));
    }, timeout);
  });
  requests.set(requestId, request);
  return request;
}

function requestAccepted(requestId, data) {
  let request = requests.get(requestId);
  if (request === undefined) return;
  request.accept(data);
  requests.delete(requestId);
}
