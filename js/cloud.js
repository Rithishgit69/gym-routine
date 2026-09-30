/* Optional Supabase backup and sync for the offline-first app. */
window.Cloud = (() => {
  const config = {
    url: 'https://gcjwxfemvzlsyhunxwgh.supabase.co',
    key: 'sb_publishable_bD_o8o5R9faIBikO1b7sqg_AdrEd4hx'
  };
  const recordStores = ['checkins', 'logs', 'meta'];
  let client = null;
  let user = null;
  let lastSync = null;
  let syncing = null;
  let error = null;

  function ready() {
    return !!(window.supabase && config.url && config.key);
  }

  async function init() {
    if (!ready()) throw new Error('Supabase client is unavailable');
    if (!client) client = window.supabase.createClient(config.url, config.key);
    if (!user) {
      const session = (await client.auth.getSession()).data.session;
      if (session) user = session.user;
      else user = (await client.auth.signInAnonymously()).data.user;
    }
    if (!user) throw new Error('Could not create a cloud session');
    return user;
  }

  function payload(store, value) {
    if (store === 'checkins') {
      const { thumb, ...record } = value;
      return record;
    }
    return value;
  }

  function recordKey(store, value) {
    return store === 'meta' ? value.k : store === 'logs' ? value.key : value.date;
  }

  async function pushStore(store) {
    const rows = (await DB.all(store)).map((value) => ({
      user_id: user.id,
      store_name: store,
      record_key: recordKey(store, value),
      payload: payload(store, value),
      updated_at: new Date().toISOString()
    }));
    if (!rows.length) return;
    const { error: pushError } = await client.from('gym_records').upsert(rows, { onConflict: 'user_id,store_name,record_key' });
    if (pushError) throw pushError;
  }

  async function pushPhotos() {
    for (const record of await DB.all('checkins')) {
      if (!record.hasFull) continue;
      const photo = await DB.get('photos', record.date);
      if (!photo || !photo.blob) continue;
      const path = `${user.id}/${record.date}.jpg`;
      const upload = await client.storage.from('checkin-photos').upload(path, photo.blob, { contentType: 'image/jpeg', upsert: true });
      if (upload.error) throw upload.error;
      const { error: photoError } = await client.from('gym_photos').upsert({
        user_id: user.id,
        date: record.date,
        storage_path: path,
        bytes: record.fullBytes || photo.blob.size
      }, { onConflict: 'user_id,date' });
      if (photoError) throw photoError;
    }
  }

  async function pullRecords() {
    const { data, error: pullError } = await client.from('gym_records').select('store_name,record_key,payload,updated_at');
    if (pullError) throw pullError;
    for (const row of data || []) {
      const local = await DB.get(row.store_name, row.record_key);
      if (!local) await DB.put(row.store_name, row.payload);
    }
  }

  async function sync() {
    if (syncing) return syncing;
    syncing = (async () => {
      try {
        await init();
        await pullRecords();
        for (const store of recordStores) await pushStore(store);
        await pushPhotos();
        lastSync = Date.now();
        error = null;
        return true;
      } catch (e) {
        error = e.message || String(e);
        console.warn('Cloud sync unavailable:', error);
        return false;
      } finally {
        syncing = null;
      }
    })();
    return syncing;
  }

  return {
    sync,
    status: () => ({ configured: ready(), connected: !!user, lastSync, error })
  };
})();
