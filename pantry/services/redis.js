const {createNodeRedisClient} = require('handy-redis');
const {local} = require('../config');

const localStore = {};

let _exports = {
  get: key => localStore[key],
  set: (key, value) => (localStore[key] = value),
  del: key => {
    delete localStore[key];
  },
  list: prefix => Object.keys(localStore).filter(key => key.startsWith(prefix)),
  roomCount: () =>
    Object.keys(localStore).filter(key => key.startsWith('rooms/')).length,
  identityCount: () =>
    Object.keys(localStore).filter(key => key.startsWith('identities/')).length,
  mget: (keys) => Object.keys(localStore).filter(key => keys.includes(key)),
  initOrIncrement: (k) => {let c = get(k); if (c==undefined||c==null) {c="1"} else {c=String(Math.floor(c)+1);} let s = set(k,c); return c;},
};

if (!local) {
  let client = createNodeRedisClient({host: 'pantryredis'});
  client.nodeRedis.on('error', err => {
    console.log('error connecting to redis, host pantryredis');
    console.error(err);
    client.nodeRedis.quit();
  });
  // do this after migrating to esm
  // await new Promise(resolve => client.nodeRedis.on('ready', resolve));

  const roomCount = async () => (await client.keys('rooms/*')).length;
  const identityCount = async () => (await client.keys('identities/*')).length;
  const set = (key, value) => client.set(key, JSON.stringify(value));
  const get = async key => JSON.parse(await client.get(key));
  const del = key => client.del(key);
  const list = prefix => client.keys(`${prefix}*`);
  const mget = async keys => JSON.parse(await client.mget(keys));

  const initOrIncrement = async (k) => {
    let c = await get(k);
    if (c == undefined || c == null) {c ="1";} else {c = String(Math.floor(c) + 1);}
    let s = await set(k, c);
    return c;
  };

  _exports = {
    get,
    set,
    del,
    list,
    roomCount,
    identityCount,
    mget,
    initOrIncrement,
  };
}

module.exports = _exports;
