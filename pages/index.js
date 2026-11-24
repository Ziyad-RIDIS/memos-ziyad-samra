import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";

// ─── STORES ───────────────────────────────────────────────────────────────────
const STORES = {
  conforama: {
    label:"Conforama Réunion", short:"Conforama", color:"#E8001C", colorLight:"#fff1f1",
    prestataires:[
      {nom:"ICPR",typologie:"PRINT & SIGNALÉTIQUE",poste:"Catalogue imprimé & distribution"},
      {nom:"SRA",typologie:"PRINT & SIGNALÉTIQUE",poste:"Affichage 4x3"},
      {nom:"ICS RUN",typologie:"PRINT & SIGNALÉTIQUE",poste:"Impression 4x3 magasin"},
      {nom:"LOGO",typologie:"PRINT & SIGNALÉTIQUE",poste:"PLV, vitrine, bâche, décli mag"},
      {nom:"Design System",typologie:"PRINT & SIGNALÉTIQUE",poste:"Design system créa"},
      {nom:"Hedgy expertise",typologie:"DIGITAL",poste:"Facebook & INSTA : SPONSO TOTAL"},
      {nom:"Hedgy expertise",typologie:"DIGITAL",poste:"Google Ads"},
      {nom:"Hedgy expertise",typologie:"DIGITAL",poste:"Gestion sponso : coût du service"},
      {nom:"Hedgy expertise",typologie:"DIGITAL",poste:"Meta Ads"},
      {nom:"Lapub.re",typologie:"DIGITAL",poste:"Lapub.re"},
      {nom:"Dealrun",typologie:"DIGITAL",poste:"Dealrun"},
      {nom:"Dealprint",typologie:"PRINT & SIGNALÉTIQUE",poste:"Impression / Dealprint"},
      {nom:"Internet",typologie:"DIGITAL",poste:"Abonnements outils digitaux"},
      {nom:"Soyoo",typologie:"WEB",poste:"Maintenance technique"},
      {nom:"SMS Partner",typologie:"SERVICE",poste:"Achat SMS livraisons"},
      {nom:"Radio Régie",typologie:"AUDIOVISUEL & MÉDIA",poste:"Radio"},
      {nom:"Radio Régie",typologie:"AUDIOVISUEL & MÉDIA",poste:"Audio Ads TF1+"},
      {nom:"ZINFO",typologie:"AUDIOVISUEL & MÉDIA",poste:"Habillage + interstitielle"},
      {nom:"Antenne Réunion",typologie:"AUDIOVISUEL & MÉDIA",poste:"TV / Antenne"},
      {nom:"Agence Cool Cool",typologie:"AUDIOVISUEL & MÉDIA",poste:"Création / Réel / graphisme / vidéo"},
      {nom:"Divers",typologie:"INFLUENCE & PARTENARIAT",poste:"Collaboration influenceur / jeux concours"},
      {nom:"Divers",typologie:"INFLUENCE & PARTENARIAT",poste:"Partenariat événementiel"},
      {nom:"Divers",typologie:"DIVERS MARKETING",poste:"Goodies / Objets pub"},
      {nom:"Divers",typologie:"DIVERS MARKETING",poste:"Événement en magasin"},
      {nom:"Divers",typologie:"DIVERS MARKETING",poste:"Jeu / Animation"},
      {nom:"Divers",typologie:"DIVERS",poste:"Autres"},
    ],
    typologies:["PRINT & SIGNALÉTIQUE","DIGITAL","WEB","SERVICE","AUDIOVISUEL & MÉDIA","INFLUENCE & PARTENARIAT","DIVERS MARKETING","DIVERS"]
  },
  fabrique:{
    label:"Fabrique de Style", short:"FdS", color:"#374151", colorLight:"#f9fafb",
    prestataires:[
      {nom:"ICPR",typologie:"PRINT & SIGNALÉTIQUE",poste:"Catalogue imprimé & distribution"},
      {nom:"SRA ou autre",typologie:"PRINT & SIGNALÉTIQUE",poste:"Affichage 4x3"},
      {nom:"LOGO",typologie:"PRINT & SIGNALÉTIQUE",poste:"Visuel, panneau ou autre"},
      {nom:"Design System / Audrey Chaland",typologie:"PRINT & SIGNALÉTIQUE",poste:"Création graphique"},
      {nom:"LOVNI / Frédéric",typologie:"DIGITAL",poste:"Graphiste digital"},
      {nom:"Hedgy expertise",typologie:"DIGITAL",poste:"Facebook & INSTA : SPONSO TOTAL"},
      {nom:"Hedgy expertise",typologie:"DIGITAL",poste:"Google Ads"},
      {nom:"Hedgy expertise",typologie:"DIGITAL",poste:"Gestion sponso : coût du service"},
      {nom:"Hedgy expertise",typologie:"DIGITAL",poste:"Meta Ads"},
      {nom:"Lapub.re",typologie:"DIGITAL",poste:"Lapub.re"},
      {nom:"Dealrun",typologie:"DIGITAL",poste:"Dealrun"},
      {nom:"Dealprint",typologie:"PRINT & SIGNALÉTIQUE",poste:"Impression / Dealprint"},
      {nom:"Radio Régie",typologie:"AUDIOVISUEL & MÉDIA",poste:"Radio"},
      {nom:"Radio Régie",typologie:"AUDIOVISUEL & MÉDIA",poste:"Audio Ads TF1+"},
      {nom:"Morani",typologie:"AUDIOVISUEL & MÉDIA",poste:"Vidéo mensuel"},
      {nom:"Divers",typologie:"INFLUENCE & PARTENARIAT",poste:"Collaboration influenceur / jeux concours"},
      {nom:"Divers",typologie:"INFLUENCE & PARTENARIAT",poste:"Partenariat événementiel"},
      {nom:"Divers",typologie:"DIVERS MARKETING",poste:"Goodies / Objets pub"},
      {nom:"Divers",typologie:"DIVERS MARKETING",poste:"Événement en magasin"},
      {nom:"Divers",typologie:"DIVERS MARKETING",poste:"Jeu / Animation"},
      {nom:"Divers",typologie:"DIVERS",poste:"Autres"},
    ],
    typologies:["PRINT & SIGNALÉTIQUE","DIGITAL","AUDIOVISUEL & MÉDIA","INFLUENCE & PARTENARIAT","DIVERS MARKETING","DIVERS"]
  }
};

const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const MONTHS_FULL = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const FISCAL_MONTHS_IDX = [9,10,11,0,1,2,3,4,5,6,7,8];
const fmt = v => new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(v||0);
const fmtFull = v => new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format(v||0);
const fmtDate = d => { if(!d) return ""; const [y,m,j]=d.split("-"); return `${j}/${m}/${(y||"").slice(2)}`; };
const mIdx = d => d ? new Date(d).getMonth() : -1;
const yr = d => d ? new Date(d).getFullYear() : 0;
const toB64 = f => new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(f);});
const emptyForm = (storeKey="conforama") => ({fournisseur:"",date:"",numero_facture:"",ht:0,tva:0,ttc:0,magasin:storeKey,typologie:"",poste:"",description:""});
const EMPTY = emptyForm(); // compatibilité — sera remplacé par emptyForm(store) au runtime
const NOW = new Date();
const CY = NOW.getFullYear();
const CM = NOW.getMonth();

// ─── FIELDS (hors App pour éviter re-focus) ───────────────────────────────────
function Fields({f, setF}) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      {[
        {l:"Fournisseur",k:"fournisseur",t:"text"},
        {l:"N° Facture",k:"numero_facture",t:"text"},
        {l:"Date",k:"date",t:"date"},
        {l:"Magasin",k:"magasin",t:"sel",opts:Object.entries(STORES).map(([k,s])=>({v:k,l:s.label}))},
        {l:"HT (€)",k:"ht",t:"number"},
        {l:"TVA (€)",k:"tva",t:"number"},
        {l:"TTC (€)",k:"ttc",t:"number"},
        {l:"Typologie",k:"typologie",t:"sel",opts:STORES[f.magasin||"conforama"].typologies.map(t=>({v:t,l:t}))},
      ].map(field=>(
        <div key={field.k}>
          <label style={{display:"block",fontSize:10,color:"#9ca3af",fontWeight:600,marginBottom:4,textTransform:"uppercase",letterSpacing:.6}}>{field.l}</label>
          {field.t==="sel"
            ?<select className="inp" value={f[field.k]||""} onChange={e=>setF(p=>({...p,[field.k]:e.target.value}))}>
               <option value="">—</option>{field.opts?.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
             </select>
            :<input className="inp" type={field.t} value={f[field.k]||""} onChange={e=>setF(p=>({...p,[field.k]:field.t==="number"?parseFloat(e.target.value)||0:e.target.value}))}/>
          }
        </div>
      ))}
      <div style={{gridColumn:"1/-1"}}>
        <label style={{display:"block",fontSize:10,color:"#9ca3af",fontWeight:600,marginBottom:4,textTransform:"uppercase",letterSpacing:.6}}>Poste de dépense</label>
        <input className="inp" type="text" value={f.poste||""} onChange={e=>setF(p=>({...p,poste:e.target.value}))}/>
      </div>
      <div style={{gridColumn:"1/-1"}}>
        <label style={{display:"block",fontSize:10,color:"#9ca3af",fontWeight:600,marginBottom:4,textTransform:"uppercase",letterSpacing:.6}}>Description</label>
        <input className="inp" type="text" value={f.description||""} onChange={e=>setF(p=>({...p,description:e.target.value}))}/>
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [invoices,setInvoices] = useState([]);
  const [budgets,setBudgets] = useState({});
  const [loading,setLoading] = useState(false);
  const [syncing,setSyncing] = useState(false);
  const [error,setError] = useState("");
  const [store,setStore] = useState("conforama");
  const [tab,setTab] = useState("dashboard");
  const [dragOver,setDragOver] = useState(false);
  const [preview,setPreview] = useState(null);
  const [manual,setManual] = useState(false);
  const [form,setForm] = useState(EMPTY);
  const [editId,setEditId] = useState(null);
  const [editForm,setEditForm] = useState(null);
  const [filterM,setFilterM] = useState("all");
  const [filterY,setFilterY] = useState("current"); // "current" | "prev"
  const [filterT,setFilterT] = useState("all");
  const [filterP,setFilterP] = useState("all");
  const [search,setSearch] = useState("");
  const [sortBy,setSortBy] = useState("ajout");
  const [sortDir,setSortDir] = useState("desc");
  const [budgetStore,setBudgetStore] = useState("conforama");
  const [budgetTypo,setBudgetTypo] = useState("");
  const [budgetYear,setBudgetYear] = useState(CY);
  const [dupWarning,setDupWarning] = useState(null);
  const [recurring,setRecurring] = useState(false);
  const [recurringForm,setRecurringForm] = useState({fournisseur:"",magasin:"conforama",typologie:"",poste:"",ttc:0,ht:0,tva:0,year:CY,months:[]});
  // helper : ouvre la saisie récurrente avec le magasin actif
  function openRecurring(){setRecurring(true);setRecurringForm(p=>({...p,magasin:store,year:CY}));}
  const [swipeId,setSwipeId] = useState(null);
  const [detailId,setDetailId] = useState(null);
  const [confirmDelId,setConfirmDelId] = useState(null);
  const fileRef = useRef();
  const cameraRef = useRef();
  const S = STORES[store];
  const c = S.color;

  useEffect(()=>{ loadAll(); },[]);

  // ── Period helpers ────────────────────────────────────────────────────────
  // Fabrique : exercice fiscal Oct→Sep. Si on est en oct/nov/déc (CM>=9),
  // l'exercice en cours a démarré cette année ; sinon l'année précédente.
  const FY = CM>=9 ? CY : CY-1; // année de début de l'exercice fiscal en cours
  function inCurrentPeriod(dateStr,storeKey) {
    if(!dateStr) return false;
    const d=new Date(dateStr);const y=d.getFullYear();const m=d.getMonth();
    if(storeKey==="fabrique") return (y===FY&&m>=9)||(y===FY+1&&m<=8);
    return y===CY;
  }
  function inPrevPeriod(dateStr,storeKey) {
    if(!dateStr) return false;
    const d=new Date(dateStr);const y=d.getFullYear();const m=d.getMonth();
    if(storeKey==="fabrique") return (y===FY-1&&m>=9)||(y===FY&&m<=8);
    return y===CY-1;
  }
  function inPrev2Period(dateStr,storeKey) {
    if(!dateStr) return false;
    const d=new Date(dateStr);const y=d.getFullYear();const m=d.getMonth();
    if(storeKey==="fabrique") return (y===FY-2&&m>=9)||(y===FY-1&&m<=8);
    return y===CY-2;
  }

  // ── API ───────────────────────────────────────────────────────────────────
  async function loadAll() {
    setSyncing(true);
    try {
      const [ri,rb]=await Promise.all([fetch("/api/invoices"),fetch("/api/budgets")]);
      if(ri.ok){const d=await ri.json();setInvoices(Array.isArray(d)?d:[]);}
      if(rb.ok){const d=await rb.json();setBudgets(d||{});}
    } catch(e){}
    finally{setSyncing(false);}
  }

  function checkDuplicate(inv) {
    try{return invoices.find(i=>(i.fournisseur||"").toLowerCase()===(inv.fournisseur||"").toLowerCase()&&Math.abs((i.ttc||0)-(inv.ttc||0))<0.01&&mIdx(i.date)===mIdx(inv.date)&&yr(i.date)===yr(inv.date));}
    catch(e){return null;}
  }

  async function analyzeFile(f) {
    setLoading(true);setError("");setPreview(null);setManual(false);setRecurring(false);setTab("facture");
    try {
      const isImg=f.type.startsWith("image/"),isPdf=f.type==="application/pdf";
      if(!isImg&&!isPdf) throw new Error("JPG, PNG ou PDF uniquement.");
      const b64=await toB64(f);
      const allP=[...new Set([...STORES.conforama.prestataires.map(p=>p.nom),...STORES.fabrique.prestataires.map(p=>p.nom)])];
      const allT=[...new Set([...STORES.conforama.typologies,...STORES.fabrique.typologies])];
      const prompt=`Assistant comptable HOLDRIS Réunion. Analyse la facture. Retourne UNIQUEMENT un JSON valide sans markdown.
Prestataires: ${allP.join(",")}
Typologies: ${allT.join(",")}
Format: {"fournisseur":"","date":"YYYY-MM-DD","numero_facture":"","ht":0,"tva":0,"ttc":0,"magasin":"conforama","typologie":"","poste":"","description":""}`;
      const body={model:"claude-sonnet-4-5",max_tokens:800,messages:[{role:"user",content:[isPdf?{type:"document",source:{type:"base64",media_type:f.type,data:b64}}:{type:"image",source:{type:"base64",media_type:f.type,data:b64}},{type:"text",text:prompt}]}]};
      const r=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const d=await r.json();
      if(d.error) throw new Error(d.error.message||d.error);
      const txt=d.content?.map(c=>c.text||"").join("").trim().replace(/```json|```/g,"").trim();
      const jsonMatch = txt.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("L'IA n'a pas retourné un format valide. Réessayez.");
      let parsed;
      try { parsed = JSON.parse(jsonMatch[0]); }
      catch(pe) { throw new Error("Erreur de lecture de la facture. Réessayez."); }
      parsed = {fournisseur:"",date:"",numero_facture:"",ht:0,tva:0,ttc:0,magasin:store,typologie:"",poste:"",description:"",...parsed,id:Date.now(),fileName:f.name};
      // Sanitize : forcer les types pour éviter les crashes de rendu
      parsed.fournisseur=String(parsed.fournisseur||"");
      parsed.date=String(parsed.date||"");
      parsed.numero_facture=String(parsed.numero_facture||"");
      parsed.typologie=String(parsed.typologie||"");
      parsed.poste=String(parsed.poste||"");
      parsed.description=String(parsed.description||"");
      parsed.magasin=String(parsed.magasin||store);
      // Valider magasin : si l'IA retourne une valeur inconnue (ex "Conforama Réunion"), forcer au store actif
      if(!STORES[parsed.magasin]) parsed.magasin=store;
      parsed.ht=parseFloat(parsed.ht)||0;
      parsed.tva=parseFloat(parsed.tva)||0;
      parsed.ttc=parseFloat(parsed.ttc)||0;
      setDupWarning(checkDuplicate(parsed)||null);
      setPreview(parsed);
    } catch(e){setError("Erreur : "+e.message);}
    finally{setLoading(false);}
  }

  async function saveInv(inv) {
    setSyncing(true);
    try{await fetch("/api/invoices",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({invoice:inv})});await loadAll();}
    catch(e){setInvoices(p=>[inv,...p]);}
    finally{setSyncing(false);}
    setPreview(null);setManual(false);setForm(emptyForm(store));setDupWarning(null);setRecurring(false);setTab("journal");
  }

  async function updateInv(inv) {
    setSyncing(true);
    try{await fetch("/api/invoices",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({invoice:inv})});await loadAll();}
    catch(e){setInvoices(p=>p.map(i=>i.id===inv.id?inv:i));}
    finally{setSyncing(false);}
    setEditId(null);setEditForm(null);
  }

  async function delInv(id) {
    setSyncing(true);setConfirmDelId(null);
    try{await fetch("/api/invoices",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});await loadAll();}
    catch(e){setInvoices(p=>p.filter(i=>i.id!==id));}
    finally{setSyncing(false);}
  }

  async function saveBudgets(b) {
    setBudgets(b);
    try{await fetch("/api/budgets",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({budgets:b})});}
    catch(e){}
  }

  function setBudgetVal(storeKey,typo,month,val) {
    const b=JSON.parse(JSON.stringify(budgets));
    if(!b[storeKey])b[storeKey]={};
    if(!b[storeKey][typo])b[storeKey][typo]={};
    b[storeKey][typo][month]=parseFloat(val)||0;
    saveBudgets(b);
  }

  async function saveRecurring() {
    if(!recurringForm.months.length) return;
    setSyncing(true);
    const entries=recurringForm.months.map(mi=>({
      fournisseur:recurringForm.fournisseur,magasin:recurringForm.magasin,
      typologie:recurringForm.typologie,poste:recurringForm.poste,
      ttc:recurringForm.ttc,ht:recurringForm.ht,tva:recurringForm.tva,
      description:recurringForm.poste,id:Date.now()+mi*7,
      date:`${recurringForm.year}-${String(mi+1).padStart(2,"0")}-01`,
      manual:true,fileName:"Saisie récurrente",numero_facture:""
    }));
    for(const inv of entries){
      try{await fetch("/api/invoices",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({invoice:inv})});}catch(e){}
    }
    await loadAll();setSyncing(false);setRecurring(false);
    setRecurringForm({fournisseur:"",magasin:store,typologie:"",poste:"",ttc:0,ht:0,tva:0,year:CY,months:[]});
    setTab("journal");
  }

  function exportPDF() {
    const storeName=S.label;
    const periodLabel=filterM==="all"
      ?(store==="fabrique"?`Oct ${FY} – Sep ${FY+1}`:`Année ${CY}`)
      :`${MONTHS[parseInt(filterM)]} ${store==="fabrique"&&[9,10,11].includes(parseInt(filterM))?FY:FY+1||CY}`;
    const exportDate=NOW.toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"});
    const fiTotal=fi.reduce((s,i)=>s+(i.ttc||0),0);
    const fiHT=fi.reduce((s,i)=>s+(i.ht||0),0);
    const fiPrevBase=filterY==="prev"?[]:siPrev; // pas de N-1 si on affiche déjà le N-1
    const fiPrevTotal=filterM==="all"
      ?fiPrevBase.reduce((s,i)=>s+(i.ttc||0),0)
      :fiPrevBase.filter(i=>mIdx(i.date)===parseInt(filterM)).reduce((s,i)=>s+(i.ttc||0),0);
    const fiEvo=fiPrevTotal>0?Math.round((fiTotal-fiPrevTotal)/fiPrevTotal*100):null;

    // Récap par typologie pour les factures filtrées
    const typoRows=S.typologies.map(t=>{
      const tot=fi.filter(i=>i.typologie===t).reduce((s,i)=>s+(i.ttc||0),0);
      const prevT=(filterM==="all"?fiPrevBase:fiPrevBase.filter(i=>mIdx(i.date)===parseInt(filterM)))
        .filter(i=>i.typologie===t).reduce((s,i)=>s+(i.ttc||0),0);
      return{t,tot,prevT};
    }).filter(x=>x.tot>0);

    // Build HTML for print
    const rows=fi.map(i=>`<tr>
      <td>${fmtDate(i.date)}</td>
      <td>${i.fournisseur||""}</td>
      <td>${i.poste||""}</td>
      <td>${i.typologie||""}</td>
      <td style="text-align:right">${(i.ht||0).toLocaleString("fr-FR",{minimumFractionDigits:2})} €</td>
      <td style="text-align:right">${(i.ttc||0).toLocaleString("fr-FR",{minimumFractionDigits:2})} €</td>
    </tr>`).join("");

    const typoRowsHTML=typoRows.map(x=>`<tr>
      <td>${x.t}</td>
      <td style="text-align:right">${x.tot.toLocaleString("fr-FR",{minimumFractionDigits:2})} €</td>
      <td style="text-align:right">${x.prevT>0?x.prevT.toLocaleString("fr-FR",{minimumFractionDigits:2})+" €":"–"}</td>
      <td style="text-align:right;color:${x.prevT>0&&x.tot>x.prevT?"#dc2626":x.prevT>0&&x.tot<x.prevT?"#16a34a":"#6b7280"}">${x.prevT>0?((x.tot-x.prevT)/x.prevT*100>0?"+":"")+Math.round((x.tot-x.prevT)/x.prevT*100)+"%":"–"}</td>
    </tr>`).join("");

    const color=S.color;
    const html=`<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Rapport dépenses – ${storeName}</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:11px;color:#111;margin:20px 30px}
      h1{font-size:18px;color:${color};margin:0}
      h2{font-size:13px;color:${color};margin:18px 0 6px;border-bottom:1px solid ${color};padding-bottom:3px}
      .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;border-bottom:2px solid ${color};padding-bottom:10px}
      .kpi{display:flex;gap:24px;margin-bottom:18px;flex-wrap:wrap}
      .kpi-box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:10px 16px;min-width:120px}
      .kpi-label{font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px}
      .kpi-val{font-size:16px;font-weight:700;color:#111;margin-top:2px}
      .kpi-evo{font-size:10px;margin-top:2px}
      table{width:100%;border-collapse:collapse;margin-bottom:12px}
      th{background:${color};color:white;padding:5px 8px;text-align:left;font-size:10px}
      td{padding:4px 8px;border-bottom:1px solid #f3f4f6;vertical-align:top}
      tr:nth-child(even) td{background:#f9fafb}
      .footer{margin-top:24px;font-size:9px;color:#9ca3af;text-align:center;border-top:1px solid #e5e7eb;padding-top:8px}
      @media print{body{margin:10px 15px}button{display:none}}
    </style></head><body>
    <div class="header">
      <div>
        <div style="font-size:11px;color:#6b7280;font-weight:600;letter-spacing:1px;text-transform:uppercase">HOLDRIS</div>
        <h1>${storeName}</h1>
        <div style="font-size:12px;color:#6b7280;margin-top:2px">Rapport de dépenses — ${periodLabel}</div>
        ${filterT!=="all"?`<div style="font-size:10px;color:#9ca3af">Filtre : ${filterT}</div>`:""}
        ${filterP!=="all"?`<div style="font-size:10px;color:#9ca3af">Fournisseur : ${filterP}</div>`:""}
      </div>
      <div style="text-align:right;font-size:10px;color:#9ca3af">
        Exporté le ${exportDate}
      </div>
    </div>

    <div class="kpi">
      <div class="kpi-box">
        <div class="kpi-label">Total TTC</div>
        <div class="kpi-val">${fiTotal.toLocaleString("fr-FR",{minimumFractionDigits:2})} €</div>
        ${fiEvo!==null?`<div class="kpi-evo" style="color:${fiEvo>0?"#dc2626":"#16a34a"}">${fiEvo>0?"+":""}${fiEvo}% vs N-1</div>`:""}
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Total HT</div>
        <div class="kpi-val">${fiHT.toLocaleString("fr-FR",{minimumFractionDigits:2})} €</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Nb factures</div>
        <div class="kpi-val">${fi.length}</div>
      </div>
      ${fiPrevTotal>0?`<div class="kpi-box"><div class="kpi-label">N-1 TTC</div><div class="kpi-val">${fiPrevTotal.toLocaleString("fr-FR",{minimumFractionDigits:2})} €</div></div>`:""}
    </div>

    <h2>Récapitulatif par Typologie</h2>
    <table>
      <thead><tr><th>Typologie</th><th>TTC (N)</th><th>TTC (N-1)</th><th>Évolution</th></tr></thead>
      <tbody>${typoRowsHTML}</tbody>
      <tfoot><tr style="font-weight:700"><td>TOTAL</td><td style="text-align:right">${fiTotal.toLocaleString("fr-FR",{minimumFractionDigits:2})} €</td><td style="text-align:right">${fiPrevTotal>0?fiPrevTotal.toLocaleString("fr-FR",{minimumFractionDigits:2})+" €":"–"}</td><td></td></tr></tfoot>
    </table>

    <h2>Détail des Factures (${fi.length})</h2>
    <table>
      <thead><tr><th>Date</th><th>Fournisseur</th><th>Poste</th><th>Typologie</th><th>HT</th><th>TTC</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr style="font-weight:700"><td colspan="4">TOTAL</td><td style="text-align:right">${fiHT.toLocaleString("fr-FR",{minimumFractionDigits:2})} €</td><td style="text-align:right">${fiTotal.toLocaleString("fr-FR",{minimumFractionDigits:2})} €</td></tr></tfoot>
    </table>

    <div class="footer">HOLDRIS — ${storeName} — ${periodLabel} — Généré le ${exportDate}</div>
    </body></html>`;

    const win=window.open("","_blank");
    win.document.write(html);
    win.document.close();
    setTimeout(()=>win.print(),400);
  }

  function exportExcel() {
    const wb=XLSX.utils.book_new();
    Object.entries(STORES).forEach(([key,s])=>{
      const data=invoices.filter(i=>i.magasin===key&&inCurrentPeriod(i.date,key));
      XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(data.map(i=>({"Date":i.date||"","Fournisseur":i.fournisseur||"","Typologie":i.typologie||"","Poste":i.poste||"","HT":i.ht||0,"TVA":i.tva||0,"TTC":i.ttc||0}))),`${s.short} - Journal`);
      const sumRows=s.typologies.map(t=>{const row={"Typologie":t};MONTHS.forEach((m,mi)=>{row[m]=data.filter(i=>i.typologie===t&&mIdx(i.date)===mi).reduce((s,i)=>s+(i.ttc||0),0);});row["TOTAL"]=data.filter(i=>i.typologie===t).reduce((s,i)=>s+(i.ttc||0),0);return row;});
      XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(sumRows),`${s.short} - Mensuel`);
    });
    XLSX.writeFile(wb,`HOLDRIS_${NOW.toISOString().slice(0,10)}.xlsx`);
  }

  // ── Computed ──────────────────────────────────────────────────────────────
  const siCurrent=invoices.filter(i=>i.magasin===store&&inCurrentPeriod(i.date,store));
  const siPrev=invoices.filter(i=>i.magasin===store&&inPrevPeriod(i.date,store));
  // si = exercice affiché dans le journal (current ou prev selon filtre)
  const si=filterY==="prev"?siPrev:siCurrent;
  const allPrest=[...new Set(siCurrent.map(i=>i.fournisseur).filter(Boolean))];

  // Journal filters + search + sort
  const fi=si.filter(i=>{
    const mOk=filterM==="all"||mIdx(i.date)===parseInt(filterM);
    const tOk=filterT==="all"||i.typologie===filterT;
    const pOk=filterP==="all"||i.fournisseur===filterP;
    const sOk=!search||[i.fournisseur,i.poste,i.description,i.numero_facture].some(v=>v?.toLowerCase().includes(search.toLowerCase()));
    return mOk&&tOk&&pOk&&sOk;
  }).sort((a,b)=>{
    let va,vb;
    if(sortBy==="ajout"){va=a.id||0;vb=b.id||0;}
    else if(sortBy==="date"){va=a.date||"";vb=b.date||"";}
    else if(sortBy==="ttc"){va=a.ttc||0;vb=b.ttc||0;}
    else{va=a.fournisseur||"";vb=b.fournisseur||"";}
    return sortDir==="desc"?(va>vb?-1:1):(va<vb?-1:1);
  });

  const totalTTC=si.reduce((s,i)=>s+(i.ttc||0),0);
  const totalHT=si.reduce((s,i)=>s+(i.ht||0),0);
  const cmTotal=si.filter(i=>mIdx(i.date)===CM).reduce((s,i)=>s+(i.ttc||0),0);
  const pmTotal=si.filter(i=>mIdx(i.date)===(CM-1+12)%12).reduce((s,i)=>s+(i.ttc||0),0);
  const evo=pmTotal>0?Math.round((cmTotal-pmTotal)/pmTotal*100):null;
  // S1 : Jan-Jun pour Conforama, Oct-Mar (mois 9,10,11,0,1,2) pour Fabrique
  const s1Months=store==="fabrique"?[9,10,11,0,1,2]:[0,1,2,3,4,5];
  const s1Total=si.filter(i=>s1Months.includes(mIdx(i.date))).reduce((s,i)=>s+(i.ttc||0),0);
  const s1PrevTotal=siPrev.filter(i=>s1Months.includes(mIdx(i.date))).reduce((s,i)=>s+(i.ttc||0),0);
  const s1Evo=s1PrevTotal>0?Math.round((s1Total-s1PrevTotal)/s1PrevTotal*100):null;
  const byTypo=S.typologies.map(t=>({t,total:si.filter(i=>i.typologie===t).reduce((s,i)=>s+(i.ttc||0),0),prev:siPrev.filter(i=>i.typologie===t).reduce((s,i)=>s+(i.ttc||0),0)})).filter(x=>x.total>0).sort((a,b)=>b.total-a.total);
  const monthOrder=store==="fabrique"?FISCAL_MONTHS_IDX:MONTHS.map((_,i)=>i);
  const byMonth=monthOrder.map(mi=>({m:MONTHS[mi],mi,total:si.filter(i=>mIdx(i.date)===mi).reduce((s,i)=>s+(i.ttc||0),0),prev:siPrev.filter(i=>mIdx(i.date)===mi).reduce((s,i)=>s+(i.ttc||0),0)}));
  const maxMonth=Math.max(...byMonth.map(x=>Math.max(x.total,x.prev)),1);
  const byPrest={};si.forEach(i=>{const k=(i.fournisseur||"").trim();byPrest[k]=(byPrest[k]||0)+(i.ttc||0);});
  const topPrest=Object.entries(byPrest).filter(([k])=>k).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const storeBudgets=budgets[store]||{};

  // Budget progress for dashboard
  const budgetProgress=S.typologies.map(t=>{
    const budgetTotal=MONTHS.reduce((s,_,mi)=>s+((storeBudgets[t]||{})[`${CY}-${mi}`]||0),0);
    const realTotal=si.filter(i=>i.typologie===t).reduce((s,i)=>s+(i.ttc||0),0);
    return{t,budgetTotal,realTotal,pct:budgetTotal>0?Math.min(realTotal/budgetTotal*100,100):0,over:budgetTotal>0&&realTotal>budgetTotal};
  }).filter(x=>x.budgetTotal>0);

  // ── Donut ─────────────────────────────────────────────────────────────────
  const Donut=()=>{
    if(!byTypo.length) return <div style={{color:"#d1d5db",textAlign:"center",padding:"24px 0",fontSize:13}}>Aucune dépense</div>;
    const colors=[c,`${c}cc`,`${c}99`,`${c}77`,`${c}55`,`${c}33`];
    let angle=0;
    const slices=byTypo.map(({t,total},i)=>{
      const pct=total/totalTTC,a1=angle,a2=angle+pct*2*Math.PI;
      const x1=60+50*Math.sin(a1),y1=60-50*Math.cos(a1),x2=60+50*Math.sin(a2),y2=60-50*Math.cos(a2);
      angle=a2;
      return <path key={t} d={`M60,60 L${x1},${y1} A50,50 0 ${pct>0.5?1:0},1 ${x2},${y2} Z`} fill={colors[i%colors.length]} stroke="white" strokeWidth="1.5"/>;
    });
    return(
      <div style={{display:"flex",gap:16,alignItems:"center"}}>
        <svg width="120" height="120" viewBox="0 0 120 120" style={{flexShrink:0}}>
          {slices}
          <circle cx="60" cy="60" r="30" fill="white"/>
          <text x="60" y="56" textAnchor="middle" fill="#111827" fontSize="9" fontWeight="800" fontFamily="Inter,sans-serif">{fmt(totalTTC)}</text>
          <text x="60" y="67" textAnchor="middle" fill="#9ca3af" fontSize="7" fontFamily="Inter,sans-serif">TOTAL TTC</text>
        </svg>
        <div style={{flex:1,minWidth:0}}>
          {byTypo.map(({t,total},i)=>(
            <div key={t} onClick={()=>{setFilterT(t);setFilterM("all");setFilterP("all");setSearch("");setTab("journal");}}
              style={{display:"flex",alignItems:"center",gap:6,marginBottom:5,cursor:"pointer",borderRadius:4,padding:"2px 4px"}}
              onMouseEnter={e=>e.currentTarget.style.background="#f3f4f6"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{width:8,height:8,borderRadius:2,background:colors[i%colors.length],flexShrink:0}}/>
              <div style={{flex:1,fontSize:11,color:"#374151",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t}</div>
              <div style={{fontSize:11,color:"#6b7280",fontWeight:600,flexShrink:0}}>{Math.round(total/totalTTC*100)}%</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── RecapCard ─────────────────────────────────────────────────────────────
  const RecapCard=({storeKey})=>{
    const s=STORES[storeKey];
    const data=invoices.filter(i=>i.magasin===storeKey&&inCurrentPeriod(i.date,storeKey));
    const dataN1=invoices.filter(i=>i.magasin===storeKey&&inPrevPeriod(i.date,storeKey));
    const dataN2=invoices.filter(i=>i.magasin===storeKey&&inPrev2Period(i.date,storeKey));
    const total=data.reduce((s,i)=>s+(i.ttc||0),0);
    const totalN1=dataN1.reduce((s,i)=>s+(i.ttc||0),0);
    const totalN2=dataN2.reduce((s,i)=>s+(i.ttc||0),0);
    const evoN1=totalN1>0?Math.round((total-totalN1)/totalN1*100):null;
    const evoN2=totalN2>0?Math.round((total-totalN2)/totalN2*100):null;
    const s1M=storeKey==="fabrique"?[9,10,11,0,1,2]:[0,1,2,3,4,5];
    const s1=data.filter(i=>s1M.includes(mIdx(i.date))).reduce((s,i)=>s+(i.ttc||0),0);
    const s1N1=dataN1.filter(i=>s1M.includes(mIdx(i.date))).reduce((s,i)=>s+(i.ttc||0),0);
    const s1EvoN1=s1N1>0?Math.round((s1-s1N1)/s1N1*100):null;
    const periodN=storeKey==="fabrique"?`Oct ${FY}–Sep ${FY+1}`:`${CY}`;
    const periodN1=storeKey==="fabrique"?`Oct ${FY-1}–Sep ${FY}`:`${CY-1}`;
    const periodN2=storeKey==="fabrique"?`Oct ${FY-2}–Sep ${FY-1}`:`${CY-2}`;
    const evoColor=e=>e>0?"#dc2626":"#16a34a";
    return(
      <div className="card" style={{borderTop:`3px solid ${s.color}`}}>
        <div style={{fontWeight:700,fontSize:13,color:s.color,marginBottom:12}}>{s.label}</div>
        {/* KPIs ligne */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
          <div style={{background:"#f9fafb",borderRadius:8,padding:"10px 12px"}}>
            <div style={{fontSize:10,color:"#9ca3af",fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>Total {periodN}</div>
            <div style={{fontSize:18,fontWeight:800,color:"#111827",fontFamily:"JetBrains Mono,monospace",marginTop:2}}>{fmt(total)}</div>
            {evoN1!==null&&<div style={{fontSize:11,fontWeight:700,color:evoColor(evoN1),marginTop:2}}>{evoN1>0?"+":""}{evoN1}% vs N-1</div>}
            {evoN2!==null&&<div style={{fontSize:10,color:"#9ca3af",marginTop:1}}>{evoN2>0?"+":""}{evoN2}% vs N-2</div>}
          </div>
          <div style={{background:"#f9fafb",borderRadius:8,padding:"10px 12px"}}>
            <div style={{fontSize:10,color:"#9ca3af",fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{storeKey==="fabrique"?"S1 Oct–Mar":"S1 Jan–Jun"}</div>
            <div style={{fontSize:18,fontWeight:800,color:s.color,fontFamily:"JetBrains Mono,monospace",marginTop:2}}>{fmt(s1)}</div>
            {s1EvoN1!==null&&<div style={{fontSize:11,fontWeight:700,color:evoColor(s1EvoN1),marginTop:2}}>{s1EvoN1>0?"+":""}{s1EvoN1}% vs N-1</div>}
          </div>
        </div>
        {/* Comparatif N / N-1 / N-2 */}
        {(totalN1>0||totalN2>0)&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
            {totalN1>0&&<div style={{background:"#f3f4f6",borderRadius:6,padding:"6px 10px"}}>
              <div style={{fontSize:9,color:"#9ca3af",fontWeight:600,textTransform:"uppercase"}}>N-1 ({periodN1})</div>
              <div style={{fontSize:13,fontWeight:700,fontFamily:"JetBrains Mono,monospace",color:"#6b7280"}}>{fmt(totalN1)}</div>
            </div>}
            {totalN2>0&&<div style={{background:"#f3f4f6",borderRadius:6,padding:"6px 10px"}}>
              <div style={{fontSize:9,color:"#9ca3af",fontWeight:600,textTransform:"uppercase"}}>N-2 ({periodN2})</div>
              <div style={{fontSize:13,fontWeight:700,fontFamily:"JetBrains Mono,monospace",color:"#9ca3af"}}>{fmt(totalN2)}</div>
            </div>}
          </div>
        )}
        {/* Détail par typologie N / N-1 / N-2 */}
        <div style={{fontSize:10,color:"#9ca3af",fontWeight:600,textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>Par typologie</div>
        {/* En-tête colonnes */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 70px 70px 70px",gap:4,padding:"4px 0",borderBottom:"1px solid #e5e7eb",marginBottom:2}}>
          <span style={{fontSize:9,color:"#9ca3af",fontWeight:600,textTransform:"uppercase"}}>Typologie</span>
          {totalN2>0&&<span style={{fontSize:9,color:"#9ca3af",fontWeight:600,textAlign:"right"}}>N-2</span>}
          {totalN1>0&&<span style={{fontSize:9,color:"#9ca3af",fontWeight:600,textAlign:"right",gridColumn:totalN2>0?undefined:"2"}}>N-1</span>}
          <span style={{fontSize:9,color:"#9ca3af",fontWeight:600,textAlign:"right",gridColumn:(!totalN1&&!totalN2)?"2":undefined}}>N</span>
        </div>
        {s.typologies.map(t=>{
          const v=data.filter(i=>i.typologie===t).reduce((a,i)=>a+(i.ttc||0),0);
          const vN1=dataN1.filter(i=>i.typologie===t).reduce((a,i)=>a+(i.ttc||0),0);
          const vN2=dataN2.filter(i=>i.typologie===t).reduce((a,i)=>a+(i.ttc||0),0);
          if(!v&&!vN1&&!vN2) return null;
          const evo=vN1>0?Math.round((v-vN1)/vN1*100):null;
          return(
            <div key={t} style={{display:"grid",gridTemplateColumns:"1fr 70px 70px 70px",gap:4,padding:"6px 0",borderBottom:"1px solid #f3f4f6",alignItems:"center"}}>
              <span style={{fontSize:11,color:"#374151",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t}</span>
              {totalN2>0&&<span style={{fontSize:10,fontFamily:"JetBrains Mono,monospace",color:"#9ca3af",textAlign:"right"}}>{vN2>0?fmt(vN2):"–"}</span>}
              {totalN1>0&&<span style={{fontSize:10,fontFamily:"JetBrains Mono,monospace",color:"#6b7280",textAlign:"right",gridColumn:totalN2>0?undefined:"2"}}>{vN1>0?fmt(vN1):"–"}</span>}
              <div style={{textAlign:"right",gridColumn:(!totalN1&&!totalN2)?"2":undefined}}>
                <div style={{fontSize:11,fontWeight:700,fontFamily:"JetBrains Mono,monospace",color:"#111827"}}>{fmt(v)}</div>
                {evo!==null&&<div style={{fontSize:9,fontWeight:700,color:evoColor(evo)}}>{evo>0?"+":""}{evo}%</div>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  function resetFilters(){setFilterM("all");setFilterY("current");setFilterT("all");setFilterP("all");setSearch("");}
  const hasFilters=filterM!=="all"||filterY!=="current"||filterT!=="all"||filterP!=="all"||search;

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return(
    <div style={{minHeight:"100vh",background:"#f9fafb",color:"#111827",fontFamily:"'Inter',system-ui,sans-serif",paddingBottom:80}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#e5e7eb;border-radius:2px}
        .inp{background:white;border:1.5px solid #e5e7eb;color:#111827;border-radius:10px;padding:10px 13px;font-family:'Inter',sans-serif;font-size:14px;width:100%;outline:none;transition:border-color .15s;-webkit-appearance:none}
        .inp:focus{border-color:var(--c);box-shadow:0 0 0 3px var(--cl)}
        select.inp{cursor:pointer}
        .card{background:white;border:1px solid #e5e7eb;border-radius:16px;padding:18px;box-shadow:0 1px 4px rgba(0,0,0,.04)}
        .btn{border:none;cursor:pointer;font-family:'Inter',sans-serif;border-radius:10px;font-size:14px;font-weight:600;padding:10px 20px;transition:all .15s;display:inline-flex;align-items:center;gap:6px}
        .btn-primary{background:var(--c);color:white}
        .btn-primary:hover{filter:brightness(1.1)}
        .btn-ghost{background:#f3f4f6;color:#374151}
        .btn-ghost:hover{background:#e5e7eb}
        .btn-outline{background:white;border:1.5px solid var(--c);color:var(--c)}
        .bottom-nav{position:fixed;bottom:0;left:0;right:0;background:white;border-top:1px solid #e5e7eb;display:flex;z-index:100;box-shadow:0 -4px 12px rgba(0,0,0,.06)}
        .nav-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px 4px;cursor:pointer;border:none;background:none;font-family:'Inter',sans-serif;transition:all .15s;gap:3px}
        .nav-item.on{color:var(--c)}
        .nav-item:not(.on){color:#9ca3af}
        .nav-icon{font-size:20px;line-height:1}
        .nav-label{font-size:9px;font-weight:600;letter-spacing:.3px;text-transform:uppercase}
        .store-chip{border:none;cursor:pointer;font-family:'Inter',sans-serif;font-size:12px;font-weight:700;padding:6px 14px;border-radius:20px;transition:all .15s}
        .store-chip.on{color:white;background:var(--c)}
        .store-chip:not(.on){background:#f3f4f6;color:#6b7280}
        .pill{display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:.3px;text-transform:uppercase}
        .mbadge{display:inline-block;padding:1px 5px;border-radius:4px;font-size:9px;font-weight:600;background:#fef3c7;color:#d97706;margin-left:4px}
        .row{background:white;border:1px solid #f3f4f6;border-radius:12px;padding:12px 14px;transition:all .15s;position:relative;overflow:hidden}
        .row:hover{box-shadow:0 2px 8px rgba(0,0,0,.06)}
        .evo-up{color:#16a34a}
        .evo-down{color:#dc2626}
        .clickable:hover{background:#f9fafb;cursor:pointer}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .fadein{animation:fadeUp .2s ease}
        .pulsing{animation:pulse 1.5s ease infinite}
        .spin{animation:spin .8s linear infinite;display:inline-block}
        @media(min-width:768px){.bottom-nav{display:none}.desktop-nav{display:flex!important}.content{max-width:1100px;margin:0 auto;padding:24px!important}}
      `}</style>

      {/* TOP BAR */}
      <div style={{background:"white",borderBottom:"1px solid #e5e7eb",padding:"0 16px",display:"flex",alignItems:"center",justifyContent:"space-between",height:52,position:"sticky",top:0,zIndex:50,boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:6,height:28,borderRadius:3,background:"linear-gradient(180deg,#E8001C,#374151)"}}/>
          <div>
            <div style={{fontWeight:900,fontSize:14,letterSpacing:-.5,color:"#111827",lineHeight:1}}>HOLDRIS</div>
            <div style={{fontSize:9,color:"#9ca3af",letterSpacing:1.5,fontWeight:600}}>SUIVI DÉPENSES</div>
          </div>
          {syncing&&<span className="spin" style={{fontSize:12,color:"#d1d5db",marginLeft:4}}>↻</span>}
        </div>
        <div className="desktop-nav" style={{display:"none",gap:2,background:"#f3f4f6",padding:4,borderRadius:10}}>
          {[["dashboard","📊 Tableau"],["journal","🧾 Journal"],["budget","💰 Budget"],["recap","📄 Récap"],["facture","＋ Facture"]].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)} style={{background:tab===id?"white":"transparent",border:"none",cursor:"pointer",fontFamily:"Inter,sans-serif",fontSize:12,fontWeight:600,padding:"7px 14px",borderRadius:7,color:tab===id?"#111827":"#9ca3af",boxShadow:tab===id?"0 1px 3px rgba(0,0,0,.08)":"none",transition:"all .15s"}}>{label}</button>
          ))}
        </div>
        <button onClick={exportPDF} className="btn btn-ghost" style={{padding:"7px 14px",fontSize:12}}>↓ PDF</button>
        <button onClick={exportExcel} className="btn btn-ghost" style={{padding:"7px 14px",fontSize:12}}>↓ Excel</button>
      </div>

      {/* STORE SELECTOR */}
      <div style={{background:"white",borderBottom:"1px solid #f3f4f6",padding:"10px 16px",display:"flex",gap:8,alignItems:"center"}}>
        {Object.entries(STORES).map(([key,s])=>(
          <button key={key} className={`store-chip ${store===key?"on":""}`} style={{"--c":s.color}} onClick={()=>setStore(key)}>{s.label}</button>
        ))}
        <button onClick={loadAll} style={{marginLeft:"auto",background:"none",border:"none",color:"#d1d5db",cursor:"pointer",fontSize:14,padding:"4px 8px",borderRadius:6}}>↻</button>
      </div>

      <div className="content" style={{"--c":c,"--cl":S.colorLight,padding:"16px"}}>

        {/* ══ DASHBOARD ══ */}
        {tab==="dashboard"&&(
          <div className="fadein">
            {/* KPIs */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              <div className="card" style={{borderTop:`3px solid ${c}`}}>
                <div style={{fontSize:10,color:"#9ca3af",fontWeight:600,textTransform:"uppercase",letterSpacing:.6,marginBottom:8}}>Total période TTC</div>
                <div style={{fontSize:22,fontWeight:800,letterSpacing:-.5,color:"#111827",fontFamily:"JetBrains Mono,monospace"}}>{fmt(totalTTC)}</div>
                <div style={{fontSize:11,color:"#9ca3af",marginTop:4}}>{si.length} facture(s)</div>
              </div>
              <div className="card">
                <div style={{fontSize:10,color:"#9ca3af",fontWeight:600,textTransform:"uppercase",letterSpacing:.6,marginBottom:8}}>{store==="fabrique"?"Bilan S1 (Oct–Mar)":"Bilan S1 (Jan–Jun)"}</div>
                <div style={{fontSize:22,fontWeight:800,letterSpacing:-.5,color:c,fontFamily:"JetBrains Mono,monospace"}}>{fmt(s1Total)}</div>
                <div style={{fontSize:11,marginTop:4}} className={s1Evo!==null?(s1Evo>=0?"evo-up":"evo-down"):""}>{s1Evo!==null?`${s1Evo>=0?"+":""}${s1Evo}% vs N-1`:"—"}</div>
              </div>
              <div className="card">
                <div style={{fontSize:10,color:"#9ca3af",fontWeight:600,textTransform:"uppercase",letterSpacing:.6,marginBottom:8}}>{MONTHS_FULL[CM]} en cours</div>
                <div style={{fontSize:22,fontWeight:800,letterSpacing:-.5,color:"#111827",fontFamily:"JetBrains Mono,monospace"}}>{fmt(cmTotal)}</div>
                <div style={{fontSize:11,marginTop:4}} className={evo!==null?(evo>=0?"evo-up":"evo-down"):""}>{evo!==null?`${evo>=0?"+":""}${evo}% vs mois préc.`:"—"}</div>
              </div>
              <div className="card">
                <div style={{fontSize:10,color:"#9ca3af",fontWeight:600,textTransform:"uppercase",letterSpacing:.6,marginBottom:8}}>Total HT</div>
                <div style={{fontSize:22,fontWeight:800,letterSpacing:-.5,color:"#111827",fontFamily:"JetBrains Mono,monospace"}}>{fmt(totalHT)}</div>
                <div style={{fontSize:11,color:"#9ca3af",marginTop:4}}>{fmt(totalTTC-totalHT)} TVA</div>
              </div>
            </div>

            {/* Barres mensuelles cliquables */}
            <div className="card" style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div style={{fontSize:12,fontWeight:700,color:"#374151",textTransform:"uppercase",letterSpacing:.5}}>Mensuel TTC</div>
                <div style={{display:"flex",gap:12,fontSize:10,color:"#9ca3af"}}>
                  <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:10,height:10,borderRadius:2,background:c,display:"inline-block"}}/>{CY}</span>
                  <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:10,height:10,borderRadius:2,background:`${c}40`,display:"inline-block"}}/>{CY-1}</span>
                </div>
              </div>
              {byMonth.map(({m,mi,total,prev})=>(
                <div key={mi} onClick={()=>{setFilterM(String(mi));setFilterT("all");setFilterP("all");setSearch("");setTab("journal");}}
                  className="clickable" style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,borderRadius:6,padding:"3px 4px",transition:"background .15s"}}>
                  <div style={{width:26,fontSize:10,color:mi===CM?c:"#9ca3af",fontWeight:mi===CM?700:500,flexShrink:0,textAlign:"right"}}>{m}</div>
                  <div style={{flex:1,display:"flex",flexDirection:"column",gap:2}}>
                    <div style={{background:"#f3f4f6",borderRadius:3,height:10,overflow:"hidden"}}>
                      <div style={{width:`${(total/maxMonth)*100}%`,height:"100%",background:mi===CM?c:`${c}cc`,borderRadius:3,transition:"width .5s",minWidth:total>0?3:0}}/>
                    </div>
                    {prev>0&&<div style={{background:"#f3f4f6",borderRadius:3,height:5,overflow:"hidden"}}>
                      <div style={{width:`${(prev/maxMonth)*100}%`,height:"100%",background:`${c}33`,borderRadius:3}}/>
                    </div>}
                  </div>
                  <div style={{width:68,fontSize:10,color:mi===CM?c:"#6b7280",fontFamily:"JetBrains Mono,monospace",textAlign:"right",flexShrink:0,fontWeight:mi===CM?700:500}}>{total>0?fmt(total):"—"}</div>
                  <div style={{fontSize:10,color:"#d1d5db",flexShrink:0}}>›</div>
                </div>
              ))}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              {/* Donut */}
              <div className="card">
                <div style={{fontSize:12,fontWeight:700,color:"#374151",textTransform:"uppercase",letterSpacing:.5,marginBottom:14}}>Par Typologie</div>
                <Donut/>
              </div>

              {/* Budget progress */}
              <div className="card">
                <div style={{fontSize:12,fontWeight:700,color:"#374151",textTransform:"uppercase",letterSpacing:.5,marginBottom:14}}>{store==="fabrique"?`Budget Oct ${FY}–Sep ${FY+1}`:`Budget ${CY}`}</div>
                {budgetProgress.length===0
                  ?<div style={{color:"#d1d5db",fontSize:12,textAlign:"center",padding:"16px 0"}}>Aucun budget défini<br/><span style={{fontSize:10,display:"block",marginTop:4}}>Configurez dans l'onglet Budget</span></div>
                  :budgetProgress.map(({t,budgetTotal,realTotal,pct,over})=>(
                    <div key={t} style={{marginBottom:12}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontSize:11,color:"#374151",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"55%"}}>{t}</span>
                        <span style={{fontSize:10,fontFamily:"JetBrains Mono,monospace",color:over?"#dc2626":"#6b7280"}}>{fmt(realTotal)} / {fmt(budgetTotal)}</span>
                      </div>
                      <div style={{background:"#f3f4f6",borderRadius:4,height:7,overflow:"hidden"}}>
                        <div style={{width:`${pct}%`,height:"100%",background:over?"#dc2626":c,borderRadius:4,transition:"width .4s"}}/>
                      </div>
                      {over&&<div style={{fontSize:9,color:"#dc2626",marginTop:2,fontWeight:600}}>⚠ Dépassement {fmt(realTotal-budgetTotal)}</div>}
                    </div>
                  ))
                }
              </div>
            </div>

            {/* Top prestataires cliquables */}
            <div className="card">
              <div style={{fontSize:12,fontWeight:700,color:"#374151",textTransform:"uppercase",letterSpacing:.5,marginBottom:14}}>Top Prestataires</div>
              {topPrest.length===0?<div style={{color:"#d1d5db",fontSize:13,textAlign:"center",padding:"16px 0"}}>Aucune dépense</div>
                :topPrest.map(([nom,total],i)=>(
                  <div key={i} onClick={()=>{setFilterP(nom);setFilterM("all");setFilterT("all");setSearch("");setTab("journal");}}
                    className="clickable" style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,borderRadius:6,padding:"2px 4px"}}>
                    <div style={{width:22,height:22,borderRadius:6,background:`${c}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:c,flexShrink:0}}>{i+1}</div>
                    <div style={{flex:1,fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{nom}</div>
                    <div style={{width:60,background:"#f3f4f6",borderRadius:3,height:8,overflow:"hidden",flexShrink:0}}>
                      <div style={{width:`${(total/topPrest[0][1])*100}%`,height:"100%",background:c,opacity:.8,borderRadius:3}}/>
                    </div>
                    <div style={{width:72,fontSize:12,fontFamily:"JetBrains Mono,monospace",color:"#374151",textAlign:"right",flexShrink:0,fontWeight:600}}>{fmt(total)}</div>
                    <div style={{fontSize:10,color:"#d1d5db",flexShrink:0}}>›</div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* ══ JOURNAL ══ */}
        {tab==="journal"&&(
          <div className="fadein">
            {/* Search bar */}
            <div style={{position:"relative",marginBottom:10}}>
              <input className="inp" type="text" placeholder="🔍 Rechercher un prestataire, poste, n° facture..." value={search} onChange={e=>setSearch(e.target.value)} style={{paddingLeft:16}}/>
              {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#9ca3af",cursor:"pointer",fontSize:16}}>✕</button>}
            </div>

            {/* Filters */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:8}}>
              <select className="inp" value={filterY} onChange={e=>{setFilterY(e.target.value);setFilterM("all");}}>
                <option value="current">{store==="fabrique"?`Oct ${FY} – Sep ${FY+1}`:`Année ${CY}`}</option>
                <option value="prev">{store==="fabrique"?`Oct ${FY-1} – Sep ${FY}`:`Année ${CY-1}`}</option>
              </select>
              <select className="inp" value={filterM} onChange={e=>setFilterM(e.target.value)}>
                <option value="all">Tous les mois</option>
                {MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}
              </select>
              <select className="inp" value={filterT} onChange={e=>setFilterT(e.target.value)}>
                <option value="all">Toutes typologies</option>
                {S.typologies.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <select className="inp" style={{marginBottom:8}} value={filterP} onChange={e=>setFilterP(e.target.value)}>
              <option value="all">Tous les prestataires</option>
              {allPrest.map(p=><option key={p} value={p}>{p}</option>)}
            </select>

            {/* Sort + reset */}
            <div style={{display:"flex",gap:8,marginBottom:12,alignItems:"center",flexWrap:"wrap"}}>
              <div style={{display:"flex",gap:4}}>
                {[["ajout","Ajout"],["date","Date"],["ttc","Montant"],["fournisseur","Nom"]].map(([k,l])=>(
                  <button key={k} onClick={()=>{if(sortBy===k)setSortDir(d=>d==="desc"?"asc":"desc");else{setSortBy(k);setSortDir("desc");}}}
                    style={{background:sortBy===k?c:"#f3f4f6",color:sortBy===k?"white":"#6b7280",border:"none",padding:"5px 10px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>
                    {l} {sortBy===k?(sortDir==="desc"?"↓":"↑"):""}
                  </button>
                ))}
              </div>
              {hasFilters&&(
                <button onClick={resetFilters} style={{background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",padding:"5px 12px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif",marginLeft:"auto"}}>
                  ✕ Réinitialiser les filtres
                </button>
              )}
              <div style={{fontSize:11,color:"#9ca3af",fontFamily:"JetBrains Mono,monospace",marginLeft:hasFilters?"0":"auto"}}>{fi.length} entrée(s) · {fmtFull(fi.reduce((s,i)=>s+(i.ttc||0),0))}</div>
            </div>

            {fi.length===0?<div className="card" style={{textAlign:"center",padding:"48px 0"}}><div style={{fontSize:32,marginBottom:10}}>🧾</div><div style={{fontSize:13,color:"#9ca3af"}}>Aucune facture{hasFilters?" pour ces filtres":""}</div>{hasFilters&&<button onClick={resetFilters} style={{marginTop:12,background:"none",border:"none",color:c,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"Inter,sans-serif"}}>Voir tout</button>}</div>
              :<div style={{display:"flex",flexDirection:"column",gap:8}}>
                {fi.map(inv=>(
                  <div key={inv.id}>
                    {editId===inv.id?(
                      <div className="card fadein" style={{border:`2px solid ${c}`}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
                          <div style={{fontWeight:700,fontSize:14}}>Modifier</div>
                          <div style={{display:"flex",gap:8}}>
                            <button className="btn btn-ghost" style={{padding:"7px 14px",fontSize:12}} onClick={()=>{setEditId(null);setEditForm(null);}}>Annuler</button>
                            <button className="btn btn-primary" style={{padding:"7px 14px",fontSize:12}} onClick={()=>updateInv({...editForm,id:inv.id})}>✓ Sauver</button>
                          </div>
                        </div>
                        <Fields f={editForm} setF={setEditForm}/>
                      </div>
                    ):(
                      <div>
                        <div className="row" onClick={()=>setDetailId(detailId===inv.id?null:inv.id)} onTouchStart={()=>setSwipeId(inv.id)} onTouchEnd={()=>setSwipeId(null)} style={{cursor:"pointer"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:14,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                                {inv.fournisseur}
                                {inv.manual&&<span className="mbadge">manuel</span>}
                              </div>
                              <div style={{fontSize:11,color:"#9ca3af",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{inv.poste||inv.description}</div>
                            </div>
                            <div style={{display:"flex",gap:4,flexShrink:0,marginLeft:8}}>
                              <button onClick={e=>{e.stopPropagation();setEditId(inv.id);setEditForm({...inv});}} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,padding:"4px",color:"#9ca3af"}} title="Modifier">✏️</button>
                              <button onClick={e=>{e.stopPropagation();setManual(true);setForm({...inv,id:Date.now(),numero_facture:""});setTab("facture");}} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,padding:"4px",color:"#9ca3af"}} title="Dupliquer">📋</button>
                              <button onClick={e=>{e.stopPropagation();setConfirmDelId(inv.id);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,padding:"4px",color:"#9ca3af"}} title="Supprimer">🗑️</button>
                            </div>
                          </div>
                          {confirmDelId===inv.id&&(
                            <div onClick={e=>e.stopPropagation()} style={{display:"flex",alignItems:"center",gap:8,background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"8px 12px",margin:"4px 0"}}>
                              <span style={{fontSize:12,color:"#991b1b",flex:1}}>Supprimer cette facture ?</span>
                              <button onClick={()=>delInv(inv.id)} style={{background:"#dc2626",color:"white",border:"none",borderRadius:6,padding:"4px 10px",fontSize:12,fontWeight:700,cursor:"pointer"}}>Oui</button>
                              <button onClick={()=>setConfirmDelId(null)} style={{background:"none",border:"1px solid #d1d5db",borderRadius:6,padding:"4px 10px",fontSize:12,cursor:"pointer"}}>Non</button>
                            </div>
                          )}
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                              <span className="pill" style={{background:`${c}15`,color:c}}>{inv.typologie}</span>
                              <span style={{fontSize:10,color:"#9ca3af"}}>{fmtDate(inv.date)}</span>
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              <div style={{fontSize:15,fontWeight:800,fontFamily:"JetBrains Mono,monospace",color:"#111827"}}>{fmtFull(inv.ttc)}</div>
                              <span style={{fontSize:12,color:"#d1d5db"}}>{detailId===inv.id?"▲":"▼"}</span>
                            </div>
                          </div>
                        </div>
                        {detailId===inv.id&&(
                          <div style={{background:"#f9fafb",borderRadius:"0 0 12px 12px",padding:"12px 16px",borderTop:"1px solid #f3f4f6",fontSize:12}}>
                            {[
                              ["Date",fmtDate(inv.date)],
                              ["N° facture",inv.numero_facture],
                              ["Fournisseur",inv.fournisseur],
                              ["Magasin",inv.magasin],
                              ["Typologie",inv.typologie],
                              ["Poste",inv.poste],
                              ["Description",inv.description],
                              ["HT",inv.ht!=null?fmtFull(inv.ht):null],
                              ["TVA",inv.tva!=null?fmtFull(inv.tva):null],
                              ["TTC",inv.ttc!=null?fmtFull(inv.ttc):null],
                            ].filter(([,v])=>v).map(([label,val])=>(
                              <div key={label} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid #f3f4f6"}}>
                                <span style={{color:"#9ca3af",fontWeight:600,textTransform:"uppercase",fontSize:10,letterSpacing:.4}}>{label}</span>
                                <span style={{color:"#111827",fontWeight:500,textAlign:"right",maxWidth:"60%"}}>{val}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {/* Total en bas */}
                {(()=>{
                  const totN=fi.reduce((s,i)=>s+(i.ttc||0),0);
                  const prevBase=filterY==="prev"?[]:siPrev;
                  const totN1=(filterM==="all"?prevBase:prevBase.filter(i=>mIdx(i.date)===parseInt(filterM))).reduce((s,i)=>s+(i.ttc||0),0);
                  const evoN=totN1>0?Math.round((totN-totN1)/totN1*100):null;
                  return(
                    <div style={{background:"white",border:`2px solid ${c}`,borderRadius:12,padding:"12px 16px",marginTop:4}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontSize:13,fontWeight:700,color:"#374151"}}>TOTAL {hasFilters?"(filtré)":""}</span>
                        <span style={{fontSize:16,fontWeight:800,fontFamily:"JetBrains Mono,monospace",color:c}}>{fmtFull(totN)}</span>
                      </div>
                      {totN1>0&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:4}}>
                        <span style={{fontSize:11,color:"#9ca3af"}}>N-1 : {fmtFull(totN1)}</span>
                        <span style={{fontSize:12,fontWeight:700,color:evoN>0?"#dc2626":"#16a34a"}}>{evoN>0?"+":""}{evoN}%</span>
                      </div>}
                    </div>
                  );
                })()}
              </div>
            }
          </div>
        )}

        {/* ══ BUDGET ══ */}
        {tab==="budget"&&(
          <div className="fadein">
            <div style={{marginBottom:14,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
              {Object.entries(STORES).map(([key,s])=>(
                <button key={key} className={`store-chip ${budgetStore===key?"on":""}`} style={{"--c":s.color}} onClick={()=>{setBudgetStore(key);setBudgetTypo("");}}>
                  {s.label}
                </button>
              ))}
              <select className="inp" style={{maxWidth:100,marginLeft:"auto"}} value={budgetYear} onChange={e=>setBudgetYear(parseInt(e.target.value))}>
                {[CY-1,CY,CY+1,CY+2].map(y=><option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
              {STORES[budgetStore].typologies.map(t=>(
                <button key={t} onClick={()=>setBudgetTypo(t===budgetTypo?"":t)}
                  style={{background:budgetTypo===t?STORES[budgetStore].color:"white",color:budgetTypo===t?"white":"#6b7280",border:`1.5px solid ${budgetTypo===t?STORES[budgetStore].color:"#e5e7eb"}`,padding:"6px 12px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif",transition:"all .15s"}}>
                  {t}
                </button>
              ))}
            </div>
            {budgetTypo?(
              <div className="card fadein">
                <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>{budgetTypo}</div>
                <div style={{fontSize:12,color:"#9ca3af",marginBottom:16}}>{STORES[budgetStore].label} — {budgetYear}</div>
                {MONTHS_FULL.map((mName,mi)=>{
                  const bv=(budgets[budgetStore]?.[budgetTypo]||{})[`${budgetYear}-${mi}`]||0;
                  const real=invoices.filter(i=>i.magasin===budgetStore&&i.typologie===budgetTypo&&mIdx(i.date)===mi&&yr(i.date)===budgetYear).reduce((s,i)=>s+(i.ttc||0),0);
                  const pct=bv>0?Math.min(real/bv*100,100):0;
                  const over=bv>0&&real>bv;
                  return(
                    <div key={mi} style={{marginBottom:14}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                        <span style={{fontSize:12,fontWeight:600,color:"#374151"}}>{mName}</span>
                        <div style={{display:"flex",gap:8,alignItems:"center"}}>
                          <span style={{fontSize:11,fontFamily:"JetBrains Mono,monospace",color:over?"#dc2626":"#6b7280"}}>{fmt(real)}</span>
                          <span style={{fontSize:10,color:"#9ca3af"}}>/</span>
                          <input type="number" value={bv||""} placeholder="Budget" onChange={e=>setBudgetVal(budgetStore,budgetTypo,`${budgetYear}-${mi}`,e.target.value)}
                            style={{width:90,background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:6,padding:"4px 8px",fontSize:11,fontFamily:"JetBrains Mono,monospace",outline:"none",textAlign:"right"}}/>
                        </div>
                      </div>
                      {bv>0&&<div style={{background:"#f3f4f6",borderRadius:4,height:8,overflow:"hidden"}}>
                        <div style={{width:`${pct}%`,height:"100%",background:over?"#dc2626":STORES[budgetStore].color,borderRadius:4,transition:"width .4s"}}/>
                      </div>}
                      {over&&<div style={{fontSize:9,color:"#dc2626",marginTop:2,fontWeight:600}}>⚠ Dépassement de {fmt(real-bv)}</div>}
                    </div>
                  );
                })}
                <div style={{marginTop:16,padding:"12px 14px",background:"#f9fafb",borderRadius:10,display:"flex",justifyContent:"space-between"}}>
                  <div><div style={{fontSize:10,color:"#9ca3af",fontWeight:600,textTransform:"uppercase"}}>Total réel</div><div style={{fontSize:16,fontWeight:800,fontFamily:"JetBrains Mono,monospace"}}>{fmt(invoices.filter(i=>i.magasin===budgetStore&&i.typologie===budgetTypo&&yr(i.date)===budgetYear).reduce((s,i)=>s+(i.ttc||0),0))}</div></div>
                  <div style={{textAlign:"right"}}><div style={{fontSize:10,color:"#9ca3af",fontWeight:600,textTransform:"uppercase"}}>Budget total</div><div style={{fontSize:16,fontWeight:800,fontFamily:"JetBrains Mono,monospace",color:STORES[budgetStore].color}}>{fmt(MONTHS.reduce((s,_,mi)=>s+((budgets[budgetStore]?.[budgetTypo]||{})[`${budgetYear}-${mi}`]||0),0))}</div></div>
                </div>
              </div>
            ):(
              <div className="card" style={{textAlign:"center",padding:"40px 0"}}>
                <div style={{fontSize:32,marginBottom:10}}>💰</div>
                <div style={{fontSize:13,color:"#9ca3af"}}>Sélectionne une typologie pour saisir les budgets mensuels</div>
              </div>
            )}
          </div>
        )}

        {/* ══ RÉCAP ══ */}
        {tab==="recap"&&(
          <div className="fadein">
            <div style={{marginBottom:12}}>
              <div style={{fontSize:18,fontWeight:800,letterSpacing:-.3,marginBottom:4}}>Récapitulatif</div>
              <div style={{fontSize:13,color:"#6b7280"}}>Bilan période en cours par magasin</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <RecapCard storeKey="conforama"/>
              <RecapCard storeKey="fabrique"/>
              <div className="card" style={{borderTop:"3px solid #111827"}}>
                <div style={{fontWeight:700,fontSize:13,color:"#111827",marginBottom:12}}>HOLDRIS — Consolidé</div>
                {["PRINT & SIGNALÉTIQUE","DIGITAL","AUDIOVISUEL & MÉDIA","INFLUENCE & PARTENARIAT","DIVERS MARKETING","DIVERS","WEB","SERVICE"].map(t=>{
                  const v=invoices.filter(i=>inCurrentPeriod(i.date,i.magasin)&&i.typologie===t).reduce((s,i)=>s+(i.ttc||0),0);
                  if(!v) return null;
                  return(
                    <div key={t} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #f3f4f6"}}>
                      <span style={{fontSize:12,color:"#374151"}}>{t}</span>
                      <span style={{fontSize:12,fontWeight:700,fontFamily:"JetBrains Mono,monospace"}}>{fmt(v)}</span>
                    </div>
                  );
                })}
                <div style={{marginTop:12,display:"flex",justifyContent:"space-between",padding:"10px 0",borderTop:"2px solid #111827"}}>
                  <span style={{fontSize:14,fontWeight:800}}>TOTAL GLOBAL</span>
                  <span style={{fontSize:14,fontWeight:800,fontFamily:"JetBrains Mono,monospace"}}>{fmt(invoices.filter(i=>inCurrentPeriod(i.date,i.magasin)).reduce((s,i)=>s+(i.ttc||0),0))}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ FACTURE ══ */}
        {tab==="facture"&&(
          <div className="fadein">
            {!preview&&!loading&&!manual&&!recurring&&(
              <>
                <div onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)}
                  onDrop={e=>{e.preventDefault();setDragOver(false);const f=e.dataTransfer.files[0];if(f)analyzeFile(f);}}
                  onClick={()=>fileRef.current.click()}
                  style={{border:`2px dashed ${dragOver?c:"#e5e7eb"}`,borderRadius:16,padding:"36px 20px",textAlign:"center",cursor:"pointer",transition:"all .2s",background:dragOver?`${c}08`:"white",marginBottom:10}}>
                  <div style={{fontSize:40,marginBottom:10}}>📎</div>
                  <div style={{fontWeight:800,fontSize:17,marginBottom:6,letterSpacing:-.3}}>Déposer une facture</div>
                  <div style={{color:"#9ca3af",fontSize:13,marginBottom:18}}>JPG, PNG ou PDF</div>
                  <div className="btn btn-primary" style={{display:"inline-flex"}}>Choisir un fichier</div>
                  <input ref={fileRef} type="file" accept="image/*,.pdf" style={{display:"none"}} onChange={e=>e.target.files[0]&&analyzeFile(e.target.files[0])}/>
                </div>
                {/* Bouton caméra direct sur mobile */}
                <button onClick={()=>cameraRef.current.click()}
                  style={{width:"100%",padding:"12px",borderRadius:12,border:`1.5px solid #e5e7eb`,background:"white",color:"#374151",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  📷 Prendre une photo
                </button>
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>e.target.files[0]&&analyzeFile(e.target.files[0])}/>
                <div style={{textAlign:"center",fontSize:12,color:"#9ca3af",margin:"8px 0"}}>— ou —</div>
                <button onClick={()=>{setManual(true);setForm({...EMPTY,magasin:store});}} className="btn btn-outline" style={{width:"100%",justifyContent:"center",marginBottom:8}}>
                  ✏️ Saisie manuelle
                </button>
                <button onClick={openRecurring} style={{width:"100%",padding:"10px",borderRadius:10,border:"1.5px solid #6b7280",background:"white",color:"#6b7280",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  🔄 Saisie récurrente — même montant sur plusieurs mois
                </button>
              </>
            )}

            {loading&&(
              <div className="card pulsing" style={{textAlign:"center",padding:"60px 0"}}>
                <div style={{fontSize:40,marginBottom:16}}>⏳</div>
                <div style={{fontWeight:700,fontSize:15}}>Analyse en cours…</div>
                <div style={{color:"#9ca3af",fontSize:12,marginTop:6}}>L'IA lit votre facture</div>
              </div>
            )}

            {error&&(
              <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:12,padding:"14px 16px",marginBottom:12,color:"#dc2626",fontSize:13,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span>⚠ {error}</span>
                <button onClick={()=>setError("")} style={{background:"none",border:"none",color:"#dc2626",cursor:"pointer",fontSize:18}}>×</button>
              </div>
            )}

            {dupWarning&&(
              <div style={{background:"#fffbeb",border:"1px solid #fcd34d",borderRadius:12,padding:"12px 16px",marginBottom:12,color:"#92400e",fontSize:12}}>
                ⚠️ <strong>Doublon possible</strong> — {dupWarning.fournisseur} · {fmtFull(dupWarning.ttc)} · {dupWarning.date}
              </div>
            )}

            {/* Saisie récurrente */}
            {recurring&&!loading&&(
              <div className="card fadein" style={{border:"2px solid #6b7280"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <div><div style={{fontWeight:800,fontSize:15}}>Saisie récurrente 🔄</div><div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>Même montant, plusieurs mois</div></div>
                  <div style={{display:"flex",gap:8}}>
                    <button className="btn btn-ghost" style={{padding:"8px 14px",fontSize:12}} onClick={()=>setRecurring(false)}>Annuler</button>
                    <button style={{background:"#6b7280",color:"white",border:"none",padding:"8px 14px",borderRadius:10,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif"}} onClick={saveRecurring}>
                      ✓ Créer {recurringForm.months.length} entrée(s)
                    </button>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                  {[
                    {l:"Fournisseur",k:"fournisseur",t:"text"},
                    {l:"Magasin",k:"magasin",t:"sel",opts:Object.entries(STORES).map(([k,s])=>({v:k,l:s.label}))},
                    {l:"TTC (€)",k:"ttc",t:"number"},
                    {l:"HT (€)",k:"ht",t:"number"},
                    {l:"TVA (€)",k:"tva",t:"number"},
                    {l:"Année",k:"year",t:"number"},
                    {l:"Typologie",k:"typologie",t:"sel",opts:STORES[recurringForm.magasin||"conforama"].typologies.map(t=>({v:t,l:t}))},
                  ].map(field=>(
                    <div key={field.k}>
                      <label style={{display:"block",fontSize:10,color:"#9ca3af",fontWeight:600,marginBottom:4,textTransform:"uppercase",letterSpacing:.6}}>{field.l}</label>
                      {field.t==="sel"
                        ?<select className="inp" value={recurringForm[field.k]||""} onChange={e=>setRecurringForm(p=>({...p,[field.k]:e.target.value}))}>
                           <option value="">—</option>{field.opts?.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                         </select>
                        :<input className="inp" type={field.t} value={recurringForm[field.k]||""} onChange={e=>setRecurringForm(p=>({...p,[field.k]:field.t==="number"?parseFloat(e.target.value)||0:e.target.value}))}/>
                      }
                    </div>
                  ))}
                  <div style={{gridColumn:"1/-1"}}>
                    <label style={{display:"block",fontSize:10,color:"#9ca3af",fontWeight:600,marginBottom:4,textTransform:"uppercase",letterSpacing:.6}}>Poste</label>
                    <input className="inp" type="text" value={recurringForm.poste||""} onChange={e=>setRecurringForm(p=>({...p,poste:e.target.value}))}/>
                  </div>
                </div>
                <div style={{fontSize:10,color:"#9ca3af",fontWeight:600,textTransform:"uppercase",letterSpacing:.6,marginBottom:8}}>Sélectionner les mois</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:8}}>
                  {MONTHS.map((m,mi)=>{
                    const sel=recurringForm.months.includes(mi);
                    return <button key={mi} onClick={()=>setRecurringForm(p=>({...p,months:sel?p.months.filter(x=>x!==mi):[...p.months,mi].sort((a,b)=>a-b)}))}
                      style={{padding:"8px 4px",borderRadius:8,border:`1.5px solid ${sel?"#6b7280":"#e5e7eb"}`,background:sel?"#6b7280":"white",color:sel?"white":"#6b7280",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>{m}</button>;
                  })}
                </div>
                <button onClick={()=>setRecurringForm(p=>({...p,months:MONTHS.map((_,i)=>i)}))}
                  style={{background:"none",border:"none",color:"#6b7280",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"Inter,sans-serif",textDecoration:"underline"}}>
                  Tout sélectionner
                </button>
              </div>
            )}

            {/* Saisie manuelle */}
            {manual&&!loading&&(
              <div className="card fadein" style={{border:`2px solid ${c}33`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <div><div style={{fontWeight:800,fontSize:15}}>Saisie manuelle ✏️</div><div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>Sans justificatif ou historique</div></div>
                  <div style={{display:"flex",gap:8}}>
                    <button className="btn btn-ghost" style={{padding:"8px 14px",fontSize:12}} onClick={()=>{setManual(false);setForm(EMPTY);}}>Annuler</button>
                    <button className="btn btn-primary" style={{padding:"8px 14px",fontSize:12}} onClick={()=>saveInv({...form,id:Date.now(),manual:true,fileName:"Saisie manuelle"})}>✓ Enregistrer</button>
                  </div>
                </div>
                <Fields f={form} setF={setForm}/>
              </div>
            )}

            {/* Preview IA */}
            {preview&&!loading&&(
              <div className="card fadein" style={{border:`2px solid ${c}33`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                  <div><div style={{fontWeight:800,fontSize:15}}>Facture analysée ✓</div><div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{preview.fileName}</div></div>
                  <div style={{display:"flex",gap:8}}>
                    <button className="btn btn-ghost" style={{padding:"8px 14px",fontSize:12}} onClick={()=>{setPreview(null);setDupWarning(null);}}>Annuler</button>
                    <button className="btn btn-primary" style={{padding:"8px 14px",fontSize:12}} onClick={()=>saveInv(preview)}>✓ Enregistrer</button>
                  </div>
                </div>
                <Fields f={preview} setF={setPreview}/>
                <div style={{marginTop:14,padding:"12px 14px",background:"#f9fafb",borderRadius:10,display:"flex",gap:20,borderLeft:`3px solid ${c}`}}>
                  {[["HT",preview.ht],["TVA",preview.tva],["TTC",preview.ttc]].map(([l,v])=>(
                    <div key={l}><div style={{fontSize:9,color:"#9ca3af",fontWeight:700,letterSpacing:.8,textTransform:"uppercase",marginBottom:2}}>{l}</div>
                    <div style={{fontFamily:"JetBrains Mono,monospace",fontSize:14,fontWeight:l==="TTC"?800:500,color:l==="TTC"?c:"#374151"}}>{fmtFull(v)}</div></div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MOBILE BOTTOM NAV */}
      <nav className="bottom-nav" style={{"--c":c}}>
        {[["dashboard","📊","Bord"],["journal","🧾","Journal"],["facture","＋","Facture"],["budget","💰","Budget"],["recap","📄","Récap"]].map(([id,icon,label])=>(
          <button key={id} className={`nav-item ${tab===id?"on":""}`} onClick={()=>setTab(id)}>
            <span className="nav-icon" style={id==="facture"?{width:42,height:42,background:c,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:22,marginTop:-18,boxShadow:`0 4px 14px ${c}66`}:{}}>{icon}</span>
            <span className="nav-label">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
