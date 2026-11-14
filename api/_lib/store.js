import { get, put, BlobPreconditionFailedError } from '@vercel/blob';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

// Without a Blob token (local development) state lives in .data/state.json.
const LOCAL = !process.env.BLOB_READ_WRITE_TOKEN && !process.env.VERCEL;
const LOCAL_FILE = new URL('../../.data/state.json', import.meta.url);

// shortcut: one private JSON blob as the database; fine for one family, move to a real DB for more groups.
const PATH = 'lootjes/state.json';

const empty = () => ({ participants: [], assignments: null, drawnAt: null });

export async function load() {
  if (LOCAL) {
    try { return { state: JSON.parse(await readFile(LOCAL_FILE, 'utf8')), etag: null }; }
    catch { return { state: empty(), etag: null }; }
  }
  const r = await get(PATH, { access: 'private', useCache: false });
  if (!r) return { state: empty(), etag: null };
  return { state: JSON.parse(await new Response(r.stream).text()), etag: r.blob.etag };
}

// Read-modify-write with optimistic locking, so two people saving at once don't overwrite each other.
export async function update(fn) {
  for (let i = 0; ; i++) {
    const { state, etag } = await load();
    const result = await fn(state);
    if (LOCAL) {
      await mkdir(new URL('.', LOCAL_FILE), { recursive: true });
      await writeFile(LOCAL_FILE, JSON.stringify(state, null, 2));
      return result;
    }
    try {
      await put(PATH, JSON.stringify(state), {
        access: 'private', allowOverwrite: true, addRandomSuffix: false,
        contentType: 'application/json', ...(etag ? { ifMatch: etag } : {}),
      });
      return result;
    } catch (e) {
      if (!(e instanceof BlobPreconditionFailedError) || i >= 4) throw e;
    }
  }
}
