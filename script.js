const $=s=>document.querySelector(s),F=n=>$('#f-'+n),pad=n=>String(n).padStart(2,'0');
const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const T={circolare:['📄','Circolare'],impegno:['📌','Impegno'],compleanno:['🎂','Compleanno']};
const load=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))||f}catch{return f}};
let E=load('circolari-v2',[]),sent=load('circolari-sent',{}),filter='all',view=new Date(),sel=iso(new Date()),cur=null;
const save=()=>localStorage.setItem('circolari-v2',JSON.stringify(E));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const on=(e,d)=>e.date===d||(e.type==='compleanno'&&e.date.slice(5)===d.slice(5)&&d>e.date);
const byDay=d=>E.filter(e=>(filter==='all'||e.type===filter)&&on(e,d)).sort((a,b)=>(a.time||'')<(b.time||'')?-1:1);
const nextDate=(e,t)=>{if(e.type!=='compleanno')return e.date>=t?e.date:null;const y=+t.slice(0,4);let c=y+e.date.slice(4);if(c<t)c=(y+1)+e.date.slice(4);return c<e.date?e.date:c};
const longDate=d=>new Date(d+'T12:00').toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long'});
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('on');setTimeout(()=>t.classList.remove('on'),3500)};

const item=(e,d)=>{const age=e.type==='compleanno'&&d?` · ${d.slice(0,4)-e.date.slice(0,4)} anni`:'';
  return `<li class="it ${e.type}" data-id="${e.id}"><span class="em">${T[e.type][0]}</span><div><strong>${esc(e.title)}</strong><small>${d&&d!==sel?longDate(d)+' · ':''}${e.time||'Tutto il giorno'}${age}${e.type==='circolare'?(e.signed?' · ✔ firmata':' · da firmare'):''}</small></div></li>`};

function render(){
  const y=view.getFullYear(),m=view.getMonth(),today=iso(new Date());
  $('#title').textContent=view.toLocaleDateString('it-IT',{month:'long',year:'numeric'});
  const first=(new Date(y,m,1).getDay()+6)%7,n=new Date(y,m+1,0).getDate();
  let h='<span class="cell empty"></span>'.repeat(first);
  for(let d=1;d<=n;d++){
    const k=`${y}-${pad(m+1)}-${pad(d)}`,l=byDay(k);
    h+=`<button class="cell${k===today?' today':''}${k===sel?' sel':''}" data-d="${k}"><b>${d}</b><i>${[...new Set(l.map(e=>e.type))].map(t=>`<u class="${t}"></u>`).join('')}</i>${l.some(e=>e.type==='circolare'&&!e.signed)?'<s></s>':''}</button>`;
  }
  $('#grid').innerHTML=h;
  $('#dayh').textContent=longDate(sel);
  const l=byDay(sel);
  $('#day').innerHTML=l.length?l.map(e=>item(e)).join(''):'<li class="none">Nessun evento. Tocca “Nuovo” per aggiungerne uno.</li>';
  const t=iso(new Date());
  const up=E.filter(e=>filter==='all'||e.type===filter).map(e=>[nextDate(e,t),e]).filter(x=>x[0]).sort((a,b)=>a[0]<b[0]?-1:1).slice(0,6);
  $('#nextl').innerHTML=up.length?up.map(([d,e])=>item(e,d)).join(''):'<li class="none">Niente in programma.</li>';
}

function openForm(e){
  ['id','type','title','date','time','notes'].forEach(k=>F(k).value=e?(e[k]||''):k==='type'?'circolare':k==='date'?sel:'');
  $('#fh').textContent=e?'Modifica evento':'Nuovo evento';$('#dlgF').showModal();
}
$('#f').onsubmit=x=>{x.preventDefault();const o={};
  ['type','title','date','time','notes'].forEach(k=>o[k]=F(k).value.trim());
  const id=F('id').value;
  if(id)Object.assign(E.find(e=>e.id===id),o);else E.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),signed:'',...o});
  save();sel=o.date;view=new Date(o.date+'T12:00');$('#dlgF').close();render();toast('Evento salvato');check();
};
function openDet(id){
  cur=E.find(e=>e.id===id);if(!cur)return;const e=cur;
  $('#dt').innerHTML=`<p class="tag ${e.type}">${T[e.type][0]} ${T[e.type][1]}</p><h2>${esc(e.title)}</h2><p>${longDate(e.date)}, ${e.date.slice(0,4)}${e.time?' · '+e.time:''}${e.type==='compleanno'?' · ogni anno':''}</p>${e.notes?`<p class="notes">${esc(e.notes)}</p>`:''}${e.signed?`<p class="notes">✔ Firmata il ${new Date(e.signed).toLocaleString('it-IT',{dateStyle:'short',timeStyle:'short'})}</p>`:''}`;
  $('#sign').hidden=e.type!=='circolare';$('#sign').textContent=e.signed?'↩ Rimuovi la firma':'✍ Firma per presa visione';
  $('#dlgD').showModal();
}
$('#sign').onclick=()=>{cur.signed=cur.signed?'':new Date().toISOString();save();$('#dlgD').close();render();toast(cur.signed?'Circolare firmata':'Firma rimossa')};
$('#del').onclick=()=>{if(confirm('Eliminare “'+cur.title+'”?')){E=E.filter(e=>e.id!==cur.id);save();$('#dlgD').close();render();toast('Evento eliminato')}};
$('#edit').onclick=()=>{$('#dlgD').close();openForm(cur)};

const ymd=s=>s.replace(/-/g,'');
function span(e){const s=new Date(`${e.date}T${e.time||'12:00'}`),t=new Date(s),f=x=>ymd(iso(x))+(e.time?`T${pad(x.getHours())}${pad(x.getMinutes())}00`:'');
  e.time?t.setHours(t.getHours()+1):t.setDate(t.getDate()+1);return[f(s),f(t)]}
const tx=s=>String(s||'').replace(/[,;\\]/g,'\\$&').replace(/\n/g,'\\n');
$('#ics').onclick=()=>{const e=cur,[a,b]=span(e),al=(t,d)=>`BEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:${d}\r\nTRIGGER:${t}\r\nEND:VALARM`;
  const al2=e.time?[al('-P1D','Domani'),al('-PT1H','Tra un’ora')]:[al('-PT15H','Domani'),al('PT8H','Oggi')];
  const txt=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Circolari//IT','BEGIN:VEVENT',`UID:${e.id}@circolari`,'DTSTAMP:'+new Date().toISOString().replace(/[-:]|\.\d+/g,''),
    e.time?'DTSTART:'+a:'DTSTART;VALUE=DATE:'+a,e.time?'DTEND:'+b:'DTEND;VALUE=DATE:'+b,e.type==='compleanno'?'RRULE:FREQ=YEARLY':'',
    'SUMMARY:'+tx(T[e.type][0]+' '+e.title),'DESCRIPTION:'+tx(e.notes),...al2,'END:VEVENT','END:VCALENDAR'].filter(Boolean).join('\r\n');
  dl(txt,'text/calendar','evento.ics');};
$('#gc').onclick=()=>{const e=cur,[a,b]=span(e),q=encodeURIComponent;
  open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${q(e.title)}&dates=${a}/${b}&details=${q(e.notes||'')}${e.type==='compleanno'?'&recur=RRULE:FREQ=YEARLY':''}`,'_blank')};
function dl(txt,type,name){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:type+';charset=utf-8'}));a.download=name;a.click()}

async function notify(t,b){const o={body:b,icon:'icon-192.png',badge:'icon-192.png'};
  try{const r=await navigator.serviceWorker.getRegistration();if(r)return r.showNotification(t,o)}catch{}new Notification(t,o)}
function check(){
  if(!('Notification' in window)||Notification.permission!=='granted')return;
  const now=Date.now(),t=iso(new Date());
  E.forEach(e=>{const d=nextDate(e,t);if(!d)return;const w=new Date(`${d}T${e.time||'08:00'}`).getTime();
    [[864e5,'Domani'],[36e5,'Tra un’ora']].forEach(([ms,txt])=>{
      const k=e.id+w+ms;if(now<w-ms||now>=w||sent[k])return;
      sent[k]=1;
      if((ms===864e5&&now>=w-36e5)||(ms===36e5&&!e.time))return;
      notify(`${T[e.type][0]} ${e.title}`,txt+(e.time?' alle '+e.time:''));
    });});
  localStorage.setItem('circolari-sent',JSON.stringify(sent));
}
const bell=()=>{$('#bell').textContent='Notification' in window&&Notification.permission==='granted'?'🔔':'🔕'};
$('#bell').onclick=async()=>{
  if(!('Notification' in window))return toast('Su iPhone aggiungi prima l’app alla schermata Home da Safari, poi riprova.');
  const p=await Notification.requestPermission();toast(p==='granted'?'Notifiche attive':'Notifiche non consentite');bell();check()};

$('#grid').onclick=e=>{const c=e.target.closest('[data-d]');if(c){sel=c.dataset.d;render()}};
['#day','#nextl'].forEach(s=>$(s).onclick=e=>{const i=e.target.closest('[data-id]');if(i)openDet(i.dataset.id)});
$('#chips').onclick=e=>{const b=e.target.closest('[data-f]');if(!b)return;filter=b.dataset.f;document.querySelectorAll('#chips button').forEach(x=>x.classList.toggle('on',x===b));render()};
$('#prev').onclick=()=>{view=new Date(view.getFullYear(),view.getMonth()-1,1);render()};
$('#next').onclick=()=>{view=new Date(view.getFullYear(),view.getMonth()+1,1);render()};
$('#today').onclick=()=>{view=new Date();sel=iso(view);render()};
$('#add').onclick=()=>openForm();$('#fc').onclick=()=>$('#dlgF').close();$('#dc').onclick=()=>$('#dlgD').close();
$('#exp').onclick=()=>dl(JSON.stringify(E),'application/json','circolari-backup.json');
$('#imp').onchange=async e=>{try{const d=JSON.parse(await e.target.files[0].text()),ids=new Set(E.map(x=>x.id));if(!Array.isArray(d))throw 0;
  d.forEach(x=>{if(x.id&&x.title&&x.date&&!ids.has(x.id))E.push(x)});save();render();toast('Backup ripristinato')}catch{toast('File di backup non valido')}};

if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');
setInterval(check,30000);document.addEventListener('visibilitychange',check);
bell();render();check();
