const UPSTASH_URL = process.env.UPSTASH_URL || "https://champion-tarpon-70830.upstash.io";
const UPSTASH_TOKEN = process.env.UPSTASH_TOKEN || "gQAAAAAAARSuAAIgcDE3M2ZlMGM1NDY4MDg0NmQ5YjA4ZGRmYTc3OTRmOWU2MA";
const REDIS_KEY = "ziyad-samra-memos-v2";

async function readAll() {
  const r = await fetch(`${UPSTASH_URL}/get/${REDIS_KEY}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
  });
  const d = await r.json();
  let data = [];
  if (d.result) {
    try {
      const parsed = JSON.parse(d.result);
      // Ancien format doublement sérialisé
      data = typeof parsed === "string" ? JSON.parse(parsed) : parsed;
    } catch {}
  }
  return Array.isArray(data) ? data : [];
}

async function writeAll(items) {
  const r = await fetch(`${UPSTASH_URL}/set/${REDIS_KEY}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(JSON.stringify(items)),
  });
  if (!r.ok) throw new Error("Upstash " + r.status);
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Fusion à trois voies d'une liste d'éléments ayant un `id` (ex. les articles d'une liste de courses). */
function mergeList(base = [], mine = [], current = []) {
  const baseById = new Map(base.map(x => [x.id, x]));
  const mineById = new Map(mine.map(x => [x.id, x]));
  let out = current.slice();
  // supprimés sur cet appareil
  for (const b of base) if (!mineById.has(b.id)) out = out.filter(x => x.id !== b.id);
  for (const m of mine) {
    const b = baseById.get(m.id);
    const idx = out.findIndex(x => x.id === m.id);
    if (!b) { if (idx === -1) out.push(m); }          // ajouté sur cet appareil
    else if (!same(b, m)) {                             // modifié sur cet appareil
      if (idx === -1) continue;                         // supprimé ailleurs entre-temps
      out[idx] = mergeObject(b, m, out[idx]);
    }
  }
  return out;
}

/** Fusion champ par champ : on applique seulement ce que cet appareil a changé. */
function mergeObject(base, mine, current) {
  if (!base) return mine;
  if (!current) return mine;
  const out = { ...current };
  for (const k of new Set([...Object.keys(base), ...Object.keys(mine)])) {
    if (same(base[k], mine[k])) continue;
    if (Array.isArray(mine[k]) && mine[k].every(x => x && typeof x === "object" && "id" in x)) {
      out[k] = mergeList(Array.isArray(base[k]) ? base[k] : [], mine[k], Array.isArray(current[k]) ? current[k] : []);
    } else if (k in mine) out[k] = mine[k];
    else delete out[k];
  }
  return out;
}

/**
 * Applique les changements envoyés par un appareil sur la version actuelle du serveur,
 * sans jamais écraser ce qu'un autre appareil a ajouté ou modifié entre-temps.
 */
function applyChanges(current, { upserts = [], deletes = [] }) {
  let out = current.filter(i => !deletes.includes(i.id));
  const added = [];
  for (const { item, base } of upserts) {
    if (!item || !item.id) continue;
    const idx = out.findIndex(i => i.id === item.id);
    if (idx === -1) {
      if (!base) added.push(item); // nouvel élément (s'il avait une base, il a été supprimé ailleurs)
    } else {
      out[idx] = mergeObject(base, item, out[idx]);
    }
  }
  return [...added, ...out];
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    try {
      res.status(200).json(await readAll());
    } catch (e) {
      console.log("GET error:", e.message);
      res.status(500).json([]);
    }
  } else if (req.method === "POST") {
    try {
      const body = req.body;
      const current = await readAll();
      let next;
      if (Array.isArray(body)) {
        // Ancienne version de l'appli encore ouverte (avant rechargement) : elle envoie toute
        // sa liste, peut-être périmée. On n'en garde que les nouveaux mémos, pour ne rien écraser.
        next = applyChanges(current, { upserts: body.filter(i => i && i.id && !current.some(c => c.id === i.id)).map(item => ({ item, base: null })) });
      } else {
        next = applyChanges(current, body || {});
      }
      await writeAll(next);
      res.status(200).json({ ok: true, items: next });
    } catch (e) {
      console.log("POST error:", e.message);
      res.status(500).json({ ok: false });
    }
  } else {
    res.status(405).end();
  }
}

export { applyChanges, mergeObject, mergeList };
