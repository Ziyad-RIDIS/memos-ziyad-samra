import React, { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";

const USERS = ["Ziyad", "Samra", "Tous les deux"];

const SPACES = [
  {
    id: "conforama", label: "Conforama", emoji: "🛋️",
    accent: "#E8001C", bg: "#fafafa",
    cats: ["Produits", "E-commerce", "Marketing", "RH", "Opérations", "Finance", "Autre"],
  },
  {
    id: "fds", label: "Fabrique de Style", emoji: "🪑",
    accent: "#374151", bg: "#fafafa",
    cats: ["Produits", "Marketing", "Stocks", "Fournisseurs", "Opérations", "Finance", "Autre"],
  },
  {
    id: "couple", label: "Ziyad & Samra", emoji: "❤️",
    accent: "#e8637a", bg: "#fafafa",
    cats: ["Courses", "Maison", "Voyage", "Projet", "Sortie", "Admin", "Autre"],
  },
];

const PRIORITY_BLOCKS = [
  { id: "urgente",    label: "🔴 Urgent",    color: "#dc2626", bg: "#fff5f5", border: "#fecaca", light: "#fef2f2" },
  { id: "importante", label: "🟡 Important",  color: "#d97706", bg: "#fffbeb", border: "#fde68a", light: "#fefce8" },
  { id: "normale",    label: "⚪ Normal",     color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", light: "#f3f4f6" },
];

const WHO_COLORS = { Ziyad: "#3b82f6", Samra: "#e8637a", "Tous les deux": "#059669" };

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

function Badge({ children, color }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "2px 8px",
      borderRadius: 20, color, background: color + "18",
    }}>{children}</span>
  );
}

function Card({ item, space, pb, onDelete, onToggleDone, onToggleListItem, onDeleteListItem, onAddListItem, onChangePriority }) {
  const [open, setOpen] = useState(false);
  const [newLI, setNewLI] = useState("");
  const doneCount = item.type === "list" ? (item.items || []).filter(i => i.done).length : 0;
  const totalCount = item.type === "list" ? (item.items || []).length : 0;
  const isOverdue = item.dueDate && new Date(item.dueDate) < new Date() && !item.done;

  return (
    <div style={{
      background: "#fff",
      borderRadius: 14,
      marginBottom: 8,
      boxShadow: open ? "0 4px 20px rgba(0,0,0,0.10)" : "0 1px 3px rgba(0,0,0,0.07)",
      border: `1px solid ${pb.border}`,
      borderLeft: `4px solid ${item.done ? "#e5e7eb" : pb.color}`,
      opacity: item.done ? 0.55 : 1,
      transition: "all 0.2s",
    }}>
      <div onClick={() => setOpen(o => !o)} style={{ padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 10 }}>
        {/* Done button */}
        <button onClick={e => { e.stopPropagation(); onToggleDone(item.id); }} style={{
          width: 22, height: 22, borderRadius: "50%", flexShrink: 0, marginTop: 1,
          border: `2px solid ${item.done ? pb.color : "#d1d5db"}`,
          background: item.done ? pb.color : "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {item.done && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 15, fontWeight: 600,
            color: item.done ? "#9ca3af" : "#111827",
            textDecoration: item.done ? "line-through" : "none",
            lineHeight: 1.4, wordBreak: "break-word",
            marginBottom: 4,
          }}>{item.title}</div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
            {item.assignedTo !== "Tous les deux" && <Badge color={WHO_COLORS[item.assignedTo] || "#9ca3af"}>{item.assignedTo}</Badge>}
            {item.type === "list" && totalCount > 0 && <Badge color="#6b7280">{doneCount}/{totalCount}</Badge>}
            {item.dueDate && <Badge color={isOverdue ? "#dc2626" : "#6b7280"}>{isOverdue ? "⚠ " : "📅 "}{new Date(item.dueDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</Badge>}
            {item.waiting && <Badge color="#d97706">⏳</Badge>}
          </div>
        </div>

        <button onClick={e => { e.stopPropagation(); onDelete(item.id); }} style={{
          background: "none", border: "none", color: "#d1d5db", fontSize: 20, padding: "0 2px", lineHeight: 1, flexShrink: 0,
        }}>×</button>
      </div>

      {/* Priority arrows */}
      <div style={{ display: "flex", gap: 6, padding: "0 14px 10px", justifyContent: "flex-end" }}>
        {PRIORITY_BLOCKS.map((p, i) => {
          const curIdx = PRIORITY_BLOCKS.findIndex(pb => pb.id === item.priority);
          return null;
        })}
        <button onClick={e => { e.stopPropagation(); const idx = PRIORITY_BLOCKS.findIndex(p => p.id === item.priority); if (idx > 0) onChangePriority(item.id, PRIORITY_BLOCKS[idx - 1].id); }} style={{
          background: "none", border: "none", color: "#9ca3af", fontSize: 16, padding: "2px 6px", borderRadius: 6,
          opacity: PRIORITY_BLOCKS.findIndex(p => p.id === item.priority) > 0 ? 1 : 0.2,
        }}>↑</button>
        <button onClick={e => { e.stopPropagation(); const idx = PRIORITY_BLOCKS.findIndex(p => p.id === item.priority); if (idx < PRIORITY_BLOCKS.length - 1) onChangePriority(item.id, PRIORITY_BLOCKS[idx + 1].id); }} style={{
          background: "none", border: "none", color: "#9ca3af", fontSize: 16, padding: "2px 6px", borderRadius: 6,
          opacity: PRIORITY_BLOCKS.findIndex(p => p.id === item.priority) < PRIORITY_BLOCKS.length - 1 ? 1 : 0.2,
        }}>↓</button>
      </div>

      {/* Expanded */}
      {open && (
        <div style={{ padding: "0 14px 14px", borderTop: "1px solid #f3f4f6" }}>
          {item.body && <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.6, margin: "10px 0" }}>{item.body}</p>}
          {item.type === "list" && (
            <div style={{ marginTop: 10 }}>
              {(item.items || []).map(li => (
                <div key={li.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f9fafb" }}>
                  <button onClick={() => onToggleListItem(item.id, li.id)} style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                    border: `2px solid ${li.done ? pb.color : "#d1d5db"}`,
                    background: li.done ? pb.color : "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {li.done && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
                  </button>
                  <span style={{ flex: 1, fontSize: 14, color: li.done ? "#9ca3af" : "#374151", textDecoration: li.done ? "line-through" : "none" }}>{li.text}</span>
                  <button onClick={() => onDeleteListItem(item.id, li.id)} style={{ background: "none", border: "none", color: "#d1d5db", fontSize: 16 }}>×</button>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input value={newLI} onChange={e => setNewLI(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && newLI.trim()) { onAddListItem(item.id, newLI.trim()); setNewLI(""); } }}
                  placeholder="Ajouter un item…"
                  style={{ flex: 1, border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "8px 12px", fontSize: 14, outline: "none", color: "#374151", background: "#f9fafb" }}
                />
                <button onClick={() => { if (newLI.trim()) { onAddListItem(item.id, newLI.trim()); setNewLI(""); } }}
                  style={{ background: pb.color, border: "none", color: "#fff", borderRadius: 10, padding: "8px 14px", fontSize: 18, fontWeight: 700 }}>+</button>
              </div>
            </div>
          )}
          {item.category && <div style={{ marginTop: 8, fontSize: 11, color: "#d1d5db" }}>{item.category} · {item.date}</div>}
        </div>
      )}
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
  const [showMore, setShowMore] = useState(false);
  const titleRef = useRef();

  useEffect(() => { setTimeout(() => titleRef.current?.focus(), 100); }, []);

  const addLI = () => { if (!newLI.trim()) return; setListItems(p => [...p, { id: uid(), text: newLI.trim(), done: false }]); setNewLI(""); };

  const [addedCount, setAddedCount] = useState(0);

  const submit = () => {
    if (!title.trim()) return;
    onAdd({ id: uid(), type, title: title.trim(), body: body.trim(), items: type === "list" ? listItems : [], priority, category, assignedTo, dueDate, waiting, date: new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }), done: false, pinned: false, spaceId: space.id, createdAt: Date.now() });
    setTitle("");
    setBody("");
    setListItems([]);
    setAddedCount(c => c + 1);
    setTimeout(() => titleRef.current?.focus(), 50);
  };

  const iStyle = { width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "12px 14px", fontSize: 15, outline: "none", color: "#111827", background: "#f9fafb", fontFamily: "inherit", boxSizing: "border-box" };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: "24px 24px 0 0",
        padding: "16px 20px 40px", width: "100%", maxWidth: 500,
        maxHeight: "85vh", overflowY: "auto",
      }}>
        <div style={{ width: 36, height: 4, background: "#e5e7eb", borderRadius: 2, margin: "0 auto 16px" }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>{space.emoji} Nouveau</h3>
          <button onClick={onClose} style={{ background: "#f3f4f6", border: "none", borderRadius: "50%", width: 30, height: 30, fontSize: 16, color: "#6b7280" }}>×</button>
        </div>

        {/* Type toggle */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14, background: "#f3f4f6", borderRadius: 12, padding: 4 }}>
          {["memo", "list"].map(t => (
            <button key={t} onClick={() => setType(t)} style={{
              flex: 1, padding: "8px", background: type === t ? "#fff" : "transparent",
              border: "none", borderRadius: 10, color: type === t ? space.accent : "#9ca3af",
              fontSize: 14, fontWeight: 600, fontFamily: "inherit",
              boxShadow: type === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}>
              {t === "memo" ? "📝 Mémo" : "☑ Liste"}
            </button>
          ))}
        </div>

        {/* Title — always visible */}
        <input ref={titleRef}
          placeholder="Titre…"
          value={title} onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && type === "memo" && title.trim()) submit(); }}
          style={{ ...iStyle, fontSize: 16, fontWeight: 600, marginBottom: 10 }}
        />

        {/* List items */}
        {type === "list" && (
          <div style={{ marginBottom: 10 }}>
            {listItems.map((li, i) => (
              <div key={li.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: space.accent, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 14, color: "#374151" }}>{li.text}</span>
                <button onClick={() => setListItems(p => p.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#d1d5db", fontSize: 16 }}>×</button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input value={newLI} onChange={e => setNewLI(e.target.value)} onKeyDown={e => e.key === "Enter" && addLI()}
                placeholder="Ajouter… (Entrée)"
                style={{ ...iStyle, flex: 1, fontSize: 14 }} />
              <button onClick={addLI} style={{ background: space.accent, border: "none", color: "#fff", borderRadius: 12, padding: "0 16px", fontSize: 20 }}>+</button>
            </div>
          </div>
        )}

        {/* Memo body */}
        {type === "memo" && (
          <textarea placeholder="Détails (optionnel)…" value={body} onChange={e => setBody(e.target.value)} rows={2}
            style={{ ...iStyle, resize: "none", lineHeight: 1.5, marginBottom: 10 }} />
        )}

        {/* Priority quick select */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {PRIORITY_BLOCKS.map(p => (
            <button key={p.id} onClick={() => setPriority(p.id)} style={{
              flex: 1, padding: "8px 4px", borderRadius: 10,
              background: priority === p.id ? p.color + "18" : "#f9fafb",
              border: `1.5px solid ${priority === p.id ? p.color : "#e5e7eb"}`,
              color: priority === p.id ? p.color : "#9ca3af",
              fontSize: 12, fontWeight: 600, fontFamily: "inherit",
            }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* More options toggle */}
        <button onClick={() => setShowMore(s => !s)} style={{
          background: "none", border: "none", color: "#9ca3af",
          fontSize: 13, fontFamily: "inherit", marginBottom: showMore ? 12 : 0,
          display: "flex", alignItems: "center", gap: 4,
        }}>
          {showMore ? "▲" : "▼"} {showMore ? "Moins d'options" : "Plus d'options"}
        </button>

        {showMore && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            {[
              { label: "Catégorie", val: category, set: setCategory, opts: space.cats },
              { label: "Assigné à", val: assignedTo, set: setAssignedTo, opts: USERS },
            ].map(({ label, val, set, opts }) => (
              <div key={label}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
                <select value={val} onChange={e => set(e.target.value)} style={{ ...iStyle, fontSize: 13 }}>
                  {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Échéance</div>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ ...iStyle, fontSize: 13, colorScheme: "light" }} />
            </div>
            <div onClick={() => setWaiting(w => !w)} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
              borderRadius: 12, background: waiting ? space.accent + "12" : "#f9fafb",
              border: `1.5px solid ${waiting ? space.accent + "44" : "#e5e7eb"}`,
              cursor: "pointer", marginTop: 22,
            }}>
              <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${waiting ? space.accent : "#d1d5db"}`, background: waiting ? space.accent : "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {waiting && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
              </div>
              <span style={{ fontSize: 13, color: waiting ? space.accent : "#6b7280", fontWeight: 600 }}>⏳ En attente</span>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "14px", background: "#f3f4f6",
            border: "none", borderRadius: 14, color: "#6b7280",
            fontSize: 15, fontWeight: 600, fontFamily: "inherit",
          }}>
            Fermer {addedCount > 0 ? `(${addedCount} ajouté${addedCount > 1 ? "s" : ""})` : ""}
          </button>
          <button onClick={submit} style={{
            flex: 2, padding: "14px", background: title.trim() ? space.accent : "#e5e7eb",
            border: "none", borderRadius: 14, color: title.trim() ? "#fff" : "#9ca3af",
            fontSize: 16, fontWeight: 700, fontFamily: "inherit",
            transition: "all 0.15s",
          }}>
            Ajouter ✓
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [items, setItems] = useState([]);
  const [activeSpace, setActiveSpace] = useState("conforama");
  const [showAdd, setShowAdd] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [showDone, setShowDone] = useState(false);

  const space = SPACES.find(s => s.id === activeSpace);

  useEffect(() => {
    (async () => {
      setSyncing(true);
      let local = [];
      try { local = JSON.parse(localStorage.getItem("memos-local") || "[]"); if (!Array.isArray(local)) local = []; } catch {}
      const data = await apiGet();
      if (data && data.length > 0) { setItems(data); setLastSync(new Date()); }
      else if (local.length > 0) { setItems(local); await apiSet(local); setLastSync(new Date()); }
      setSyncing(false);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem("memos-local", JSON.stringify(items)); } catch {}
    const t = setTimeout(async () => {
      setSyncing(true);
      await apiSet(items);
      setLastSync(new Date());
      setSyncing(false);
    }, 1500);
    return () => clearTimeout(t);
  }, [items, loaded]);

  const mutate = useCallback(fn => setItems(p => fn(p)), []);
  const addItem = item => mutate(p => [{ ...item, spaceId: activeSpace }, ...p]);
  const deleteItem = id => mutate(p => p.filter(i => i.id !== id));
  const toggleDone = id => mutate(p => p.map(i => i.id === id ? { ...i, done: !i.done } : i));
  const toggleLI = (iid, lid) => mutate(p => p.map(i => i.id === iid ? { ...i, items: i.items.map(li => li.id === lid ? { ...li, done: !li.done } : li) } : i));
  const deleteLI = (iid, lid) => mutate(p => p.map(i => i.id === iid ? { ...i, items: i.items.filter(li => li.id !== lid) } : i));
  const addLI = (iid, text) => mutate(p => p.map(i => i.id === iid ? { ...i, items: [...(i.items || []), { id: uid(), text, done: false }] } : i));
  const changePriority = (id, newP) => mutate(p => p.map(i => i.id === id ? { ...i, priority: newP } : i));

  const spaceItems = items.filter(i => i.spaceId === activeSpace && !i.done);
  const doneItems = items.filter(i => i.spaceId === activeSpace && i.done);

  const filtered = (arr) => arr.filter(i => !search || i.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <Head>
        <title>Mémos · Ziyad & Samra</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ minHeight: "100vh", background: "#f3f4f6", fontFamily: "'Inter', sans-serif" }}>

        {/* HEADER */}
        <div style={{ background: "#fff", padding: "16px 16px 0", boxShadow: "0 1px 0 #e5e7eb", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 19, fontWeight: 700, color: "#111827" }}>{space.emoji} {space.label}</div>
              <div style={{ fontSize: 11, color: syncing ? "#f59e0b" : "#9ca3af", marginTop: 1 }}>
                {syncing ? "⟳ Sync…" : lastSync ? `✓ ${lastSync.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : ""}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={async () => { setSyncing(true); const data = await apiGet(); if (data && data.length > 0) { setItems(data); setLastSync(new Date()); } setSyncing(false); }}
                style={{ background: "#f3f4f6", border: "none", borderRadius: 12, width: 40, height: 40, fontSize: 18, color: "#6b7280" }}>↻</button>
              <button onClick={() => setShowAdd(true)}
                style={{ background: space.accent, border: "none", color: "#fff", borderRadius: 12, width: 40, height: 40, fontSize: 24, fontWeight: 700 }}>+</button>
            </div>
          </div>

          {/* TABS */}
          <div style={{ display: "flex", overflowX: "auto", scrollbarWidth: "none" }}>
            {SPACES.map(s => (
              <button key={s.id} onClick={() => setActiveSpace(s.id)} style={{
                background: "none", border: "none", padding: "10px 14px 12px",
                borderBottom: activeSpace === s.id ? `2px solid ${s.accent}` : "2px solid transparent",
                color: activeSpace === s.id ? s.accent : "#9ca3af",
                fontSize: 13, fontWeight: activeSpace === s.id ? 700 : 500,
                whiteSpace: "nowrap", fontFamily: "inherit", transition: "all 0.15s",
              }}>
                {s.emoji} {s.id === "fds" ? "FdS" : s.id === "couple" ? "Nous ❤️" : s.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "14px" }}>
          {/* SEARCH */}
          <div style={{ position: "relative", marginBottom: 14 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}>🔍</span>
            <input placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} style={{
              width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 12,
              padding: "10px 12px 10px 36px", fontSize: 14, outline: "none",
              color: "#374151", background: "#fff", fontFamily: "inherit", boxSizing: "border-box",
            }} />
          </div>

          {/* PRIORITY BLOCKS */}
          {!loaded ? (
            <div style={{ textAlign: "center", color: "#9ca3af", padding: "60px 0" }}>Chargement…</div>
          ) : (
            <>
              {PRIORITY_BLOCKS.map(pb => {
                const blockItems = filtered(spaceItems.filter(i => i.priority === pb.id));
                if (blockItems.length === 0 && !search) return null;
                return (
                  <div key={pb.id} style={{ marginBottom: 16 }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8,
                      marginBottom: 8, padding: "8px 12px",
                      background: pb.light, borderRadius: 10,
                      border: `1px solid ${pb.border}`,
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: pb.color }}>{pb.label}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: "#fff",
                        background: pb.color, borderRadius: 20, padding: "1px 8px",
                      }}>{blockItems.length}</span>
                    </div>
                    {blockItems.length === 0 ? (
                      <div style={{ textAlign: "center", color: "#d1d5db", fontSize: 13, padding: "12px 0" }}>Aucun</div>
                    ) : blockItems.map(item => (
                      <Card key={item.id} item={item} space={space} pb={pb}
                        onDelete={deleteItem} onToggleDone={toggleDone}
                        onToggleListItem={toggleLI} onDeleteListItem={deleteLI}
                        onAddListItem={addLI} onChangePriority={changePriority}
                      />
                    ))}
                  </div>
                );
              })}

              {/* DONE SECTION */}
              {doneItems.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <button onClick={() => setShowDone(s => !s)} style={{
                    background: "none", border: "none", color: "#9ca3af",
                    fontSize: 13, fontFamily: "inherit", fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 6, padding: "4px 0",
                  }}>
                    {showDone ? "▼" : "▶"} Terminés ({doneItems.length})
                  </button>
                  {showDone && filtered(doneItems).map(item => (
                    <Card key={item.id} item={item} space={space} pb={PRIORITY_BLOCKS[2]}
                      onDelete={deleteItem} onToggleDone={toggleDone}
                      onToggleListItem={toggleLI} onDeleteListItem={deleteLI}
                      onAddListItem={addLI} onChangePriority={changePriority}
                    />
                  ))}
                </div>
              )}

              {spaceItems.length === 0 && doneItems.length === 0 && (
                <div style={{ textAlign: "center", color: "#9ca3af", padding: "60px 0" }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>✓</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Tout est vide !</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>Appuie sur + pour ajouter</div>
                </div>
              )}
            </>
          )}
        </div>

        {showAdd && <AddModal space={space} onAdd={addItem} onClose={() => setShowAdd(false)} />}
      </div>
    </>
  );
}
