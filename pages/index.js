import React, { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";

const USERS = ["Ziyad", "Samra", "Tous les deux"];

const SPACES = [
  {
    id: "work", label: "Travail", emoji: "💼",
    accent: "#2563eb", bg: "#fafafa",
    cats: ["Produits", "E-commerce", "Marketing", "Stocks", "Fournisseurs", "RH", "Opérations", "Finance", "Autre"],
  },
  {
    id: "couple", label: "Ziyad & Samra", emoji: "❤️",
    accent: "#e8637a", bg: "#fafafa",
    cats: ["Courses", "Maison", "Voyage", "Projet", "Sortie", "Admin", "Autre"],
  },
];

// Dans « Travail », chaque élément porte une marque (stockée dans spaceId)
const BRANDS = {
  conforama: { id: "conforama", label: "Conforama", color: "#E8001C" },
  fds: { id: "fds", label: "FDS", color: "#374151" },
};
const spaceOfItem = id => (id === "couple" ? "couple" : "work");

const PRIORITY_BLOCKS = [
  { id: "urgente",    label: "🔴 Urgent",    color: "#dc2626", bg: "#fff5f5", border: "#fecaca", light: "#fef2f2" },
  { id: "importante", label: "🟡 Important",  color: "#d97706", bg: "#fffbeb", border: "#fde68a", light: "#fefce8" },
  { id: "normale",    label: "⚪ Normal",     color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", light: "#f3f4f6" },
];

const WHO_COLORS = { Ziyad: "#3b82f6", Samra: "#e8637a", "Tous les deux": "#059669" };

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

// ── Ajout de produits en masse ──────────────────────────────────────────────
// Clé de comparaison : minuscules, sans accents, espaces normalisés
const normKey = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();

// Transforme un texte multi-lignes en [{ text, qty }]
// - 1 ligne = 1 produit, lignes vides ignorées
// - quantités reconnues : "x2", "x 2", "×2", "(x2)", "2x ", "2 x "
// - puces / numérotation retirées : "- ", "• ", "1. ", "1) ", "[ ] "
// - doublons regroupés (quantités additionnées)
function parseShoppingText(text) {
  const found = new Map();
  String(text || "").split(/\r\n|\r|\n|\u2028|\u2029/).forEach(raw => {
    let line = raw.trim();
    if (!line) return;
    line = line.replace(/^(?:[-–—*•·▪◦●○▫☐☑✓✔]+\s*|\[[ xX]?\]\s*|\d+[.)]\s+)/, "").trim();
    if (!line) return;

    let name = line;
    let qty = 1;
    const trailing = line.match(/^(.*?)(?:\s+[xX]|\s*[(\[]\s*[xX]|\s*×)\s*(\d+)\s*[)\]]?\s*$/);
    const leading = line.match(/^(\d+)\s*(?:[xX]\s+|×\s*)(.+)$/);
    if (trailing && trailing[1].trim()) {
      name = trailing[1];
      qty = parseInt(trailing[2], 10);
    } else if (leading) {
      qty = parseInt(leading[1], 10);
      name = leading[2];
    }
    name = name.replace(/^[\s,;:\-–]+|[\s,;:\-–]+$/g, "").trim();
    if (!name) return;
    qty = Math.max(1, qty || 1);

    const key = normKey(name);
    if (found.has(key)) found.get(key).qty += qty;
    else found.set(key, { text: name, qty });
  });
  return [...found.values()];
}

// Fusionne des produits parsés dans une liste existante (sans doublons)
function mergeItems(existing, parsed) {
  const items = [...existing];
  const index = new Map(items.map((it, i) => [normKey(it.text), i]));
  parsed.forEach(({ text, qty }) => {
    const key = normKey(text);
    if (index.has(key)) {
      const i = index.get(key);
      const cur = items[i];
      // déjà coché → on le remet à acheter avec la nouvelle quantité
      items[i] = cur.done ? { ...cur, done: false, qty } : { ...cur, qty: (cur.qty || 1) + qty };
    } else {
      index.set(key, items.length);
      items.push({ id: uid(), text, qty, done: false });
    }
  });
  return items;
}

function QtyBadge({ qty, color }) {
  if (!qty || qty < 2) return null;
  return (
    <span style={{ fontSize: 12, fontWeight: 700, color, background: color + "18", borderRadius: 20, padding: "1px 8px", flexShrink: 0 }}>×{qty}</span>
  );
}

// Champ d'ajout : Entrée = ajouter, coller plusieurs lignes = tout ajouter d'un coup
function ListAdder({ value, onChange, onSubmit, fieldStyle, btnStyle, placeholder }) {
  const ref = useRef();
  const [flash, setFlash] = useState("");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [value]);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(""), 2500);
    return () => clearTimeout(t);
  }, [flash]);

  const submit = raw => {
    const n = parseShoppingText(raw).length;
    if (n === 0) return;
    onSubmit(raw);
    onChange("");
    if (n > 1) setFlash(`✓ ${n} produits ajoutés`);
  };

  const handlePaste = e => {
    const pasted = (e.clipboardData || window.clipboardData)?.getData("text") || "";
    if (!/[\r\n]/.test(pasted)) return; // une seule ligne : collage normal
    e.preventDefault();
    const el = e.target;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    submit(value.slice(0, start) + pasted + value.slice(end));
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        <textarea ref={ref} rows={1} value={value}
          onChange={e => onChange(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(value); }
          }}
          placeholder={placeholder}
          style={{ ...fieldStyle, resize: "none", overflowY: "auto", lineHeight: 1.4, fontFamily: "inherit" }}
        />
        <button onClick={() => submit(value)} style={btnStyle}>+</button>
      </div>
      {flash && <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: "#059669" }}>{flash}</div>}
    </div>
  );
}

async function apiGet() {
  try {
    const r = await fetch("/api/memos");
    const d = await r.json();
    return Array.isArray(d) ? d : [];
  } catch { return null; }
}

/**
 * Envoie uniquement ce qui a changé sur cet appareil depuis la dernière version reçue du
 * serveur (`base`). Le serveur fusionne avec les changements des autres appareils et
 * renvoie la liste complète à jour. Renvoie null en cas d'échec.
 */
function diffChanges(base, items) {
  const baseById = new Map(base.map(i => [i.id, i]));
  const ids = new Set(items.map(i => i.id));
  const upserts = [];
  for (const item of items) {
    const b = baseById.get(item.id);
    if (!b || JSON.stringify(b) !== JSON.stringify(item)) upserts.push({ item, base: b || null });
  }
  const deletes = base.filter(b => !ids.has(b.id)).map(b => b.id);
  return { upserts, deletes };
}

async function apiSync(base, items, keepalive = false) {
  const changes = diffChanges(base, items);
  if (changes.upserts.length === 0 && changes.deletes.length === 0) return { ok: true, items: null };
  try {
    const r = await fetch("/api/memos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
      keepalive,
    });
    if (!r.ok) return null;
    const d = await r.json();
    return { ok: true, items: Array.isArray(d.items) ? d.items : null };
  } catch { return null; }
}

function Badge({ children, color }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "2px 8px",
      borderRadius: 20, color, background: color + "18",
    }}>{children}</span>
  );
}

function Card({ item, space, pb, onDelete, onToggleDone, onToggleListItem, onDeleteListItem, onAddListItem, onChangePriority, onEdit }) {
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
            {BRANDS[item.spaceId] && <Badge color={BRANDS[item.spaceId].color}>{BRANDS[item.spaceId].label}</Badge>}
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
                  <QtyBadge qty={li.qty} color={li.done ? "#9ca3af" : pb.color} />
                  <button onClick={() => onDeleteListItem(item.id, li.id)} style={{ background: "none", border: "none", color: "#d1d5db", fontSize: 16 }}>×</button>
                </div>
              ))}
              <div style={{ marginTop: 10 }}>
                <ListAdder
                  value={newLI} onChange={setNewLI}
                  onSubmit={text => onAddListItem(item.id, text)}
                  placeholder="Ajouter ou coller une liste…"
                  fieldStyle={{ flex: 1, minWidth: 0, border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "8px 12px", fontSize: 14, outline: "none", color: "#374151", background: "#f9fafb" }}
                  btnStyle={{ background: pb.color, border: "none", color: "#fff", borderRadius: 10, padding: "8px 14px", fontSize: 18, fontWeight: 700 }}
                />
              </div>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
            <div style={{ fontSize: 11, color: "#d1d5db" }}>{item.category ? `${item.category} · ${item.date}` : ""}</div>
            <button onClick={() => onEdit(item)} style={{
              background: pb.color + "14", border: "none", color: pb.color, borderRadius: 10,
              padding: "8px 14px", fontSize: 13, fontWeight: 700, fontFamily: "inherit",
            }}>✏️ Modifier</button>
          </div>
        </div>
      )}
    </div>
  );
}

function EditableRow({ li, color, onChange, onDelete }) {
  const label = li => (li.qty >= 2 ? `${li.text} x${li.qty}` : li.text);
  const [v, setV] = useState(label(li));
  const commit = () => {
    const p = parseShoppingText(v)[0];
    if (!p) { setV(label(li)); return; }
    onChange({ ...li, text: p.text, qty: p.qty });
    setV(p.qty >= 2 ? `${p.text} x${p.qty}` : p.text);
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: "1px solid #f3f4f6" }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <input value={v} onChange={e => setV(e.target.value)} onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
        style={{ flex: 1, minWidth: 0, border: "none", outline: "none", fontSize: 14, color: "#374151", background: "transparent", padding: "6px 0", fontFamily: "inherit" }} />
      <button onClick={onDelete} style={{ background: "none", border: "none", color: "#d1d5db", fontSize: 16 }}>×</button>
    </div>
  );
}

function AddModal({ space: spaceProp, onAdd, onClose, initial, onSave, defaultBrand }) {
  const isEdit = !!initial;
  const [brand, setBrand] = useState(BRANDS[initial?.spaceId] ? initial.spaceId : defaultBrand || "conforama");
  const space = spaceProp.id === "work" ? { ...spaceProp, accent: BRANDS[brand].color } : spaceProp;
  const [type, setType] = useState(initial?.type || "memo");
  const [title, setTitle] = useState(initial?.title || "");
  const [body, setBody] = useState(initial?.body || "");
  const [priority, setPriority] = useState(initial?.priority || "normale");
  const [category, setCategory] = useState(initial?.category || spaceProp.cats[0]);
  const [assignedTo, setAssignedTo] = useState(initial?.assignedTo || "Ziyad");
  const [dueDate, setDueDate] = useState(initial?.dueDate || "");
  const [waiting, setWaiting] = useState(!!initial?.waiting);
  const [listItems, setListItems] = useState(initial?.items || []);
  const [newLI, setNewLI] = useState("");
  const [showMore, setShowMore] = useState(isEdit);
  const titleRef = useRef();

  useEffect(() => { if (!isEdit) setTimeout(() => titleRef.current?.focus(), 100); }, []);

  const addLI = text => setListItems(p => mergeItems(p, parseShoppingText(text)));

  const [addedCount, setAddedCount] = useState(0);

  const submit = () => {
    if (!title.trim()) return;
    if (isEdit) {
      const finalItems = type === "list" ? mergeItems(listItems, parseShoppingText(newLI)) : [];
      onSave({ ...initial, spaceId: spaceProp.id === "work" ? brand : initial.spaceId, title: title.trim(), body: body.trim(), items: finalItems, priority, category, assignedTo, dueDate, waiting });
      return;
    }
    // si du texte est resté dans le champ produit sans avoir été validé, on l'inclut
    const finalItems = type === "list" ? mergeItems(listItems, parseShoppingText(newLI)) : [];
    onAdd({ id: uid(), type, title: title.trim(), body: body.trim(), items: finalItems, priority, category, assignedTo, dueDate, waiting, date: new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }), done: false, pinned: false, spaceId: spaceProp.id === "work" ? brand : spaceProp.id, createdAt: Date.now() });
    if (spaceProp.id === "work") { try { localStorage.setItem("memos-brand", brand); } catch {} }
    setTitle("");
    setBody("");
    setListItems([]);
    setNewLI("");
    setAddedCount(c => c + 1);
    setTimeout(() => titleRef.current?.focus(), 50);
  };

  const iStyle = { width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "12px 14px", fontSize: 15, outline: "none", color: "#111827", background: "#f9fafb", fontFamily: "inherit", boxSizing: "border-box" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: "24px 24px 0 0",
        padding: "16px 20px 40px", width: "100%", maxWidth: 500,
        maxHeight: "85vh", overflowY: "auto",
      }}>
        <div style={{ width: 36, height: 4, background: "#e5e7eb", borderRadius: 2, margin: "0 auto 16px" }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>{space.emoji} {isEdit ? "✏️ Modifier" : "Nouveau"}</h3>
          <button onClick={onClose} style={{ background: "#f3f4f6", border: "none", borderRadius: "50%", width: 30, height: 30, fontSize: 16, color: "#6b7280" }}>×</button>
        </div>

        {/* Marque */}
        {spaceProp.id === "work" && (
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {Object.values(BRANDS).map(b => (
              <button key={b.id} onClick={() => setBrand(b.id)} style={{
                flex: 1, padding: "10px 6px", borderRadius: 12, fontFamily: "inherit",
                background: brand === b.id ? b.color : "#f9fafb",
                border: `1.5px solid ${brand === b.id ? b.color : "#e5e7eb"}`,
                color: brand === b.id ? "#fff" : "#9ca3af",
                fontSize: 14, fontWeight: 700,
              }}>{b.label}</button>
            ))}
          </div>
        )}

        {/* Type toggle */}
        {!isEdit && <div style={{ display: "flex", gap: 6, marginBottom: 14, background: "#f3f4f6", borderRadius: 12, padding: 4 }}>
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
        </div>}

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
            {listItems.map(li => (
              <EditableRow key={li.id + ":" + li.text + ":" + li.qty} li={li} color={space.accent}
                onChange={n => setListItems(p => p.map(x => x.id === n.id ? n : x))}
                onDelete={() => setListItems(p => p.filter(x => x.id !== li.id))} />
            ))}
            <div style={{ marginTop: 8 }}>
              <ListAdder
                value={newLI} onChange={setNewLI}
                onSubmit={addLI}
                placeholder="Ajouter ou coller une liste…"
                fieldStyle={{ ...iStyle, flex: 1, minWidth: 0, fontSize: 14 }}
                btnStyle={{ background: space.accent, border: "none", color: "#fff", borderRadius: 12, padding: "0 16px", fontSize: 20 }}
              />
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
                  {(opts.includes(val) ? opts : [val, ...opts]).map(o => <option key={o} value={o}>{o}</option>)}
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
            {isEdit ? "Annuler" : `Fermer ${addedCount > 0 ? `(${addedCount} ajouté${addedCount > 1 ? "s" : ""})` : ""}`}
          </button>
          <button onClick={submit} style={{
            flex: 2, padding: "14px", background: title.trim() ? space.accent : "#e5e7eb",
            border: "none", borderRadius: 14, color: title.trim() ? "#fff" : "#9ca3af",
            fontSize: 16, fontWeight: 700, fontFamily: "inherit",
            transition: "all 0.15s",
          }}>
            {isEdit ? "Enregistrer ✓" : "Ajouter ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [items, setItems] = useState([]);
  const [activeSpace, setActiveSpace] = useState("work");
  const [brandFilter, setBrandFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [showDone, setShowDone] = useState(false);

  const space = SPACES.find(s => s.id === activeSpace);

  const itemsRef = useRef(items);
  itemsRef.current = items;
  const modalRef = useRef(false);
  modalRef.current = !!(showAdd || editing);
  const skipRef = useRef(false);   // la prochaine modif vient du serveur : ne pas la renvoyer
  const dirtyRef = useRef(false);  // modifs locales pas encore envoyées
  const busyRef = useRef(false);   // envoi en cours
  const verRef = useRef(0);
  // Dernière version reçue du serveur, sur laquelle sont basées les modifs locales.
  // Sert à n'envoyer QUE ce qui a changé ici, pour ne jamais écraser les ajouts d'un autre appareil.
  const baseRef = useRef([]);
  const setBase = b => { baseRef.current = b; try { localStorage.setItem("memos-base", JSON.stringify(b)); } catch {} };
  // Adopte la version du serveur comme état local (sans la renvoyer)
  const adopt = data => { skipRef.current = true; setBase(data); setItems(data); };

  useEffect(() => {
    (async () => {
      setSyncing(true);
      let local = [], base = [], wasDirty = false;
      try { local = JSON.parse(localStorage.getItem("memos-local") || "[]"); if (!Array.isArray(local)) local = []; } catch {}
      try { base = JSON.parse(localStorage.getItem("memos-base") || "[]"); if (!Array.isArray(base)) base = []; } catch {}
      try { wasDirty = localStorage.getItem("memos-dirty") === "1"; } catch {}
      if (wasDirty && local.length > 0) {
        // Des modifs faites ici n'avaient pas été envoyées : on n'envoie que celles-ci, fusionnées côté serveur.
        // (Sans version de base connue, on n'envoie que les ajouts, pour ne rien écraser.)
        let syncBase = base;
        if (!syncBase.length) {
          const server = (await apiGet()) || [];
          const serverIds = new Set(server.map(i => i.id));
          syncBase = local.filter(i => serverIds.has(i.id)); // => seuls les mémos absents du serveur sont envoyés
        }
        const res = await apiSync(syncBase, local);
        if (res && res.items) { adopt(res.items); try { localStorage.removeItem("memos-dirty"); } catch {} }
        else { setBase(syncBase); setItems(local); } // échec réseau : on garde les modifs locales, elles seront renvoyées automatiquement
        setLastSync(new Date());
      } else {
        const data = await apiGet();
        if (data && data.length > 0) { adopt(data); setLastSync(new Date()); }
        else if (data && local.length > 0) {
          // Serveur vide mais mémos sur cet appareil : on les renvoie
          const res = await apiSync([], local);
          if (res && res.items) adopt(res.items); else { skipRef.current = true; setItems(local); }
          setLastSync(new Date());
        } else if (!data && local.length > 0) { skipRef.current = true; setItems(local); }
      }
      setSyncing(false);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem("memos-local", JSON.stringify(items)); } catch {}
    if (skipRef.current) { skipRef.current = false; return; }
    dirtyRef.current = true;
    try { localStorage.setItem("memos-dirty", "1"); } catch {}
    const ver = ++verRef.current;
    const t = setTimeout(async () => {
      busyRef.current = true;
      setSyncing(true);
      const res = await apiSync(baseRef.current, items);
      busyRef.current = false;
      if (res && verRef.current === ver) {
        // Aucune autre modif locale entre-temps : on adopte la version fusionnée du serveur
        // (qui contient aussi les ajouts des autres appareils).
        dirtyRef.current = false;
        try { localStorage.removeItem("memos-dirty"); } catch {}
        if (res.items) adopt(res.items);
      }
      setLastSync(new Date());
      setSyncing(false);
    }, 600);
    return () => clearTimeout(t);
  }, [items, loaded]);

  // Mise à jour automatique : au retour sur l'appli, puis toutes les 20 s
  const pull = useCallback(async () => {
    const blocked = () => dirtyRef.current || busyRef.current || modalRef.current;
    if (blocked()) return;
    const data = await apiGet();
    if (!data || blocked()) return;
    if (JSON.stringify(data) === JSON.stringify(itemsRef.current)) { setBase(data); return; }
    adopt(data);
    setLastSync(new Date());
  }, []);

  useEffect(() => {
    if (!loaded) return;
    // en quittant l'appli (verrouillage, changement d'app) : envoi immédiat des modifs en attente
    const flush = () => {
      if (dirtyRef.current && !busyRef.current) {
        apiSync(baseRef.current, itemsRef.current, true).then(res => {
          if (res) {
            dirtyRef.current = false; // la prochaine mise à jour récupérera la version fusionnée
            try { localStorage.removeItem("memos-dirty"); } catch {}
          }
        });
      }
    };
    const onVisible = () => { if (document.visibilityState === "visible") pull(); else flush(); };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    const id = setInterval(() => { if (document.visibilityState === "visible") pull(); }, 20000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("pagehide", flush);
      clearInterval(id);
    };
  }, [loaded, pull]);

  const mutate = useCallback(fn => setItems(p => fn(p)), []);
  const addItem = item => mutate(p => [{ ...item, spaceId: item.spaceId || activeSpace }, ...p]);
  const deleteItem = id => mutate(p => p.filter(i => i.id !== id));
  const toggleDone = id => mutate(p => p.map(i => i.id === id ? { ...i, done: !i.done } : i));
  const toggleLI = (iid, lid) => mutate(p => p.map(i => i.id === iid ? { ...i, items: i.items.map(li => li.id === lid ? { ...li, done: !li.done } : li) } : i));
  const deleteLI = (iid, lid) => mutate(p => p.map(i => i.id === iid ? { ...i, items: i.items.filter(li => li.id !== lid) } : i));
  const addLI = (iid, text) => mutate(p => p.map(i => i.id === iid ? { ...i, items: mergeItems(i.items || [], parseShoppingText(text)) } : i));
  const changePriority = (id, newP) => mutate(p => p.map(i => i.id === id ? { ...i, priority: newP } : i));

  const inView = i => spaceOfItem(i.spaceId) === activeSpace && (activeSpace !== "work" || brandFilter === "all" || i.spaceId === brandFilter);
  const spaceItems = items.filter(i => inView(i) && !i.done);
  const doneItems = items.filter(i => inView(i) && i.done);
  const defaultBrand = (() => {
    if (brandFilter !== "all") return brandFilter;
    try { const b = localStorage.getItem("memos-brand"); if (BRANDS[b]) return b; } catch {}
    return "conforama";
  })();

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
                {s.id === "couple" ? "Nous ❤️" : `${s.emoji} ${s.label}`}
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
                        onAddListItem={addLI} onChangePriority={changePriority} onEdit={setEditing}
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
                      onAddListItem={addLI} onChangePriority={changePriority} onEdit={setEditing}
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

        {editing && <AddModal key={editing.id} space={SPACES.find(s => s.id === spaceOfItem(editing.spaceId))} initial={editing}
          onSave={u => { mutate(p => p.map(i => i.id === u.id ? u : i)); setEditing(null); }}
          onClose={() => setEditing(null)} />}
        {showAdd && <AddModal space={space} defaultBrand={defaultBrand} onAdd={addItem} onClose={() => setShowAdd(false)} />}
      </div>
    </>
  );
}
