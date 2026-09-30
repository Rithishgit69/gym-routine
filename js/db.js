/* IndexedDB storage. This remains the offline-first local source of truth.
   Stores:
     checkins  {date, ts, month, thumb: Blob, hasFull, fullBytes}
     photos    {date, blob: Blob}            full-size check-in photos
     logs      {key: 'YYYY-MM-DD|exId', date, exId, session, sets: [{w, r}]}
     meta      {k, ...}                        settings, archive state
     edits     {month, template, blob, mime, ext, createdAt}   monthly gym edit videos */
window.DB = (() => {
  let dbp = null;

  function open() {
    if (!dbp) {
      dbp = new Promise((resolve, reject) => {
        const r = indexedDB.open('gym-routine', 2);
        r.onupgradeneeded = () => {
          const d = r.result;
          const has = (n) => d.objectStoreNames.contains(n);
          if (!has('checkins')) d.createObjectStore('checkins', { keyPath: 'date' });
          if (!has('photos')) d.createObjectStore('photos', { keyPath: 'date' });
          if (!has('logs')) {
            const logs = d.createObjectStore('logs', { keyPath: 'key' });
            logs.createIndex('exId', 'exId');
            logs.createIndex('date', 'date');
          }
          if (!has('meta')) d.createObjectStore('meta', { keyPath: 'k' });
          if (!has('edits')) d.createObjectStore('edits', { keyPath: 'month' }); // monthly gym edit videos
        };
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
    }
    return dbp;
  }

  function done(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function store(name, mode = 'readonly') {
    const d = await open();
    return d.transaction(name, mode).objectStore(name);
  }

  return {
    get: async (s, k) => done((await store(s)).get(k)),
    put: async (s, v) => done((await store(s, 'readwrite')).put(v)),
    del: async (s, k) => done((await store(s, 'readwrite')).delete(k)),
    all: async (s) => done((await store(s)).getAll()),
    byIndex: async (s, idx, key) => done((await store(s)).index(idx).getAll(key)),
    clear: async (s) => done((await store(s, 'readwrite')).clear()),
    async meta(k, fallback = null) {
      const v = await this.get('meta', k);
      return v ? v.v : fallback;
    },
    setMeta: async (k, v) => done((await store('meta', 'readwrite')).put({ k, v }))
  };
})();
