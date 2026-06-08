import { useState, useEffect, useCallback } from "react";
import Head from "next/head";

const USERS = ["Ziyad", "Samra", "Tous les deux"];

const SPACES = [
  {
    id: "conforama", label: "Conforama", emoji: "🛋️",
    bg: "#fef9ec", tape: "#f5e6a3",
    headerBg: "#2c2416", headerAccent: "#f0c040",
    postColors: ["#fff9d6", "#fff3b0", "#ffeaa0", "#fde68a"],
    cats: ["Produits", "E-commerce", "Marketing", "RH", "Opérations", "Finance", "Autre"],
  },
  {
    id: "fds", label: "Fabrique de Style", emoji: "🪑",
    bg: "#f0f4ff", tape: "#c0caff",
    headerBg: "#111828", headerAccent: "#7c8fff",
    postColors: ["#e8edff", "#dde4ff", "#d0d9ff", "#eef0ff"],
    cats: ["Produits", "Marketing", "Stocks", "Fournisseurs", "Opérations", "Finance", "Autre"],
  },
  {
    id: "couple", label: "Ziyad & Samra", emoji: "❤️",
    bg: "#fdf0f3", tape: "#f9c4d2",
    headerBg: "#2a1018", headerAccent: "#f0708a",
    postColors: ["#fce4ec", "#f8bbd0", "#fdd5de", "#ffeef2"],
    cats: ["Courses", "Maison", "Voyage", "Projet", "Sortie", "Admin", "Autre"],
  },
  {
    id: "perso", label: "Ziyado ✦", emoji: "✦",
    bg: "#f0f7f2", tape: "#b8e0c4",
    headerBg: "#0e2418", headerAccent: "#5dd49a",
    postColors: ["#e8f5ee", "#d4eddf", "#c8f0d8", "#f0faf4"],
    cats: ["Santé", "Apprentissage", "Voyage", "Finances", "Loisirs", "Autre"],
  },
];

const PRIORITIES = ["normale", "importante", "urgente"];
const PRIORITY_META = {
  normale:    { label: "·",   color: "#bbb" },
  importante: { label: "!!",  color: "#d4a017" },
  urgente:    { label: "!!!", color: "#d94f4f" },
};

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

async function apiGet() {
  try {
    const r = await fetch("/api/memos");
    const d = await r.json();
    return Array.isArray(d) ? d : [];
  } catch { return null; }
}

async function apiSet(data) {
  try {
    await fetch("/api/memos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {}
}

function Tape({ color, rotation }) {
  return (
    <div style={{
      position: "absolute", top: -10, left: "50%",
      transform: `translateX(-50%) rotate(${rotation}deg)`,
      width: 48, height: 20, background: color,
      opacity: 0.75, borderRadius: 2, zIndex: 2,
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    }} />
  );
}

function WhoBadge({ who }) {
  const map = { Ziyad: "#4f8ef7", Samra: "#e8637a", "Tous les deux": "#48c78e" };
  return (
    <span style={{ fontSize: 11, color: map[who] || "#999", fontWeight: 700 }}>— {who}</span>
  );
}

function PostIt({ item, space, onDelete, onPin, onToggleDone, onToggleListItem, onDeleteListItem, onAddListItem, colorIndex }) {
  const [open, setOpen] = useState(false);
  const [newLI, setNewLI] = useState("");

  const rotation = ((item.id.charCodeAt(0) % 7) - 3) * 0.6;
  const bgColor = space.postColors[colorIndex % space.postColors.length];
  const tapeRot = ((item.id.charCodeAt(1) % 5) - 2) * 3;
  const doneCount = item.type === "list" ? (item.items || []).filter(i => i.done).length : 0;
  const totalCount = item.type === "list" ? (item.items || []).length : 0;
  const isOverdue = item.dueDate && new Date(item.dueDate) < new Date() && !item.done;

  return (
    <div style={{
      position: "relative", marginBottom: 8,
      transform: open ? "rotate(0deg) scale(1.02)" : `rotate(${rotation}deg)`,
      transition: "transform 0.25s cubic-bezier(.34,1.56,.64,1)",
      zIndex: open ? 10 : item.pinned ? 3 : 1,
    }}>
      <Tape color={space.tape} rotation={tapeRot} />
      <div onClick={() => setOpen(o => !o)} style={{
        background: item.done ? bgColor + "88" : bgColor,
        borderRadius: 3, padding: "22px 16px 14px",
        boxShadow: open ? "4px 8px 24px rgba(0,0,0,0.18)" : item.pinned ? "3px 5px 14px rgba(0,0,0,0.15)" : "2px 3px 8px rgba(0,0,0,0.1)",
        cursor: "pointer", position: "relative", minHeight: 100,
        backgroundImage: "repeating-linear-gradient(transparent,transparent 24px,rgba(0,0,0,0.04) 24px,rgba(0,0,0,0.04) 25px)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {item.pinned && <span style={{ fontSize: 14 }}>📌</span>}
            {item.type === "list" && <span style={{ fontSize: 12, color: "#888" }}>☑</span>}
            <span style={{ fontSize: 11, color: PRIORITY_META[item.priority]?.color, fontWeight: 700 }}>
              {PRIORITY_META[item.priority]?.label}
            </span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={e => { e.stopPropagation(); onPin(item.id); }} style={{ background: "none", border: "none", fontSize: 14, opacity: item.pinned ? 1 : 0.3, padding: 0 }}>📌</button>
            <button onClick={e => { e.stopPropagation(); onDelete(item.id); }} style={{ background: "none", border: "none", fontSize: 16, color: "#bbb", padding: 0, lineHeight: 1 }}>×</button>
          </div>
        </div>

        <div style={{
          fontSize: 19, fontWeight: 700,
          color: item.done ? "#bbb" : "#2a2010",
          textDecoration: item.done ? "line-through" : "none",
          lineHeight: 1.2, marginBottom: 6,
        }}>{item.title}</div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <WhoBadge who={item.assignedTo} />
          {item.type === "list" && totalCount > 0 && <span style={{ fontSize: 10, color: "#aaa" }}>{doneCount}/{totalCount}</span>}
          {item.dueDate && <span style={{ fontSize: 10, color: isOverdue ? "#d94f4f" : "#aaa" }}>{isOverdue ? "⚠ " : "📅 "}{new Date(item.dueDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</span>}
          {item.waiting && <span style={{ fontSize: 10, color: "#d4a017" }}>⏳ en attente</span>}
        </div>

        {open && (
          <div onClick={e => e.stopPropagation()} style={{ marginTop: 14, borderTop: "1px dashed rgba(0,0,0,0.1)", paddingTop: 12 }}>
            {item.type === "memo" && (
              <button onClick={() => onToggleDone(item.id)} style={{
                background: item.done ? "#2a2010" : "transparent",
                border: "2px solid #2a2010", borderRadius: 4,
                padding: "4px 12px", fontSize: 13, marginBottom: 10,
                color: item.done ? "#fff" : "#2a2010", fontWeight: 700,
              }}>{item.done ? "✓ Fait" : "Marquer fait"}</button>
            )}
            {item.body && <p style={{ fontSize: 15, color: "#555", lineHeight: 1.7, marginBottom: 12 }}>{item.body}</p>}

            {item.type === "list" && (
              <div style={{ marginBottom: 12 }}>
                {(item.items || []).map(li => (
                  <div key={li.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px dashed rgba(0,0,0,0.08)" }}>
                    <button onClick={() => onToggleListItem(item.id, li.id)} style={{
                      width: 16, height: 16, borderRadius: 3, flexShrink: 0,
                      border: `2px solid ${li.done ? "#2a2010" : "#ccc"}`,
                      background: li.done ? "#2a2010" : "transparent",
                    }} />
                    <span style={{ flex: 1, fontSize: 15, color: li.done ? "#aaa" : "#333", textDecoration: li.done ? "line-through" : "none" }}>{li.text}</span>
                    <button onClick={() => onDeleteListItem(item.id, li.id)} style={{ background: "none", border: "none", color: "#ccc", fontSize: 14, padding: 0 }}>×</button>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <input value={newLI} onChange={e => setNewLI(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && newLI.trim()) { onAddListItem(item.id, newLI.trim()); setNewLI(""); } }}
                    placeholder="Ajouter…"
                    style={{ flex: 1, background: "rgba(255,255,255,0.6)", border: "1px dashed rgba(0,0,0,0.2)", borderRadius: 4, padding: "5px 8px", fontSize: 14, outline: "none", color: "#333" }}
                  />
                  <button onClick={() => { if (newLI.trim()) { onAddListItem(item.id, newLI.trim()); setNewLI(""); } }}
                    style={{ background: "#2a2010", border: "none", color: "#fff", borderRadius: 4, padding: "5px 12px", fontSize: 16 }}>+</button>
                </div>
              </div>
            )}

            <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: 11, color: "#bbb" }}>
              <span>{item.category}</span>
              <span>{item.date}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AddModal({ space, onAdd, onClose }) {
  const [type, setType] = useState("memo");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState("normale");
  const [category, setCategory] = useState(space.cats[0]);
  const [assignedTo, setAssignedTo] = useState("Ziyad");
  const [dueDate, setDueDate] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [listItems, setListItems] = useState([]);
  const [newLI, setNewLI] = useState("");

  const iStyle = { width: "100%", background: "rgba(255,255,255,0.7)", border: "1px dashed rgba(0,0,0,0.2)", borderRadius: 6, color: "#2a2010", fontSize: 16, padding: "10px 12px", outline: "none", marginBottom: 10 };
  const sStyle = { ...iStyle, marginBottom: 0, fontSize: 14 };

  const addLI = () => { if (!newLI.trim()) return; setListItems(p => [...p, { id: uid(), text: newLI.trim(), done: false }]); setNewLI(""); };

  const submit = () => {
    if (!title.trim()) return;
    onAdd({ id: uid(), type, title: title.trim(), body: type === "memo" ? body.trim() : "", items: type === "list" ? listItems : [], priority, category, assignedTo, dueDate, waiting, date: new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }), done: false, pinned: false, spaceId: space.id, createdAt: Date.now() });
    onClose();
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: space.postColors[0], borderRadius: 4, padding: "32px 24px 24px",
        width: "100%", maxWidth: 420, maxHeight: "90vh", overflowY: "auto",
        boxShadow: "6px 10px 40px rgba(0,0,0,0.25)", position: "relative",
        backgroundImage: "repeating-linear-gradient(transparent,transparent 28px,rgba(0,0,0,0.04) 28px,rgba(0,0,0,0.04) 29px)",
      }}>
        <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%) rotate(-1deg)", width: 56, height: 20, background: space.tape, opacity: 0.8, borderRadius: 2 }} />
        <h3 style={{ fontSize: 24, fontWeight: 700, color: "#2a2010", marginBottom: 20 }}>
          {space.emoji} Nouveau {type === "list" ? "liste" : "mémo"}
        </h3>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {["memo", "list"].map(t => (
            <button key={t} onClick={() => setType(t)} style={{ flex: 1, padding: 8, background: type === t ? "#2a2010" : "rgba(255,255,255,0.5)", border: "1px dashed rgba(0,0,0,0.2)", color: type === t ? "#fff" : "#777", borderRadius: 6, fontSize: 15, fontWeight: 700 }}>
              {t === "memo" ? "📝 Mémo" : "☑ Liste"}
            </button>
          ))}
        </div>

        <input autoFocus placeholder={type === "list" ? "Nom de la liste…" : "Titre du mémo…"} value={title} onChange={e => setTitle(e.target.value)} style={iStyle} />
        {type === "memo" && <textarea placeholder="Détails…" value={body} onChange={e => setBody(e.target.value)} rows={3} style={{ ...iStyle, resize: "vertical", lineHeight: 1.5 }} />}

        {type === "list" && (
          <div style={{ marginBottom: 10 }}>
            {listItems.map((li, i) => (
              <div key={li.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px dashed rgba(0,0,0,0.1)" }}>
                <span style={{ color: "#bbb" }}>·</span>
                <span style={{ flex: 1, fontSize: 15, color: "#444" }}>{li.text}</span>
                <button onClick={() => setListItems(p => p.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#ccc", fontSize: 15 }}>×</button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <input value={newLI} onChange={e => setNewLI(e.target.value)} onKeyDown={e => e.key === "Enter" && addLI()} placeholder="Item… (Entrée)" style={{ ...iStyle, marginBottom: 0, flex: 1, fontSize: 14 }} />
              <button onClick={addLI} style={{ background: "#2a2010", border: "none", color: "#fff", borderRadius: 6, padding: "8px 14px", fontSize: 18 }}>+</button>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div><div style={{ fontSize: 12, color: "#aaa", marginBottom: 4 }}>Priorité</div><select value={priority} onChange={e => setPriority(e.target.value)} style={sStyle}>{PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
          <div><div style={{ fontSize: 12, color: "#aaa", marginBottom: 4 }}>Catégorie</div><select value={category} onChange={e => setCategory(e.target.value)} style={sStyle}>{space.cats.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><div style={{ fontSize: 12, color: "#aaa", marginBottom: 4 }}>Assigné à</div><select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} style={sStyle}>{USERS.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
          <div><div style={{ fontSize: 12, color: "#aaa", marginBottom: 4 }}>Échéance</div><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ ...sStyle, colorScheme: "light" }} /></div>
        </div>

        <div onClick={() => setWaiting(w => !w)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: waiting ? "rgba(0,0,0,0.06)" : "transparent", border: "1px dashed rgba(0,0,0,0.15)", borderRadius: 6, marginBottom: 16 }}>
          <div style={{ width: 14, height: 14, borderRadius: 3, border: "2px solid #aaa", background: waiting ? "#2a2010" : "transparent" }} />
          <span style={{ fontSize: 14, color: waiting ? "#2a2010" : "#aaa", fontWeight: 700 }}>⏳ En attente de quelqu'un</span>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "transparent", border: "1px dashed rgba(0,0,0,0.2)", color: "#aaa", borderRadius: 6, padding: "8px 16px", fontSize: 15 }}>Annuler</button>
          <button onClick={submit} style={{ background: "#2a2010", border: "none", color: "#f5e9c8", borderRadius: 6, padding: "8px 20px", fontSize: 16, fontWeight: 700, opacity: title.trim() ? 1 : 0.4 }}>Coller ✓</button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [items, setItems] = useState([]);
  const [activeSpace, setActiveSpace] = useState("conforama");
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("tous");
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");

  const space = SPACES.find(s => s.id === activeSpace);
  const FILTERS = ["tous", "épinglés", "listes", "urgents", "en attente", "Ziyad", "Samra", "terminés"];

  useEffect(() => {
    (async () => {
      setSyncing(true);
      // D'abord charger le local
      let local = [];
      try { local = JSON.parse(localStorage.getItem("memos-local") || "[]"); if (!Array.isArray(local)) local = []; } catch {}
      
      // Ensuite essayer Redis
      const data = await apiGet();
      
      if (data && data.length > 0) {
        // Redis a des données → utiliser Redis
        setItems(data);
        setLastSync(new Date());
      } else if (local.length > 0) {
        // Redis vide mais local a des données → utiliser local et sauvegarder sur Redis
        setItems(local);
        await apiSet(local);
        setLastSync(new Date());
      }
      // sinon tout est vide → rester vide
      
      setSyncing(false);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem("memos-local", JSON.stringify(items)); } catch {}
    const t = setTimeout(async () => {
      if (items.length === 0) return;
      setSyncing(true);
      await apiSet(items);
      setLastSync(new Date());
      setSyncing(false);
    }, 1500);
    return () => clearTimeout(t);
  }, [items, loaded]);

  useEffect(() => {
    const iv = setInterval(async () => {
      const data = await apiGet();
      if (data && data.length > 0) { setItems(data); setLastSync(new Date()); }
    }, 20000);
    return () => clearInterval(iv);
  }, []);

  const mutate = useCallback(fn => setItems(p => fn(p)), []);
  const addItem = item => mutate(p => [{ ...item, spaceId: activeSpace }, ...p]);
  const deleteItem = id => mutate(p => p.filter(i => i.id !== id));
  const pinItem = id => mutate(p => p.map(i => i.id === id ? { ...i, pinned: !i.pinned } : i));
  const toggleDone = id => mutate(p => p.map(i => i.id === id ? { ...i, done: !i.done } : i));
  const toggleLI = (iid, lid) => mutate(p => p.map(i => i.id === iid ? { ...i, items: i.items.map(li => li.id === lid ? { ...li, done: !li.done } : li) } : i));
  const deleteLI = (iid, lid) => mutate(p => p.map(i => i.id === iid ? { ...i, items: i.items.filter(li => li.id !== lid) } : i));
  const addLI = (iid, text) => mutate(p => p.map(i => i.id === iid ? { ...i, items: [...(i.items || []), { id: uid(), text, done: false }] } : i));

  const spaceItems = items.filter(i => i.spaceId === activeSpace);
  const filtered = spaceItems.filter(i => {
    if (search && !i.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "tous") return true;
    if (filter === "épinglés") return i.pinned;
    if (filter === "listes") return i.type === "list";
    if (filter === "en attente") return i.waiting;
    if (filter === "terminés") return i.done;
    if (filter === "urgents") return i.priority === "urgente" && !i.done;
    if (filter === "Ziyad") return i.assignedTo === "Ziyad";
    if (filter === "Samra") return i.assignedTo === "Samra";
    return true;
  }).sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    if (a.done && !b.done) return 1;
    if (!a.done && b.done) return -1;
    return ({ urgente: 0, importante: 1, normale: 2 }[a.priority] || 2) - ({ urgente: 0, importante: 1, normale: 2 }[b.priority] || 2);
  });

  return (
    <>
      <Head>
        <title>Mémos · Ziyad & Samra</title>
        <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Reenie+Beanie&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ minHeight: "100vh", background: space.bg, transition: "background 0.4s", fontFamily: "'Caveat', cursive" }}>

        {/* HEADER */}
        <div style={{ background: space.headerBg, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>
          <div>
            <div style={{ fontFamily: "'Reenie Beanie', cursive", fontSize: 28, color: space.headerAccent, letterSpacing: "0.04em", lineHeight: 1 }}>
              {space.label} {space.emoji}
            </div>
            <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
              {syncing ? "⟳ sync…" : lastSync ? `✓ ${lastSync.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : "local"}
            </div>
          </div>
          <button onClick={() => setShowAdd(true)} style={{ background: space.headerAccent, border: "none", color: space.headerBg, borderRadius: 6, padding: "9px 18px", fontSize: 17, fontFamily: "'Caveat', cursive", fontWeight: 700, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
            + Coller
          </button>
        </div>

        {/* TABS */}
        <div style={{ background: space.headerBg, display: "flex", padding: "0 16px", borderBottom: `3px solid ${space.headerAccent}33`, overflowX: "auto" }}>
          {SPACES.map(s => (
            <button key={s.id} onClick={() => { setActiveSpace(s.id); setFilter("tous"); }} style={{
              background: "none", border: "none",
              borderBottom: activeSpace === s.id ? `3px solid ${s.headerAccent}` : "3px solid transparent",
              color: activeSpace === s.id ? s.headerAccent : "#555",
              padding: "12px 14px 9px", fontSize: 14, whiteSpace: "nowrap",
              fontFamily: "'Caveat', cursive", fontWeight: activeSpace === s.id ? 700 : 400,
              marginBottom: -3, transition: "all 0.2s",
            }}>
              {s.emoji} {s.label}
            </button>
          ))}
        </div>

        <div style={{ padding: "16px", maxWidth: 720, margin: "0 auto" }}>
          {/* SEARCH */}
          <input placeholder="🔍 Chercher un mémo…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.6)", border: "1px dashed rgba(0,0,0,0.2)", borderRadius: 6, color: "#2a2010", fontSize: 16, padding: "10px 14px", outline: "none", marginBottom: 12 }} />

          {/* FILTERS */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? space.headerBg : "rgba(255,255,255,0.5)", border: `1px dashed ${filter === f ? "transparent" : "rgba(0,0,0,0.15)"}`, color: filter === f ? space.headerAccent : "#888", borderRadius: 20, padding: "4px 12px", fontSize: 13, fontFamily: "'Caveat', cursive", fontWeight: filter === f ? 700 : 400, boxShadow: filter === f ? "0 2px 6px rgba(0,0,0,0.15)" : "none" }}>{f}</button>
            ))}
          </div>

          {/* STATS */}
          <div style={{ display: "flex", gap: 12, marginBottom: 20, fontSize: 13, color: "#aaa" }}>
            <span>{spaceItems.filter(i => !i.done).length} actifs</span>
            <span>·</span>
            <span>{spaceItems.filter(i => i.done).length} terminés</span>
            {spaceItems.filter(i => i.priority === "urgente" && !i.done).length > 0 && (
              <><span>·</span><span style={{ color: "#d94f4f", fontWeight: 700 }}>⚠ {spaceItems.filter(i => i.priority === "urgente" && !i.done).length} urgent{spaceItems.filter(i => i.priority === "urgente" && !i.done).length > 1 ? "s" : ""}</span></>
            )}
          </div>

          {/* POST-ITS */}
          {!loaded ? (
            <div style={{ textAlign: "center", color: "#bbb", padding: "60px 0", fontSize: 20 }}>Chargement…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", color: "#ccc", padding: "60px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>📋</div>
              <div style={{ fontSize: 20 }}>Rien ici pour l'instant</div>
            </div>
          ) : (
            <div style={{ columns: "2 260px", columnGap: 16 }}>
              {filtered.map((item, idx) => (
                <div key={item.id} style={{ breakInside: "avoid", marginBottom: 16 }}>
                  <PostIt item={item} space={space} colorIndex={idx}
                    onDelete={deleteItem} onPin={pinItem} onToggleDone={toggleDone}
                    onToggleListItem={toggleLI} onDeleteListItem={deleteLI} onAddListItem={addLI}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {showAdd && <AddModal space={space} onAdd={addItem} onClose={() => setShowAdd(false)} />}
      </div>
    </>
  );
}
