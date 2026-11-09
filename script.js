const $ = s => document.querySelector(s);
const COL = {circolare:"#1a73e8", impegno:"#0b8043", riunione:"#e8710a", scadenza:"#d93025"};
const MESI_G = ["Lun","Mar","Mer","Gio","Ven","Sab","Dom"];
const store = {
  get(k){ try { return localStorage.getItem(k); } catch(e){ return null; } },
  set(k,v){ try { localStorage.setItem(k,v); } catch(e){} }
};
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const key = d => d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const fmt = k => new Date(k+"T12:00").toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long",year:"numeric"});

function seed(){
  return [
    {id:1,tipo:"circolare",num:"112",titolo:"Collegio docenti unitario",data:"2026-11-12",ora:"15:00",classi:[],desc:"Ordine del giorno: PTOF, progetti, varie ed eventuali.",firme:[]},
    {id:2,tipo:"riunione",num:"",titolo:"Consiglio di classe 5F",data:"2026-11-10",ora:"14:30",classi:["5F"],desc:"Andamento didattico e disciplinare.",firme:[]},
    {id:3,tipo:"circolare",num:"115",titolo:"Uscita didattica a Ravenna",data:"2026-11-18",ora:"08:00",classi:["3F","4F"],desc:"Ritrovo davanti alla scuola. Autorizzazioni da consegnare entro il 13/11.",firme:[]},
    {id:4,tipo:"scadenza",num:"",titolo:"Consegna programmazioni",data:"2026-11-20",ora:"",classi:[],desc:"Caricare le programmazioni individuali sul registro.",firme:[]},
    {id:5,tipo:"impegno",num:"",titolo:"Colloqui generali",data:"2026-11-24",ora:"15:00",classi:[],desc:"Ricevimento genitori in presenza.",firme:[]},
    {id:6,tipo:"circolare",num:"120",titolo:"Sciopero generale del 27 novembre",data:"2026-11-27",ora:"",classi:[],desc:"Possibili variazioni dell’orario delle lezioni.",firme:[]}
  ];
}
let eventi;
try { eventi = JSON.parse(store.get("eventi") || "null"); } catch(e){ eventi = null; }
if (!Array.isArray(eventi)) eventi = seed();
const salva = () => store.set("eventi", JSON.stringify(eventi));

let vista = new Date(); vista.setDate(1);
let docente = store.get("docente") || "";
$("#docente").value = docente;
$("#docente").addEventListener("input", e => { docente = e.target.value.trim(); store.set("docente", docente); render(); });

function filtrati(){
  const q = $("#q").value.toLowerCase(), t = $("#ft").value, c = $("#fc").value.trim().toLowerCase();
  return eventi.filter(e =>
    (!t || e.tipo === t) &&
    (!c || e.classi.some(x => x.toLowerCase() === c) || (!e.classi.length && c === "tutte")) &&
    (!q || (e.titolo+" "+e.num+" "+e.desc).toLowerCase().includes(q))
  ).sort((a,b) => (a.data+a.ora).localeCompare(b.data+b.ora));
}
const firmato = e => docente && e.firme.some(f => f.nome.toLowerCase() === docente.toLowerCase());

function render(){
  $("#titolo").textContent = vista.toLocaleDateString("it-IT",{month:"long",year:"numeric"});
  $("#dh").innerHTML = MESI_G.map(g => `<div class="dh">${g}</div>`).join("");
  const off = (vista.getDay()+6)%7;
  const start = new Date(vista.getFullYear(), vista.getMonth(), 1-off);
  const lista = filtrati(), oggi = key(new Date());
  let h = "";
  for (let i=0; i<42; i++){
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate()+i), k = key(d);
    const ev = lista.filter(e => e.data === k);
    const cls = "day"+(d.getMonth()!==vista.getMonth()?" off":"")+(k===oggi?" today":"");
    h += `<div class="${cls}" data-d="${k}"><span class="n">${d.getDate()}</span>`;
    ev.slice(0,3).forEach(e => {
      h += `<div class="chip ${firmato(e)?"ok":""}" style="background:${COL[e.tipo]}" data-id="${e.id}" title="${esc(e.titolo)}">${firmato(e)?"✓ ":""}${e.ora?esc(e.ora)+" ":""}${esc(e.titolo)}</div>`;
    });
    if (ev.length>3) h += `<div class="more">+${ev.length-3} altri</div>`;
    h += `</div>`;
  }
  $("#giorni").innerHTML = h;

  const da = lista.filter(e => e.tipo==="circolare" && !firmato(e));
  $("#todo").innerHTML = da.length
    ? da.map(e => `<div class="todo" data-id="${e.id}"><span class="dot" style="background:${COL[e.tipo]}"></span><div><b>${e.num?"N° "+esc(e.num)+" · ":""}${esc(e.titolo)}</b><br><span class="mut">${esc(fmt(e.data))}</span></div></div>`).join("")
    : `<span class="mut">Nessuna circolare in attesa.</span>`;
}

$("#giorni").addEventListener("click", ev => {
  const chip = ev.target.closest(".chip");
  if (chip) return dettaglio(+chip.dataset.id);
  const day = ev.target.closest(".day");
  if (day) apriForm(day.dataset.d);
});
$("#todo").addEventListener("click", ev => { const t = ev.target.closest(".todo"); if (t) dettaglio(+t.dataset.id); });
["q","ft","fc"].forEach(id => $("#"+id).addEventListener("input", render));
$("#prev").onclick = () => { vista.setMonth(vista.getMonth()-1); render(); };
$("#next").onclick = () => { vista.setMonth(vista.getMonth()+1); render(); };
$("#oggi").onclick = () => { vista = new Date(); vista.setDate(1); render(); };
$("#nuovo").onclick = () => apriForm(key(new Date()));
$("#tema").onclick = () => {
  const r = document.documentElement;
  const dark = r.dataset.theme ? r.dataset.theme==="dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  r.dataset.theme = dark ? "light" : "dark";
};

function dettaglio(id, conferma){
  const e = eventi.find(x => x.id===id); if (!e) return;
  const f = firmato(e);
  $("#detBody").innerHTML = `
    <span class="badge" style="background:${COL[e.tipo]}">${e.tipo}${e.num?" n° "+esc(e.num):""}</span>
    <h3 style="margin-top:8px">${esc(e.titolo)}</h3>
    <p class="mut">${esc(fmt(e.data))}${e.ora?" · ore "+esc(e.ora):""}<br>Classi: ${e.classi.length?esc(e.classi.join(", ")):"tutte"}</p>
    <p>${esc(e.desc)||"<span class='mut'>Nessuna descrizione.</span>"}</p>
    <h4 style="margin:12px 0 4px">Firme di presa visione (${e.firme.length})</h4>
    ${e.firme.length ? e.firme.map(x => `<div class="sig"><span>${esc(x.nome)}</span><span class="mut">${esc(x.ts)}</span></div>`).join("") : `<span class="mut">Nessuna firma.</span>`}
    <div class="acts" style="justify-content:flex-start">
      <button id="bIcs">📲 Aggiungi al calendario</button>
      <a class="btn" target="_blank" rel="noopener" href="${gcal(e)}">Google Calendar</a>
    </div>
    <div class="acts">
      <button id="bDel" class="danger">${conferma?"Conferma eliminazione":"Elimina"}</button>
      <button id="bChiudi">Chiudi</button>
      ${f ? `<button id="bFirma">Togli la mia firma</button>` : `<button id="bFirma" class="pri">Firma presa visione</button>`}
    </div>`;
  $("#bChiudi").onclick = () => $("#dDet").close();
  $("#bIcs").onclick = () => scarica([e], e.titolo);
  $("#bDel").onclick = () => {
    if (!conferma) return dettaglio(id, true);
    eventi = eventi.filter(x => x.id!==id); salva(); $("#dDet").close(); render();
  };
  $("#bFirma").onclick = () => {
    if (!docente){ $("#dDet").close(); $("#docente").focus(); alert("Inserisci prima il tuo nome nel riquadro Docente."); return; }
    if (f) e.firme = e.firme.filter(x => x.nome.toLowerCase()!==docente.toLowerCase());
    else e.firme.push({nome:docente, ts:new Date().toLocaleString("it-IT",{dateStyle:"short",timeStyle:"short"})});
    salva(); render(); dettaglio(id);
  };
  if (!$("#dDet").open) $("#dDet").showModal();
}

function apriForm(data){
  $("#form").reset();
  $("#fData").value = data;
  $("#dForm").showModal();
}
$("#fAnn").onclick = () => $("#dForm").close();
$("#form").addEventListener("submit", ev => {
  ev.preventDefault();
  eventi.push({
    id: Date.now(),
    tipo: $("#fTipo").value,
    num: $("#fNum").value.trim(),
    titolo: $("#fTit").value.trim(),
    data: $("#fData").value,
    ora: $("#fOra").value,
    classi: $("#fCl").value.split(",").map(s => s.trim().toUpperCase()).filter(Boolean),
    desc: $("#fDesc").value.trim(),
    firme: []
  });
  salva(); $("#dForm").close();
  const d = new Date($("#fData").value+"T12:00"); vista = new Date(d.getFullYear(), d.getMonth(), 1);
  render();
});

const pad = n => String(n).padStart(2,"0");
function quando(e){
  const d = e.data.replace(/-/g,"");
  if (!e.ora){
    const n = new Date(e.data+"T12:00"); n.setDate(n.getDate()+1);
    return {all:true, a:d, b:key(n).replace(/-/g,"")};
  }
  const fine = new Date(e.data+"T"+e.ora); fine.setHours(fine.getHours()+1);
  return {all:false, a:d+"T"+e.ora.replace(":","")+"00", b:key(fine).replace(/-/g,"")+"T"+pad(fine.getHours())+pad(fine.getMinutes())+"00"};
}
const titoloCal = e => (e.num ? "Circ. "+e.num+" – " : "") + e.titolo;
const testo = e => [e.num?"Circolare n° "+e.num:"", e.classi.length?"Classi: "+e.classi.join(", "):"", e.desc].filter(Boolean).join("\n");
const icsEsc = s => String(s).replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\n/g,"\\n");
function ics(lista){
  const r = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Belluzzi da Vinci//Circolari//IT","CALSCALE:GREGORIAN"];
  const stamp = new Date().toISOString().replace(/[-:]/g,"").slice(0,15)+"Z";
  lista.forEach(e => {
    const w = quando(e);
    r.push("BEGIN:VEVENT","UID:"+e.id+"@belluzzi-circolari","DTSTAMP:"+stamp,
      w.all ? "DTSTART;VALUE=DATE:"+w.a : "DTSTART:"+w.a,
      w.all ? "DTEND;VALUE=DATE:"+w.b : "DTEND:"+w.b,
      "SUMMARY:"+icsEsc(titoloCal(e)),
      "DESCRIPTION:"+icsEsc(testo(e)),
      "BEGIN:VALARM","ACTION:DISPLAY","DESCRIPTION:Promemoria","TRIGGER:-P1D","END:VALARM",
      "END:VEVENT");
  });
  r.push("END:VCALENDAR");
  return r.join("\r\n");
}
function scarica(lista, nome){
  const blob = new Blob([ics(lista)], {type:"text/calendar;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = (nome||"eventi").replace(/[^\w]+/g,"-").slice(0,40)+".ics";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function gcal(e){
  const w = quando(e);
  return "https://calendar.google.com/calendar/render?action=TEMPLATE&text="+encodeURIComponent(titoloCal(e))+"&dates="+w.a+"/"+w.b+"&details="+encodeURIComponent(testo(e));
}
$("#esporta").onclick = () => {
  const l = filtrati();
  if (!l.length) return alert("Nessun evento da esportare.");
  scarica(l, "circolari");
};
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});

render();
