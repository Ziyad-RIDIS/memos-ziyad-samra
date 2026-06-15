import React, { useState, useEffect, useCallback } from "react";
import Head from "next/head";

const USERS = ["Ziyad", "Samra", "Tous les deux"];

const SPACES = [
  {
    id: "conforama", label: "Conforama", emoji: "🛋️",
    accent: "#E8001C", bg: "#fff8f8", lightBg: "#fff0f0",
    cats: ["Produits", "E-commerce", "Marketing", "RH", "Opérations", "Finance", "Autre"],
  },
  {
    id: "fds", label: "Fabrique de Style", emoji: "🪑",
    accent: "#374151", bg: "#f8f9fa", lightBg: "#f1f3f5",
    cats: ["Produits", "Marketing", "Stocks", "Fournisseurs", "Opérations", "Finance", "Autre"],
  },
  {
    id: "couple", label: "Ziyad & Samra", emoji: "❤️",
    accent: "#e8637a", bg: "#fff8f9", lightBg: "#ffeef1",
    cats: ["Courses", "Maison", "Voyage", "Projet", "Sortie", "Admin", "Autre"],
  },
  {
    id: "perso", label: "Ziyado ✦", emoji: "✦",
    accent: "#059669", bg: "#f8fffe", lightBg: "#ecfdf5",
    cats: ["Santé", "Apprentissage", "Voyage", "Finances", "Loisirs", "Autre"],
  },
];

const PRIORITY_META = {
  normale:    { label: "Normale",    color: "#9ca3af", dot: "#d1d5db" },
  importante: { label: "Importante", color: "#d97706", dot: "#fbbf24" },
  urgente:    { label: "Urgente",    color: "#dc2626", dot: "#ef4444" },
};

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

function Badge({ children, color, bg }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "2px 8px",
      borderRadius: 20, color: color,
      background: bg || color + "18",
      letterSpacing: "0.02em",
    }}>{children}</span>
  );
}

function Card({ item, space, onDelete, onPin, onToggleDone, onToggleListItem, onDeleteListItem, onAddListItem }) {
  const [open, setOpen] = useState(false);
  const [newLI, setNewLI] = useState("");

  const doneCount = item.type === "list" ? (item.items || []).filter(i => i.done).length : 0;
  const totalCount = item.type === "list" ? (item.items || []).length : 0;
  const isOverdue = item.dueDate && new Date(item.dueDate) < new Date() && !item.done;
  const pm = PRIORITY_META[item.priority] || PRIORITY_META.normale;

  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      marginBottom: 10,
      boxShadow: open ? "0 4px 24px rgba(0,0,0,0.10)" : "0 1px 4px rgba(0,0,0,0.07)",
      border: "1px solid #f0f0f0",
      borderLeft: `4px solid ${item.done ? "#e5e7eb" : space.accent}`,
      opacity: item.done ? 0.6 : 1,
      transition: "all 0.2s",
      overflow: "hidden",
    }}>
      {/* Main row */}
      <div onClick={() => setOpen(o => !o)} style={{
        padding: "14px 16px", cursor: "pointer",
        display: "flex", alignItems: "flex-start", gap: 12,
      }}>
        {/* Done circle */}
        {item.type === "memo" && (
          <button onClick={e => { e.stopPropagation(); onToggleDone(item.id); }} style={{
            width: 22, height: 22, borderRadius: "50%", flexShrink: 0, marginTop: 1,
            border: `2px solid ${item.done ? space.accent : "#d1d5db"}`,
            background: item.done ? space.accent : "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {item.done && <span style={{ color: "#fff", fontSize: 12, lineHeight: 1 }}>✓</span>}
          </button>
        )}
        {item.type === "list" && (
          <div style={{
            width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
            border: `2px solid ${space.accent}`,
            background: doneCount === totalCount && totalCount > 0 ? space.accent : "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 11, color: doneCount === totalCount && totalCount > 0 ? "#fff" : space.accent }}>☑</span>
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 15, fontWeight: 600,
            color: item.done ? "#9ca3af" : "#111827",
            textDecoration: item.done ? "line-through" : "none",
            marginBottom: 6, lineHeight: 1.3,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>{item.pinned && "📌 "}{item.title}</div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <Badge color={pm.color}>{pm.label}</Badge>
            <Badge color={WHO_COLORS[item.assignedTo] || "#9ca3af"}>{item.assignedTo}</Badge>
            {item.type === "list" && totalCount > 0 && (
              <Badge color="#6b7280">{doneCount}/{totalCount}</Badge>
            )}
            {item.dueDate && (
              <Badge color={isOverdue ? "#dc2626" : "#6b7280"}>
                {isOverdue ? "⚠ " : "📅 "}{new Date(item.dueDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
              </Badge>
            )}
            {item.waiting && <Badge color="#d97706">⏳ En attente</Badge>}
            <span style={{ fontSize: 11, color: "#d1d5db" }}>{item.category}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button onClick={e => { e.stopPropagation(); onPin(item.id); }} style={{
            background: "none", border: "none", fontSize: 16,
            opacity: item.pinned ? 1 : 0.2, padding: "2px 4px",
          }}>📌</button>
          <button onClick={e => { e.stopPropagation(); onDelete(item.id); }} style={{
            background: "none", border: "none", color: "#d1d5db",
            fontSize: 20, padding: "0 4px", lineHeight: 1,
          }}>×</button>
        </div>
      </div>

      {/* Expanded */}
      {open && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid #f3f4f6" }}>
          {item.body && (
            <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.6, margin: "12px 0" }}>{item.body}</p>
          )}

          {item.type === "list" && (
            <div style={{ marginTop: 12 }}>
              {(item.items || []).map(li => (
                <div key={li.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 0", borderBottom: "1px solid #f9fafb",
                }}>
                  <button onClick={() => onToggleListItem(item.id, li.id)} style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                    border: `2px solid ${li.done ? space.accent : "#d1d5db"}`,
                    background: li.done ? space.accent : "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {li.done && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
                  </button>
                  <span style={{
                    flex: 1, fontSize: 14,
                    color: li.done ? "#9ca3af" : "#374151",
                    textDecoration: li.done ? "line-through" : "none",
                  }}>{li.text}</span>
                  <button onClick={() => onDeleteListItem(item.id, li.id)} style={{
                    background: "none", border: "none", color: "#d1d5db", fontSize: 16,
                  }}>×</button>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input value={newLI} onChange={e => setNewLI(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && newLI.trim()) { onAddListItem(item.id, newLI.trim()); setNewLI(""); } }}
                  placeholder="Ajouter un item…"
                  style={{
                    flex: 1, border: "1.5px solid #e5e7eb", borderRadius: 10,
                    padding: "8px 12px", fontSize: 14, outline: "none", color: "#374151",
                    background: "#f9fafb",
                  }}
                />
                <button onClick={() => { if (newLI.trim()) { onAddListItem(item.id, newLI.trim()); setNewLI(""); } }}
                  style={{
                    background: space.accent, border: "none", color: "#fff",
                    borderRadius: 10, padding: "8px 14px", fontSize: 18, fontWeight: 700,
                  }}>+</button>
              </div>
            </div>
          )}

          <div style={{ marginTop: 10, fontSize: 11, color: "#d1d5db", textAlign: "right" }}>{item.date}</div>
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

  const iStyle = {
    width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 12,
    padding: "11px 14px", fontSize: 15, outline: "none",
    color: "#111827", background: "#f9fafb", marginBottom: 10,
    fontFamily: "inherit",
  };

  const addLI = () => { if (!newLI.trim()) return; setListItems(p => [...p, { id: uid(), text: newLI.trim(), done: false }]); setNewLI(""); };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      zIndex: 1000, backdropFilter: "blur(4px)",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: "24px 24px 0 0",
        padding: "24px 20px 36px", width: "100%", maxWidth: 500,
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
      }}>
        {/* Handle bar */}
        <div style={{ width: 40, height: 4, background: "#e5e7eb", borderRadius: 2, margin: "0 auto 20px" }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>
            {space.emoji} Nouveau
          </h3>
          <button onClick={onClose} style={{ background: "#f3f4f6", border: "none", borderRadius: "50%", width: 32, height: 32, fontSize: 18, color: "#6b7280" }}>×</button>
        </div>

        {/* Type toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, background: "#f3f4f6", borderRadius: 12, padding: 4 }}>
          {["memo", "list"].map(t => (
            <button key={t} onClick={() => setType(t)} style={{
              flex: 1, padding: "8px",
              background: type === t ? "#fff" : "transparent",
              border: "none", borderRadius: 10,
              color: type === t ? space.accent : "#9ca3af",
              fontSize: 14, fontWeight: 600, fontFamily: "inherit",
              boxShadow: type === t ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
            }}>
              {t === "memo" ? "📝 Mémo" : "☑ Liste"}
            </button>
          ))}
        </div>

        <input autoFocus placeholder={type === "list" ? "Nom de la liste…" : "Titre…"} value={title} onChange={e => setTitle(e.target.value)} style={{ ...iStyle, fontSize: 16, fontWeight: 600 }} />

        {type === "memo" && (
          <textarea placeholder="Détails (optionnel)…" value={body} onChange={e => setBody(e.target.value)} rows={3}
            style={{ ...iStyle, resize: "none", lineHeight: 1.5 }} />
        )}

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
                placeholder="Item… (Entrée)" style={{ ...iStyle, marginBottom: 0, flex: 1 }} />
              <button onClick={addLI} style={{ background: space.accent, border: "none", color: "#fff", borderRadius: 12, padding: "0 16px", fontSize: 20, fontWeight: 700 }}>+</button>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          {[
            { label: "Priorité", val: priority, set: setPriority, opts: ["normale", "importante", "urgente"] },
            { label: "Catégorie", val: category, set: setCategory, opts: space.cats },
            { label: "Assigné à", val: assignedTo, set: setAssignedTo, opts: USERS },
          ].map(({ label, val, set, opts }) => (
            <div key={label}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
              <select value={val} onChange={e => set(e.target.value)} style={{ ...iStyle, marginBottom: 0, fontSize: 13 }}>
                {opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Échéance</div>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ ...iStyle, marginBottom: 0, fontSize: 13, colorScheme: "light" }} />
          </div>
        </div>

        <div onClick={() => setWaiting(w => !w)} style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 14px", borderRadius: 12,
          background: waiting ? space.accent + "12" : "#f9fafb",
          border: `1.5px solid ${waiting ? space.accent + "44" : "#e5e7eb"}`,
          cursor: "pointer", marginBottom: 16,
        }}>
          <div style={{
            width: 20, height: 20, borderRadius: 6,
            border: `2px solid ${waiting ? space.accent : "#d1d5db"}`,
            background: waiting ? space.accent : "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {waiting && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
          </div>
          <span style={{ fontSize: 14, color: waiting ? space.accent : "#6b7280", fontWeight: waiting ? 600 : 400 }}>
            ⏳ En attente de quelqu'un
          </span>
        </div>

        <button onClick={() => {
          if (!title.trim()) return;
          onAdd({ id: uid(), type, title: title.trim(), body: type === "memo" ? body.trim() : "", items: type === "list" ? listItems : [], priority, category, assignedTo, dueDate, waiting, date: new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }), done: false, pinned: false, spaceId: space.id, createdAt: Date.now() });
          onClose();
        }} style={{
          width: "100%", padding: "14px", background: space.accent,
          border: "none", borderRadius: 14, color: "#fff",
          fontSize: 16, fontWeight: 700, fontFamily: "inherit",
          opacity: title.trim() ? 1 : 0.4,
        }}>
          Ajouter ✓
        </button>
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

  const mutate = useCallback(fn => { setItems(p => fn(p)); }, []);
  const addItem = item => mutate(p => [{ ...item, spaceId: activeSpace }, ...p]);
  const deleteItem = id => mutate(p => p.filter(i => i.id !== id));
  const pinItem = id => mutate(p => p.map(i => i.id === id ? { ...i, pinned: !i.pinned } : i));
  const toggleDone = id => mutate(p => p.map(i => i.id === id ? { ...i, done: !i.done } : i));
  const toggleLI = (iid, lid) => mutate(p => p.map(i => i.id === iid ? { ...i, items: i.items.map(li => li.id === lid ? { ...li, done: !li.done } : li) } : i));
  const deleteLI = (iid, lid) => mutate(p => p.map(i => i.id === iid ? { ...i, items: i.items.filter(li => li.id !== lid) } : i));
  const addLI = (iid, text) => mutate(p => p.map(i => i.id === iid ? { ...i, items: [...(i.items || []), { id: uid(), text, done: false }] } : i));

  const spaceItems = items.filter(i => i.spaceId === activeSpace);
  const FILTERS = [
    { id: "tous", label: "Tous" },
    { id: "épinglés", label: "📌" },
    { id: "listes", label: "☑ Listes" },
    { id: "urgents", label: "🔴 Urgents" },
    { id: "Ziyad", label: "Ziyad" },
    { id: "Samra", label: "Samra" },
    { id: "terminés", label: "✓ Faits" },
  ];

  const filtered = spaceItems.filter(i => {
    if (search && !i.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "tous") return !i.done;
    if (filter === "épinglés") return i.pinned;
    if (filter === "listes") return i.type === "list";
    if (filter === "urgents") return i.priority === "urgente" && !i.done;
    if (filter === "terminés") return i.done;
    if (filter === "Ziyad") return i.assignedTo === "Ziyad" && !i.done;
    if (filter === "Samra") return i.assignedTo === "Samra" && !i.done;
    return true;
  }).sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return ({ urgente: 0, importante: 1, normale: 2 }[a.priority] || 2) - ({ urgente: 0, importante: 1, normale: 2 }[b.priority] || 2);
  });

  const urgentCount = spaceItems.filter(i => i.priority === "urgente" && !i.done).length;

  return (
    <>
      <Head>
        <title>Mémos · Ziyad & Samra</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ minHeight: "100vh", background: space.bg, fontFamily: "'Inter', sans-serif" }}>

        {/* HEADER */}
        <div style={{
          background: "#fff", padding: "16px 16px 0",
          boxShadow: "0 1px 0 #f0f0f0", position: "sticky", top: 0, zIndex: 50,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
                {space.emoji} {space.label}
              </div>
              <div style={{ fontSize: 11, color: syncing ? "#f59e0b" : "#9ca3af", marginTop: 1 }}>
                {syncing ? "⟳ Synchronisation…" : lastSync ? `✓ Sync ${lastSync.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : ""}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={async () => {
                setSyncing(true);
                const data = await apiGet();
                if (data && data.length > 0) { setItems(data); setLastSync(new Date()); }
                setSyncing(false);
              }} style={{
                background: "#f3f4f6", border: "none", borderRadius: 12,
                width: 40, height: 40, fontSize: 18, color: "#6b7280",
              }}>↻</button>
              <button onClick={() => setShowAdd(true)} style={{
                background: space.accent, border: "none", color: "#fff",
                borderRadius: 12, width: 40, height: 40, fontSize: 22, fontWeight: 700,
              }}>+</button>
            </div>
          </div>

          {/* SPACE TABS */}
          <div style={{ display: "flex", gap: 0, overflowX: "auto", scrollbarWidth: "none" }}>
            {SPACES.map(s => (
              <button key={s.id} onClick={() => { setActiveSpace(s.id); setFilter("tous"); }} style={{
                background: "none", border: "none", padding: "10px 14px 12px",
                borderBottom: activeSpace === s.id ? `2px solid ${s.accent}` : "2px solid transparent",
                color: activeSpace === s.id ? s.accent : "#9ca3af",
                fontSize: 13, fontWeight: activeSpace === s.id ? 700 : 500,
                whiteSpace: "nowrap", fontFamily: "inherit",
                transition: "all 0.15s",
              }}>
                {s.emoji} {s.id === "fds" ? "FdS" : s.label.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "16px" }}>

          {/* SEARCH */}
          <div style={{ position: "relative", marginBottom: 12 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 16 }}>🔍</span>
            <input placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} style={{
              width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 12,
              padding: "10px 12px 10px 36px", fontSize: 14, outline: "none",
              color: "#374151", background: "#fff", fontFamily: "inherit",
            }} />
          </div>

          {/* STATS */}
          {urgentCount > 0 && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 12, padding: "10px 14px", marginBottom: 12,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>🔴</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#dc2626" }}>
                {urgentCount} mémo{urgentCount > 1 ? "s" : ""} urgent{urgentCount > 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* FILTERS */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", marginBottom: 16, paddingBottom: 2 }}>
            {FILTERS.map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)} style={{
                background: filter === f.id ? space.accent : "#fff",
                border: `1.5px solid ${filter === f.id ? space.accent : "#e5e7eb"}`,
                color: filter === f.id ? "#fff" : "#6b7280",
                borderRadius: 20, padding: "6px 14px",
                fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
                fontFamily: "inherit", transition: "all 0.15s",
              }}>{f.label}</button>
            ))}
          </div>

          {/* CARDS */}
          {!loaded ? (
            <div style={{ textAlign: "center", color: "#9ca3af", padding: "60px 0", fontSize: 14 }}>Chargement…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", color: "#9ca3af", padding: "60px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>✓</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Rien ici !</div>
            </div>
          ) : (
            filtered.map(item => (
              <Card key={item.id} item={item} space={space}
                onDelete={deleteItem} onPin={pinItem} onToggleDone={toggleDone}
                onToggleListItem={toggleLI} onDeleteListItem={deleteLI} onAddListItem={addLI}
              />
            ))
          )}

          {/* Count */}
          {loaded && (
            <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#d1d5db" }}>
              {spaceItems.filter(i => !i.done).length} actif{spaceItems.filter(i => !i.done).length > 1 ? "s" : ""} · {spaceItems.filter(i => i.done).length} terminé{spaceItems.filter(i => i.done).length > 1 ? "s" : ""}
            </div>
          )}
        </div>

        {showAdd && <AddModal space={space} onAdd={addItem} onClose={() => setShowAdd(false)} />}
      </div>
    </>
  );
}
