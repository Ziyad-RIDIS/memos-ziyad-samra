const UPSTASH_URL = "https://champion-tarpon-70830.upstash.io";
const UPSTASH_TOKEN = "gQAAAAAAARSuAAIgcDE3M2ZlMGM1NDY4MDg0NmQ5YjA4ZGRmYTc3OTRmOWU2MA";
const REDIS_KEY = "ziyad-samra-memos-v2";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method === "GET") {
    try {
      const r = await fetch(`${UPSTASH_URL}/get/${REDIS_KEY}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });
      const d = await r.json();
      const data = d.result ? JSON.parse(d.result) : [];
      res.status(200).json(Array.isArray(data) ? data : []);
    } catch (e) {
      res.status(500).json([]);
    }
  } else if (req.method === "POST") {
    try {
      const items = req.body;
      await fetch(`${UPSTASH_URL}/set/${REDIS_KEY}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${UPSTASH_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(JSON.stringify(items)),
      });
      res.status(200).json({ ok: true });
    } catch (e) {
      res.status(500).json({ ok: false });
    }
  } else {
    res.status(405).end();
  }
}
