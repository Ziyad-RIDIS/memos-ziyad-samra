const UPSTASH_URL = process.env.UPSTASH_URL || "https://champion-tarpon-70830.upstash.io";
const UPSTASH_TOKEN = process.env.UPSTASH_TOKEN || "gQAAAAAAARSuAAIgcDE3M2ZlMGM1NDY4MDg0NmQ5YjA4ZGRmYTc3OTRmOWU2MA";
const REDIS_KEY = "ziyad-samra-memos-v2";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  console.log("API called:", req.method, "URL:", UPSTASH_URL ? "ok" : "missing", "TOKEN:", UPSTASH_TOKEN ? "ok" : "missing");

  if (req.method === "GET") {
    try {
      const r = await fetch(`${UPSTASH_URL}/get/${REDIS_KEY}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });
      const d = await r.json();
      console.log("GET result:", JSON.stringify(d).slice(0, 100));
      let data = [];
      if (d.result) {
        try {
          const parsed = JSON.parse(d.result);
          // Handle double-serialized data
          if (typeof parsed === "string") {
            data = JSON.parse(parsed);
          } else {
            data = parsed;
          }
        } catch {}
      }
      res.status(200).json(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log("GET error:", e.message);
      res.status(500).json([]);
    }
  } else if (req.method === "POST") {
    try {
      const items = req.body;
      console.log("POST items count:", Array.isArray(items) ? items.length : "not array");
      const r = await fetch(`${UPSTASH_URL}/set/${REDIS_KEY}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${UPSTASH_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(JSON.stringify(items)),
      });
      const d = await r.json();
      console.log("POST result:", JSON.stringify(d));
      res.status(200).json({ ok: true });
    } catch (e) {
      console.log("POST error:", e.message);
      res.status(500).json({ ok: false });
    }
  } else {
    res.status(405).end();
  }
}
