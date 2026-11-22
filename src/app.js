import {teamAuth} from './team-auth.js';
const stations = {bancada:"Peixe-Marisco",barcas:"Barcas"};
const states = ["Por preparar","Por preparar","Prontas"];
const preparationStates=[0,2];
const categories = ["Barcas","Peixe fresco","Marisco fresco","Marisco cozido","Congelados"];
const catalog = [
  {id:"bp",cat:0,name:"Barca pequena",unit:"un.",size:"50 × 17 cm",budget:50},
  {id:"bm",cat:0,name:"Barca média",unit:"un.",size:"75 × 24 cm",budget:100},
  {id:"bg",cat:0,name:"Barca grande",unit:"un.",size:"100 × 24 cm",budget:200},
  {id:"dourada",cat:1,name:"Dourada",unit:"kg"},{id:"robalo",cat:1,name:"Robalo",unit:"kg"},{id:"salmao",cat:1,name:"Salmão",unit:"kg"},{id:"linguado",cat:1,name:"Linguado",unit:"kg"},{id:"sardinha",cat:1,name:"Sardinha",unit:"kg"},
  {id:"ameijoa",cat:2,name:"Amêijoa",unit:"kg"},{id:"ostras",cat:2,name:"Ostras",unit:"dz."},{id:"lagosta",cat:2,name:"Lagosta viva",unit:"un."},{id:"mexilhao",cat:2,name:"Mexilhão",unit:"kg"},
  {id:"camarao",cat:3,name:"Camarão cozido",unit:"kg"},{id:"sapateira",cat:3,name:"Sapateira cozida",unit:"un."},{id:"lavagante",cat:3,name:"Lavagante cozido",unit:"un."},
  {id:"polvo",cat:4,name:"Polvo congelado",unit:"kg"},{id:"tigre",cat:4,name:"Camarão tigre congelado",unit:"kg"},{id:"lulas",cat:4,name:"Lulas congeladas",unit:"kg"}
];
const cuts=["Inteiro","Amanhado","Em filetes","Em postas","Em tranches"];
function lisbonDay(date=new Date()){
 return new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Lisbon",year:"numeric",month:"2-digit",day:"2-digit"}).format(date);
}
function shiftDay(day,delta){ const d=new Date(day+"T12:00:00Z"); d.setUTCDate(d.getUTCDate()+delta);return d.toISOString().slice(0,10);}
const product=id=>catalog.find(p=>p.id===id);
const group=i=>product(i.product).cat===0?"barcas":"bancada";
const label=i=>i.name||product(i.product)?.name||"Artigo";
const unit=i=>i.unit||product(i.product)?.unit||"";
const fmtQty=n=>Number(n).toLocaleString("pt-PT",{maximumFractionDigits:2});
const code=id=>refs.get(id)||String(id);
const globalState=o=>Object.values(o.tasks).every(v=>v===2)?2:0;
const typeName=o=>o.type==="restaurante"?"Restaurante":"Particular";
function lineDescription(i){
 const p=product(i.product);
 if(p.cat===0)return [i.people+" pessoas",i.use,fmtQty(i.budget)+" € de marisco"].join(" · ");
 if(i.measure==="pieces")return [fmtQty(i.qty)+" peças",fmtQty(i.weight)+" kg por peça",i.cut,i.note].filter(Boolean).join(" · ");
 return [fmtQty(i.qty)+" "+unit(i),i.cut,i.note].filter(Boolean).join(" · ");
}

const paths={
 columns:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16m6-16v16"/>',
 list:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6m-6 4h6m-6 4h4"/>',
 store:'<path d="m3 9 2-5h14l2 5m-17 1v10h16V10M3 9v1a3 3 0 0 0 5 2 3 3 0 0 0 4 0 3 3 0 0 0 4 0 3 3 0 0 0 5-2V9ZM9 20v-5h5v5"/>',
 plus:'<path d="M12 5v14m-7-7h14"/>', expand:'<path d="M8 4H4v4m12-4h4v4M4 16v4h4m8 0h4v-4"/>',
 shrink:'<path d="M4 8h4V4m12 4h-4V4M4 16h4v4m12-4h-4v4"/>',calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>', check:'<path d="m5 12 4 4L19 6"/>',
 circle:'<circle cx="12" cy="12" r="8"/>', checked:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
 boat:'<path d="m3 15 9 3 9-3-2 4H5ZM6 14l3-6h6l3 6m-8-6V5h4v3"/>', fish:'<path d="M3 12s5-6 10-6c3 0 5 3 6 5l3-3v8l-3-3c-2 3-4 5-7 5-5 0-9-6-9-6Z"/><path d="M13 7q-3 5 0 10"/><circle cx="8" cy="11" r=".6"/>',
 user:'<circle cx="12" cy="8" r="3.4"/><path d="M5 20v-2a7 7 0 0 1 14 0v2"/>',
 shop:'<path d="M4 9h16l-2-5H6ZM5 9v11h14V9m-9 11v-6h5v6"/>',
 truck:'<path d="M2 5h12v11H2Zm12 4h4l4 4v3h-8"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
 search:'<circle cx="10.7" cy="10.7" r="6.7"/><path d="m16 16 4 4"/>', filter:'<path d="M3 6h18M6 12h12m-8 6h4"/>', close:'<path d="m6 6 12 12M6 18 18 6"/>',chev:'<path d="m7 10 5 5 5-5"/>',right:'<path d="m9 6 6 6-6 6"/>', flag:'<path d="M5 21V4m0 1c5-4 9 4 14 0v9c-5 4-9-4-14 0"/>',play:'<path d="m8 5 10 7-10 7Z"/>',
 note:'<path d="M5 3h14v13l-5 5H5Zm9 18v-5h5M8 8h8m-8 4h6"/>', detail:'<path d="M4 12s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6Z"/><circle cx="12" cy="12" r="2"/>', bando:'<path d="m3 7 9-4 9 4-9 4Zm1 4v6l8 4 8-4v-6m-8 0v10"/>',
 fork:'<path d="M5 3v6m3-6v6m3-6v6c0 3-6 3-6 0m3 3v9m10 0V3c-4 2-4 7-4 10h4"/>',users:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2m0-16a3 3 0 0 1 0 6m2 3a5 5 0 0 1 4 5v2"/>',
 snow:'<path d="M12 2v20M3 7l18 10M3 17 21 7M9 4l3 3 3-3m-6 16 3-3 3 3"/>',
 waves:'<path d="M2 7q3 3 6 0 3 3 6 0 3 3 8 0M2 12q3 3 6 0 3 3 6 0 3 3 8 0M2 17q3 3 6 0 3 3 6 0 3 3 8 0"/>',
 bag:'<rect x="4" y="7" width="16" height="14" rx="2"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>',minus:'<path d="M5 12h14"/>',trash:'<path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15m-8 4v7m4-7v7"/>',pin:'<path d="M19 9c0 5-7 12-7 12S5 14 5 9a7 7 0 0 1 14 0Z"/><circle cx="12" cy="9" r="2"/>', info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-9v1"/>',refresh:'<path d="M3 10a9 9 0 0 1 15-5l3 3m0-5v5h-5M21 14a9 9 0 0 1-15 5l-3-3m0 5v-5h5"/>',pot:'<path d="M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Zm-2 2h2m16 0h2M5 8h14m-9-3h4"/>'
};
const icon=(name,size=18)=>'<svg class="ico" aria-hidden="true" width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">'+(paths[name]||'')+'</svg>';
document.querySelectorAll("[data-icon]").forEach(el=>el.replaceWith(new DOMParser().parseFromString(icon(el.dataset.icon),"image/svg+xml").documentElement));


const $=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const cls=["wait","work","ready"];
const categoryIcons=["boat","fish","waves","pot","snow"];
const dayNow=()=>lisbonDay();
let page="encomendas",station="bancada",day=dayNow(),orders=[],loaded=false,synced=false,loading=false,serial=0;
let syncError=false;let filter="all",listState="all",focusMode=false,detailId=null,busy=false,dialogMode="",draft=null;
let savingId=null,saveMessage="";
try{station=localStorage.getItem("ddm-posto")==="barcas"?"barcas":"bancada";focusMode=localStorage.getItem("ddm-modo-posto")==="true";}catch{}
const dialog=$("#dialog"),panel=$("#dialogContent"),main=$("#main");
const dateText=(d,opts)=>new Intl.DateTimeFormat("pt-PT",opts).format(new Date(d+"T12:00:00Z"));
const findOrder=id=>orders.find(o=>o.id===id);
const byTime=(a,b)=>Number(b.priority)-Number(a.priority)||a.time.localeCompare(b.time)||a.id.localeCompare(b.id);
const fullDate=d=>dateText(d,{weekday:"long",day:"numeric",month:"long",year:"numeric"});
function notice(msg){const t=$("#toast");t.textContent=msg;t.classList.add("on");clearTimeout(notice.timer);notice.timer=setTimeout(()=>t.classList.remove("on"),4200);}
const base="https://c--1d4e2f3e-c086-4293-8fd9-9ee55c295b01-prod.lovable.cloud", publicKey="sb_publishable_dt7LHmnqzFD-dD54yp77GA_YIya6oQJ";

const refs=new Map(), rawOrders=new Map();
const catKeys=["barcas","peixe_fresco","marisco_fresco","marisco_cozido","congelados"];
const statusKeys=["por_iniciar","em_preparacao","pronta"];
const unitKeys={"un.":"un","dz.":"dz","kg":"kg"};
let teamSession=null,sessionEpoch=0;
function showSession(next){
 const previous=teamSession?.user.id;
 teamSession=next;
 document.body.classList.toggle("session-locked",!next);
 $("#loginPanel").hidden=!!next;$("#signOut").hidden=!next;
 if(previous===next?.user.id)return;
 sessionEpoch++;serial++;fetchDay=null;orders=[];rawOrders.clear();refs.clear();loaded=false;synced=false;networkProblem=false;
 drafts.clear();draft=null;quick=null;qEntry=null;detailId=null;saveMessage="";savingId=null;clearUndo();lastSync=0;
 if(dialog.open)dialog.close();panel.replaceChildren();main.replaceChildren();
 $("#networkStatus").hidden=true;$("#writeStatus").textContent="";$("#toast").classList.remove("on");
 if(next)route();
}
async function rest(path,payload){
 const epoch=sessionEpoch,token=teamSession?.access_token;
 if(!token)throw Error("Inicia sessão.");
 let r,text;try{r=await fetch(base+"/rest/v1/"+path,{signal:AbortSignal.timeout(8000),method:payload?"POST":"GET",headers:{apikey:publicKey,Authorization:"Bearer "+token,"Content-Type":"application/json"},body:payload?JSON.stringify(payload):undefined,cache:"no-store"});text=await r.text();}catch{throw Error("Sem ligação à demo. Verifica a ligação à internet e tenta novamente.");}
 if(epoch!==sessionEpoch)throw Error("Inicia sessão.");
 if(r.status===401){auth.reject(token);throw Error("Inicia sessão.");}
 let j=null;if(text){try{j=JSON.parse(text);}catch{}}
 if(!r.ok&&path==="rpc/create_order"&&j?.code&&j.code!=="P0001")throw Error("Não foi possível registar a encomenda. Confirme os dados e tente novamente.");
 if(!r.ok)throw Object.assign(Error(j?.message||"O servidor não respondeu como esperado (erro "+r.status+"). Tenta novamente."),{status:r.status});
 if(text&&j===null)throw Error("Resposta inesperada do servidor. Tenta novamente.");
 return j??{};
}
function convertRow(o){
 const id=o.id;refs.set(id,o.ref);rawOrders.set(id,o);
 const tasks=Object.fromEntries(o.station_tasks.map(t=>[t.station,statusKeys.indexOf(t.status)]));
 const items=o.order_items.sort((a,b)=>a.position-b.position).map((i,k)=>{
 let p=catalog.find(p=>p.name===i.product&&catKeys[p.cat]===i.category);
 if(!p){p={id:"custom-"+i.category+"-"+i.product,cat:catKeys.indexOf(i.category),name:i.product,unit:{"kg":"kg","un":"un.","dz":"dz."}[i.unit]||"un."};catalog.push(p);}
 return {product:p.id,line:k+1,qty:Number(i.quantity||1),unit:({kg:"kg",un:"un.",dz:"dz."})[i.unit]||i.unit,note:i.notes||"",people:i.people,size:p.size||i.barca_size||"",use:i.meal_type==="petisco"?"Petisco":"Refeição",budget:i.budget,cut:i.cut?i.cut[0].toUpperCase()+i.cut.slice(1):"",done:tasks[catKeys[p.cat]==="barcas"?"barcas":"bancada"]===2};});
 return {id,revision:o.history_version??0,cancelled:o.status==="cancelada",phone:normalizedPhone(o.customer_phone||o.notes?.match(/(?:^|\n)Contacto: ([^\n]+)/)?.[1]),avoid:o.shellfish_avoid||[],liked:o.shellfish_preferred||[],occasion:o.occasion,occasionOther:o.occasion_other,party:o.party_size,reason:o.cancel_reason,version:o.station_tasks.reduce((s,t)=>s+t.version,0),name:o.customer_name,type:o.customer_type,day:o.business_date,time:o.scheduled_time.slice(0,5),delivery:o.fulfilment==="entrega"?"Entrega":"Levantamento",address:o.address,priority:o.priority!=="normal",note:o.notes,channel:o.source==="cliente"?"Cliente":"Equipa",handed:o.status==="entregue",items,tasks};
}
async function readOne(uuid){const rows=await rest("orders?select=*,station_tasks(*),order_items(*)&id=eq."+encodeURIComponent(uuid));return convertRow(rows[0]);}
// O formulário rápido da equipa não tem estes campos. Omiti-los mantém o formato antigo da RPC,
// que continua a aceitar encomendas sem ocasião, pessoas nem marisco.
function questionnaireFields(data){
 const phone=normalizedPhone(data.phone);
 if(data.party===undefined)return phone?{customer_phone:phone}:{};
 return {customer_phone:phone,party_size:Number(data.party),occasion:data.occasion,occasion_other:data.occasion==="outro"?data.occasionOther.trim():null,shellfish_preferred:preferences(data,"liked"),shellfish_avoid:preferences(data,"avoid")};
}
async function onlineRequest(url,data){
 if(!data){
  const day=new URL(url,"https://demo.invalid").searchParams.get("day");
  return {orders:(await rest("orders?select=*,station_tasks(*),order_items(*)&business_date=eq."+encodeURIComponent(day))).map(convertRow)};
 }
 if(url==="/api/orders"){
  // A RPC antiga aceita chaves desconhecidas. Confirmar a coluna antes de enviar
  // para não perder o contacto ou o marisco a evitar numa pré-visualização antiga.
  if(!Array.from(rawOrders.values()).some(o=>Object.hasOwn(o,"shellfish_avoid"))){
   try{await rest("orders?select=shellfish_avoid&limit=0");}
   catch(e){if(e.status===400)throw Error("O questionário aguarda a atualização da base de dados.");throw e;}
  }
  const r=await rest("rpc/create_order",{payload:{customer_name:data.name.trim(),customer_type:data.type,fulfilment:data.delivery==="Entrega"?"entrega":"recolha",address:data.delivery==="Entrega"?data.address:"",scheduled_time:data.time,business_date:data.day,source:data.channel==="Cliente"?"cliente":"equipa",priority:data.priority?"alta":"normal",notes:data.note,...questionnaireFields(data),client_token:data.requestKey,items:data.items.map(i=>{const p=product(i.product);return {category:catKeys[p.cat],product:label(i),quantity:i.measure==="pieces"?Number((i.qty*i.weight).toFixed(2)):i.qty,unit:unitKeys[p.unit],cut:p.cat===1?i.cut.toLowerCase():null,barca_size:p.cat===0?({bp:"pequena",bm:"media",bg:"grande"}[i.product]):null,meal_type:p.cat===0?(i.use==="Petisco"?"petisco":"refeicao"):null,people:p.cat===0?i.people:null,budget:p.cat===0?i.budget:null,notes:i.measure==="pieces"?[fmtQty(i.qty)+" peças · cerca de "+fmtQty(i.weight)+" kg por peça",i.note].filter(Boolean).join("\n"):i.note};})}});
  return {order:await readOne(r.id)};
 }
 const row=rawOrders.get(url.split("/").at(-1));if(!row)throw Error("Encomenda indisponível.");
 if(["handoff","undo","cancel","reopen"].includes(data.action)){
  await rest("rpc/change_order_status",{p_order_id:row.id,p_action:data.action,p_station:station,p_version:data.revision,p_reason:data.reason||null});
 }
 else{
 if(data.version!==row.station_tasks.reduce((sum,t)=>sum+t.version,0))throw Object.assign(Error("Outro posto alterou a encomenda. Confirma o novo estado."),{status:409});
 const t=row.station_tasks.find(t=>t.station===data.station);const patch={};
 if(!t)throw Error("Posto indisponível.");
 if(data.action==="advance"||data.action==="back"){
 patch.status=data.action==="advance"?"pronta":"por_iniciar";patch.device_station=station;
 }else throw Error("Ação indisponível.");
 await rest("rpc/update_task",{p_task_id:t.id,p_expected_version:t.version,p_patch:patch});
 }
 return {order:await readOne(row.id)};
}

async function request(url,data){
 if(data&&!synced)throw Error("Sem ligação à base de dados. Volta a ligar antes de confirmar.");
 return onlineRequest(url,data);
}
function route(){
 if(!teamSession)return;
 const [raw,param]=location.hash.slice(1).split("/");page=["cliente","historico"].includes(raw)?raw:"encomendas";
 if(page==="encomendas"){
  if(Object.hasOwn(stations,param)){
   station=param;
   try{localStorage.setItem("ddm-posto",station);}catch{}
  }else{
   try{station=localStorage.getItem("ddm-posto")==="barcas"?"barcas":"bancada";}catch{}
  }
  try{focusMode=localStorage.getItem("ddm-modo-posto")==="true";}catch{}
  if(raw==="preparacao")history.replaceState(null,"","#encomendas/"+station);
 }else{focusMode=false;}
 filter="all";
 document.body.classList.toggle("focus",focusMode);if(dialog.open)dialog.close();render();sync();if(page==="cliente")startOrder();
}
function selectStation(s){
 if(!Object.hasOwn(stations,s))return;station=s;try{localStorage.setItem("ddm-posto",s)}catch{}
 history.replaceState(null,"","#encomendas/"+s);filter="all";render();
}

let lastSync=0,fetchDay=null,networkProblem=false;
async function sync(){
 if(busy||!teamSession)return;
 const selected=day;if(fetchDay===selected)return;fetchDay=selected;
 const current=++serial;
 try{
 const data=await request("/api/orders?day="+encodeURIComponent(selected));if(current!==serial||day!==selected)return;
 const changed=JSON.stringify(orders)!==JSON.stringify(data.orders)||!synced;
 orders=data.orders;loaded=true;synced=true;networkProblem=false;lastSync=Date.now();
 if(changed){if(!$("#orderDay")?.matches(":focus"))render();else rerenderResults();if(dialog.open&&dialogMode==="detail"&&!busy)drawDetail();}
 }catch{if(current!==serial||day!==selected)return;synced=false;networkProblem=true;if(!loaded)render();}
 finally{if(fetchDay===selected)fetchDay=null;renderSync();}
}
function renderSync(){
 if(!teamSession)return;
 refreshDeadlines();
 document.querySelectorAll(".sync").forEach(el=>{el.classList.toggle("off",!synced);el.innerHTML=`<span></span>${synced?"Ligado":networkProblem?"Sem ligação":"A ligar"}`;el.title=lastSync?"Última leitura às "+new Date(lastSync).toLocaleTimeString("pt-PT",{timeZone:"Europe/Lisbon"}):"Ligação à base de dados da equipa";});
 const b=document.getElementById("networkStatus");
 b.hidden=!networkProblem;b.querySelector("span").textContent=lastSync?"Sem ligação. A última leitura foi às "+new Date(lastSync).toLocaleTimeString("pt-PT")+". Volta a ligar para guardar alterações.":"Não foi possível carregar as encomendas da equipa. Verifica a ligação e tenta novamente.";
 document.querySelectorAll("[data-advance],[data-task],[data-handoff],[data-confirm],[data-quick-undo],#historyConfirm button[type=submit]").forEach(el=>{el.disabled=busy||!synced;});
 document.querySelectorAll("[data-saving]").forEach(el=>{el.textContent=el.dataset.saving===savingId?saveMessage:"";});
 const status=$("#writeStatus");status.textContent=saveMessage;
}
const button=(name,text,act,extra="")=>`<button type="button" class="btn ${extra}" data-act="${act}">${name?icon(name):""}${text}</button>`;
function header(){
 const client=page==="cliente",list=page==="historico";
 const title=client?"Cliente":list?"Histórico":stations[station];
 return `<div class="pagehead station-header"><h1>${title}</h1><div class="header-date">${icon("calendar",30)}<span data-today></span></div><div class="header-clock" aria-label="Hora atual em Lisboa">${icon("clock",34)}<time data-clock></time></div><div class="head-actions"><span class="sync" role="status"></span>${!client&&!list?`<button class="btn square" title="${focusMode?"Sair do modo posto":"Modo posto em ecrã inteiro"}" aria-label="${focusMode?"Sair do modo posto":"Modo posto em ecrã inteiro"}" data-act="focus">${icon(focusMode?"shrink":"expand",30)}</button>`:""}${client?"":`<button type="button" class="btn primary new-plus" data-act="new" aria-label="Nova encomenda" title="Nova encomenda">${icon("plus",40)}</button>`}</div></div>`;
}
function updateClock(){
 const now=new Date();
 const date=new Intl.DateTimeFormat("pt-PT",{timeZone:"Europe/Lisbon",weekday:"long",day:"numeric",month:"long"}).format(now);
 document.querySelectorAll("[data-today]").forEach(el=>{el.textContent=date.charAt(0).toUpperCase()+date.slice(1);});
 document.querySelectorAll("[data-clock]").forEach(el=>{el.textContent=new Intl.DateTimeFormat("pt-PT",{timeZone:"Europe/Lisbon",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(now);el.dateTime=now.toISOString();});
}
function stationCards(){return `<div class="stations" aria-label="Selecionar posto">${Object.entries(stations).map(([k,title],i)=>`<button data-station="${k}" class="station ${k} ${station===k?"selected":""}" aria-pressed="${station===k}">
<div class="station-art" aria-hidden="true"></div><div class="station-copy"><span class="station-num"><span class="tiny-rule"></span>POSTO 0${i+1}</span><strong>${title}</strong><span class="station-desc">${k==="barcas"?"Preparação das barcas":"Peixe, marisco e congelados"}</span></div><span class="station-state">${station===k?icon("check",13):""}</span></button>`).join("")}</div>`;}
function statusPill(n){return `<span class="status-pill ${cls[n===2?2:0]}"><b></b>${n===2?"Pronta":"Por preparar"}</span>`;}
const modeIcon=o=>o.delivery==="Entrega"?"truck":"shop";
function datePicker(){const text=day===dayNow()?"Hoje":day===shiftDay(dayNow(),1)?"Amanhã":dateText(day,{day:"2-digit",month:"short"});return `<label class="date-pick" title="Escolher dia">${icon("calendar",16)}${esc(text)}${icon("chev",13)}<input type="date" id="orderDay" aria-label="Dia das encomendas" value="${esc(day)}"></label>`;}
function toolbar(total){
 const queue=page==="encomendas";
 const filters=["Todas",...preparationStates.map(n=>states[n])].map((label,index)=>{
  const value=index===0?"all":statusKeys[preparationStates[index-1]];
  return `<button class="btn" data-filter="${value}" aria-pressed="${filter===value}">${label}</button>`;
 }).join("");
 return `<div class="queuehead"><div class="queue-title"><h2>${queue?"Fila de preparação":"Histórico"}</h2><span class="total">${total}</span></div><div class="tools">${datePicker()}</div></div>${queue?`<div class="queue-filters" role="group" aria-label="Estado da preparação">${filters}</div>`:""}`;
}
const handoffLabel=o=>o.delivery==="Entrega"?"Confirmar entrega":"Confirmar levantamento";
function contactActions(o){
 const dial=o.phone?`<a class="btn" href="tel:${esc(o.phone)}">Ligar</a>`:"";
 return `${o.avoid.length?`<p class="avoid-note"><strong>Marisco a evitar</strong> · ${esc(o.avoid.join(", "))}</p>`:""}
 <div class="contact-actions" data-contact-order="${o.id}"><strong hidden>Atrasada</strong>${dial}</div>`;
}
function refreshDeadlines(){
 const now=new Date();
 const today=lisbonDay(now),hour=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Lisbon",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(now);
 document.querySelectorAll("[data-contact-order]").forEach(el=>{
  const o=findOrder(el.dataset.contactOrder);
  const late=o&&!o.handed&&!o.cancelled&&(o.day<today||(o.day===today&&o.time<hour));
  el.classList.toggle("late",Boolean(late));el.querySelector("strong").hidden=!late;
  const a=el.querySelector("a");if(a)a.textContent=late?"Ligar ao cliente":"Ligar";
 });
}
function orderCard(o,n){
 const lines=o.items.filter(i=>group(i)===station);
 const other=station==="barcas"?"bancada":"barcas";
 return `<article class="ticket ${cls[n]} ${station}-ticket" data-order="${o.id}" aria-label="${esc(code(o.id)+" · "+o.name)}"><div class="ticket-top"><button class="ref" data-detail="${o.id}" aria-label="Abrir ${esc(code(o.id))}">${esc(code(o.id))}</button>${o.priority?`<span class="priority">${icon("flag",13)}Prioritária</span>`:""}${o.tasks[other]!==undefined?`<span class="mixed">Dois postos</span>`:""}</div>
 <button class="ticket-customer" data-detail="${o.id}"><strong>${esc(o.name)}</strong><small>${typeName(o)}</small></button>
 <div class="ticket-deadline"><strong>${esc(o.time)}</strong><span>${icon(modeIcon(o),18)}${esc(o.delivery)}</span></div>
 <div class="ticket-products">${lines.map(i=>station==="barcas"?`<div class="ticket-product"><h4>${esc(label(i))}${i.qty>1?` × ${fmtQty(i.qty)}`:""}</h4><div class="boat-spec"><strong>${esc(i.people)} pessoas</strong><span>${esc(i.size||product(i.product)?.size||"")}</span></div><p>${esc(i.use)} · ${fmtQty(i.budget)} € de marisco</p>${i.note?`<p class="product-note">${esc(i.note)}</p>`:""}</div>`:`<div class="ticket-product"><div class="product-heading"><h4>${esc(label(i))}</h4><strong class="product-quantity">${fmtQty(i.qty)} <span>${esc(unit(i))}</span></strong></div><p class="product-cut">Corte: <strong>${esc(i.cut||"Não indicado")}</strong></p>${i.note?`<p class="product-note">${esc(i.note)}</p>`:""}</div>`).join("")}</div>
 ${contactActions(o)}
 ${o.note?`<p class="ticket-note">${esc(o.note)}</p>`:""}
 ${n<2?`<button class="ticket-action primary" data-advance="${o.id}">Pronta</button>`:""}
 ${n===2?`<p class="completion">${icon("check",18)} ${station==="barcas"?"Barcas concluídas":"Preparação concluída"}</p>${globalState(o)===2?`<button class="ticket-action primary" data-handoff="${o.id}">${handoffLabel(o)}</button>`:`<p class="awaiting">A aguardar ${other==="barcas"?"as Barcas":"Peixe-Marisco"}</p>`}`:""}
 ${o.tasks[other]!==undefined&&n!==2?`<p class="other-station">${stations[other]}: ${states[o.tasks[other]]}</p>`:""}
 <p class="card-save" data-saving="${o.id}"></p></article>`;
}
function empty(text){return `<div class="empty">${icon("bando",24)}<span>${text}</span></div>`;}
function boardContent(){
 const shown=orders.filter(o=>!o.cancelled && !o.handed && o.tasks[station]!==undefined).sort(byTime);
 const lanes=preparationStates.map(n=>{
  const title=states[n];
  const excluded=filter!=="all" && filter!==statusKeys[n];
  const row=excluded?[]:shown.filter(o=>n===2?o.tasks[station]===2:o.tasks[station]!==2);
  let message="Sem encomendas";
  if(!loaded)message=networkProblem?"Sem ligação. Verifica a ligação à internet.":"A ligar ao posto…";
  if(excluded)message="Fora do filtro";
  return `<section class="lane ${cls[n]}${excluded?" filtered-out":""}">
   <div class="lane-head"><div><span class="state-dot"></span><h3>${title}</h3></div><span class="lane-count">${row.length}</span></div>
   <div class="lane-body">${row.map(o=>orderCard(o,n)).join("")||empty(message)}</div>
  </section>`;
 });
 return `<div class="board">${lanes.join("")}</div>`;
}
function listContent(){
 const stateKey=o=>o.cancelled?"cancelada":o.handed?"entregue":statusKeys[globalState(o)];
 const items=orders.filter(o=>listState==="all"||listState===stateKey(o)).sort(byTime);
 return `<div class="list-tabs">${[["all","Todas"],...preparationStates.map(n=>[statusKeys[n],states[n]]),["entregue","Entregues"],["cancelada","Canceladas"]].map(([key,t])=>`<button data-list="${key}" aria-pressed="${key===listState}" class="${key===listState?"active":""}">${t}</button>`).join("")}</div><div class="order-table"><div class="table-row table-head"><span>Encomenda</span><span>Cliente</span><span>Hora prevista</span><span>Postos</span><span>Estado</span></div>${items.map(o=>`<button data-detail="${o.id}" class="table-row"><strong>${code(o.id)}</strong><span>${esc(o.name)}<small>${typeName(o)}</small></span><span>${esc(o.time)}<small>${esc(o.delivery)}</small></span><span>${Object.keys(o.tasks).map(k=>stations[k]).join(" + ")}</span><span>${o.cancelled?"Cancelada":o.handed?`<span class="delivered">${icon("check",14)} Entregue</span>`:statusPill(globalState(o))}</span></button>`).join("")||empty("Sem encomendas para estes critérios.")}</div>`;
}
function clientContent(){return `<section class="client-intro"><div><h2>Faça a sua encomenda</h2><p>Escolha uma barca, peixe ou marisco para levantar na loja ou receber por entrega.</p>${button("bag","Começar encomenda","new","primary")}</div></section>`;}
function render(){
 if(!teamSession)return;
 document.title=(page==="encomendas"?"Encomendas":page==="cliente"?"Cliente":"Histórico")+" · Delicias do Mar";
 document.querySelectorAll("[data-nav]").forEach(a=>{a.classList.toggle("active",a.dataset.nav===page);if(a.dataset.nav===page)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");});
 const total=page==="encomendas"?orders.filter(o=>!o.cancelled&&!o.handed&&o.tasks[station]!==undefined).length:orders.length;
 main.innerHTML=header()+(page==="cliente"?clientContent():(page==="encomendas"?stationCards():"")+toolbar(total)+`<div id="results">${page==="encomendas"?boardContent():listContent()}</div>`)+`<footer><span>Delicias do Mar <b>·</b> Loulé</span><span>${icon("waves",19)} Central de encomendas</span></footer>`;
 updateClock();renderSync();
}
function rerenderResults(){const el=$("#results");if(el)el.innerHTML=page==="encomendas"?boardContent():listContent();renderSync();}
function setDay(d){if(!d||d===day)return;day=d;orders=[];loaded=false;synced=false;render();sync();}
function updateOrder(o){if(o.day!==day)return;const i=orders.findIndex(x=>x.id===o.id);if(i<0)orders.push(o);else if(orders[i].version<=o.version)orders[i]=o;}
async function mutate(o,action,extra={}){
 if(busy||!o||(o.handed&&action!=="undo")||(o.cancelled&&action!=="reopen"))return;
 const target=extra.station||station;
 if(action==="handoff"&&globalState(o)!==2)return;
 busy=true;savingId=o.id;saveMessage="A guardar…";++serial;renderSync();
 try{
 const send=version=>request("/api/orders/"+o.id,{version,revision:o.revision,action,station:target,...extra});
 let result;
 try{result=await send(o.version);}catch(error){
  if(error.status!==409||!["back","advance"].includes(action))throw error;
  const fresh=(await request("/api/orders?day="+encodeURIComponent(o.day))).orders.find(x=>x.id===o.id);
  const signature=x=>JSON.stringify([x.tasks[target],x.items.filter(i=>group(i)===target)]);
  if(!fresh||fresh.handed||fresh.cancelled||signature(fresh)!==signature(o))throw error;
  result=await send(fresh.version);
 }
 const {order}=result;
 ++serial;updateOrder(order);synced=true;networkProblem=false;lastSync=Date.now();saveMessage="Alteração guardada.";render();if(dialog.open&&dialogMode==="detail")drawDetail();
 if(action==="advance")notice("Preparação concluída.");
 if(action==="handoff"){
  if(dialog.open)dialog.close();
  offerUndo(order);
 }
 if(action==="undo"){clearUndo();notice("A encomenda voltou a Pronta.");}
 if(action==="cancel")notice("Encomenda cancelada.");
 if(action==="reopen")notice("Encomenda reaberta.");
 }catch(e){saveMessage="Não foi possível confirmar. A atualizar o estado…";notice(e.message||"Não foi possível guardar.");busy=false;await sync();if(dialog.open&&dialogMode==="detail")drawDetail();saveMessage="Confirma o estado antes de tentar novamente.";}
 finally{busy=false;renderSync();}
}
function openDialog(mode){dialogMode=mode;dialog.classList.toggle("form-dialog",mode==="order");if(!dialog.open)dialog.showModal();dialog.scrollTop=0;}
const modalHead=(eyebrow,title)=>`<div class="modal-head"><div><div class="kicker">${eyebrow}</div><h2 id="dialog-title">${title}</h2></div><button class="close" type="button" data-act="close" aria-label="Fechar">${icon("close",20)}</button></div>`;
const undoLabel=o=>o.delivery==="Entrega"?"Desfazer entrega":"Desfazer levantamento";
let undoOrder=null,undoTimer,undoUntil=0;
function clearUndo(){
 clearTimeout(undoTimer);undoOrder=null;$("#undoNotice").hidden=true;
}
function offerUndo(o){
 clearUndo();undoOrder=o;undoUntil=Date.now()+8000;
 const box=$("#undoNotice");
 box.querySelector("span").textContent=o.delivery==="Entrega"?"Entrega confirmada.":"Levantamento confirmado.";
 box.hidden=false;undoTimer=setTimeout(clearUndo,8000);
}
let confirmOrder=null;
function confirmHistory(o,action){
 confirmOrder=o;openDialog("confirm");
 const cancel=action==="cancel";
 panel.innerHTML=modalHead(esc(code(o.id)),cancel?"Cancelar encomenda":undoLabel(o))+`<form class="modal-body" id="historyConfirm" data-action="${action}">
 <p>${esc(o.name)} · ${esc(o.time)}</p>
 ${cancel?`<label class="field"><span id="reasonLabel">Motivo</span><select id="cancelReason" aria-labelledby="reasonLabel" required><option value="">Escolher motivo</option><option>Pedido do cliente</option><option>Artigo indisponível</option><option>Encomenda duplicada</option><option>Outro</option></select></label><label class="field" id="otherReason" hidden>Qual é o motivo?<input maxlength="200"></label>`:"<p>A encomenda voltará à fila de prontas.</p>"}
 <div class="history-actions"><button type="button" class="btn" data-detail="${o.id}">Voltar</button><button type="submit" class="btn primary">${cancel?"Confirmar cancelamento":"Confirmar"}</button></div></form>`;
 renderSync();
}
function openDetail(id){detailId=id;openDialog("detail");drawDetail();}
function workControls(o,s){
 const n=o.tasks[s];
 return `<div class="task-head"><h3>${icon(s==="barcas"?"boat":"fish")} ${stations[s]}</h3>${statusPill(n)}</div>
 <div class="task-lines">${o.items.filter(i=>group(i)===s).map(i=>`<div class="task-line">${icon(n===2?"checked":s==="barcas"?"boat":"fish",18)}<div><strong>${esc(label(i))}${i.qty>1&&s==="barcas"?" × "+fmtQty(i.qty):""}</strong><small>${esc(lineDescription(i))}${s==="barcas"&&i.note?" · "+esc(i.note):""}</small></div></div>`).join("")}</div>
 ${o.handed||o.cancelled?"":`<div class="task-btns">${n===2?`<button class="btn minor" data-task="back" data-s="${s}">Reabrir preparação</button>`:""}${n<2?`<button class="btn dark" data-task="advance" data-s="${s}">${icon("check",15)}Pronta</button>`:""}</div>`}`;
}
function drawDetail(){
 const o=findOrder(detailId);if(!o)return;
 const pos=dialog.scrollTop;
 const state=o.cancelled?"Cancelada":o.handed?"Entregue":globalState(o)===2?"Pronta para entrega":"Por preparar";
 panel.innerHTML=modalHead(`${code(o.id)} · ${esc(o.channel)}`,esc(o.name))+`<div class="modal-body"><div class="detail-info"><span>${icon("calendar",16)}${dateText(o.day,{day:"numeric",month:"short"})} · ${esc(o.time)}</span><span>${icon(modeIcon(o),16)}${esc(o.delivery)}</span><span>${icon("user",16)}${typeName(o)}</span></div>
 ${o.address?`<p class="detail-contact">${esc(o.address)}</p>`:""}${o.note?`<div class="note">${icon("note",17)}<div><strong>Notas de preparação</strong><p>${esc(o.note)}</p></div></div>`:""}
 ${contactActions(o)}
 ${o.party?`<p>${esc(o.party)} pessoas · ${esc(occasions[o.occasion]||"")} ${esc(o.occasionOther||"")}</p>`:""}
 ${o.liked.length?`<p>Marisco preferido: ${esc(o.liked.join(", "))}</p>`:""}
 ${Object.keys(o.tasks).sort((a,b)=>a===station?-1:b===station?1:0).map(s=>`<section class="task">${workControls(o,s)}</section>`).join("")}
 <div class="global"><div><small>Estado da encomenda completa</small><strong>${state}</strong></div>${globalState(o)===2&&!o.handed&&!o.cancelled?`<button class="btn primary" data-task="handoff">${icon("bag",16)} ${handoffLabel(o)}</button>`:""}</div>
 ${o.cancelled?`<p>Motivo: ${esc(o.reason)}</p>`:""}
 <div class="history-actions">${o.cancelled?'<button class="btn" data-task="reopen">Reabrir</button>':o.handed?`<button class="btn" data-confirm="undo">${undoLabel(o)}</button>`:'<button class="btn" data-confirm="cancel">Cancelar encomenda</button>'}</div></div>`;
 dialog.scrollTop=pos;
 renderSync();
}

const mkKey=()=>globalThis.crypto?.randomUUID?.()||"demo-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2);

const occasions={refeicao:"Refeição",evento:"Evento",petisco:"Petisco",outro:"Outro"};
const capacities={bp:3,bm:6,bg:10};
const steps=["Pessoas","Ocasião","Marisco","Artigos","Contacto e horário","Resumo"];
const stepTitles=["Quantas pessoas são?","Qual é a ocasião?","Que marisco prefere?","O que vai levar?","Quando e como quer receber a encomenda?","Está tudo certo?"];
const drafts=new Map();
let draftScope="",draftStep=1,hadFormError="";
const keyFor=scope=>"ddm-questionario-2-"+teamSession.user.id+"-"+scope;
function persistDraft(){
 if(!draft)return;
 const snapshot={draft,step:draftStep};
 drafts.set(draftScope,snapshot);
 try{localStorage.setItem(keyFor(draftScope),JSON.stringify(snapshot));}catch{}
}
function startOrder(){
 if(!teamSession)return;
 const scope="Cliente";
 let saved=drafts.get(scope);
 try{
  const oldKey="ddm-questionario-1-"+scope;
  const legacy=localStorage.getItem(oldKey);
  if(legacy&&!localStorage.getItem(keyFor(scope))){localStorage.setItem(keyFor(scope),legacy);localStorage.removeItem(oldKey);}
  saved=JSON.parse(localStorage.getItem(keyFor(scope)));
 }catch{}
 const t=new Date(Date.now()+3600000);
 draftScope=scope;draftStep=saved?.step||1;hadFormError="";
 draft=saved?.draft||{channel:scope,requestKey:mkKey(),party:1,occasion:"",occasionOther:"",liked:[],avoid:[],likedText:"",avoidText:"",
  boatChoice:"auto",boatCount:1,boatUse:"",itemCategory:1,items:[],name:"",type:"particular",phone:"",delivery:"Levantamento",address:"",
  day:day>lisbonDay(t)?day:lisbonDay(t),time:new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Lisbon",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(t),note:"",priority:false};
 for(const item of draft.items){
  if(item.catalogEntry&&!product(item.product))catalog.push(item.catalogEntry);
 }
 openDialog("order");drawForm();
}
function normalizedPhone(value){
 const digits=String(value??"").replace(/[\s()-]/g,"");
 if(/^[0-9]{9}$/.test(digits))return "+351"+digits;
 return /^\+[1-9][0-9]{7,14}$/.test(digits)?digits:"";
}
const preferences=(o,k)=>[...o[k],o[k+"Text"].trim()].filter(Boolean);
function suggestion(){
 const count=Math.ceil(draft.party/10);
 const size=Object.keys(capacities).find(id=>capacities[id]*count>=draft.party);
 return {size,count};
}
function boatSelection(){
 return draft.boatChoice==="auto"?suggestion():{size:draft.boatChoice,count:Number(draft.boatCount)};
}
function allItems(){
 const {size,count}=boatSelection();
 if(size==="none")return draft.items;
 const people=Math.floor(draft.party/count),extra=draft.party%count;
 const boats=[];
 for(const [qty,n] of [[count-extra,people],[extra,people+1]]){
  if(qty>0)boats.push({product:size,qty,people:n,budget:Number(draft.boatBudget||product(size).budget),use:draft.boatUse||(draft.occasion==="petisco"?"Petisco":"Refeição"),note:""});
 }
 return [...boats,...draft.items];
}
const input=(label,key,value,attrs="")=>`<label class="field"><span>${label}</span><input data-field="o.${key}" value="${esc(value)}" ${attrs}></label>`;
function options(group,values,selected){
 return `<div class="quiz-options">${values.map(([key,label])=>`<button type="button" data-pick="${group}" data-value="${esc(key)}" aria-pressed="${Array.isArray(selected)?selected.includes(key):key===selected}">${esc(label)}</button>`).join("")}</div>`;
}
function counter(label,key,value,max){
 return `<div class="quiz-counter">${input(label,key,value,`type="number" inputmode="numeric" min="1" max="${max}" step="1" required`)}<button type="button" data-count="${key}" data-delta="-1" aria-label="Diminuir ${label}">−</button><button type="button" data-count="${key}" data-delta="1" aria-label="Aumentar ${label}">+</button></div>`;
}
function shellfish(group,title){
 const names=catalog.filter(p=>p.cat===2||p.cat===3||["polvo","tigre","lulas"].includes(p.id)).map(p=>[p.name,p.name]);
 return `<fieldset><legend>${title}</legend>${options(group,[["none","Sem preferência"],...names],draft[group].length||draft[group+"Text"]?draft[group]:["none"])}
 ${input("Outro (opcional)",group+"Text",draft[group+"Text"],'maxlength="60"')}</fieldset>`;
}
function articleStep(){
 const auto=suggestion(),{size,count}=boatSelection();
 const items=draft.items.map((i,n)=>{
  const p=product(i.product);
  return `<div class="quiz-line"><strong>${esc(p.name)}</strong><div class="form-grid"><label class="field">Quantidade (${esc(p.unit)})<input data-item="${n}" data-prop="qty" type="number" min="${p.unit==="un."?1:0.01}" step="${p.unit==="un."?1:0.01}" max="9999" value="${esc(i.qty)}" required></label>
  ${p.cat===1?`<label class="field">Corte<select data-item="${n}" data-prop="cut">${cuts.map(c=>`<option ${c===i.cut?"selected":""}>${c}</option>`).join("")}</select></label>`:""}</div>
  <label class="field">Instruções (opcional)<input data-item="${n}" data-prop="note" maxlength="200" value="${esc(i.note||"")}"></label>
  <button type="button" class="btn" data-drop="${n}">Remover ${esc(p.name)}</button></div>`;
 }).join("");
 return `<fieldset><legend>Barca (opcional)</legend><p>Sugestão para ${partyLabel(draft.party)}: ${auto.count} × ${product(auto.size).name}.</p>
 ${options("boatChoice",[["auto","Usar sugestão"],...Object.keys(capacities).map(id=>[id,product(id).name]),["none","Não quero barca"]],draft.boatChoice)}
 ${size!=="none"?`${draft.boatChoice!=="auto"?counter("Número de barcas","boatCount",count,draft.party):""}
 <p>${count} × ${product(size).name} · ${product(size).size} · ${fmtQty(draft.boatBudget??product(size).budget)} € de marisco por barca</p>
 ${input("Marisco por barca (€)","boatBudget",draft.boatBudget??product(size).budget,'type="number" required step="0.01" min="1" max="10000"')}
 ${options("boatUse",[["Refeição","Refeição"],["Petisco","Petisco"]],draft.boatUse||(draft.occasion==="petisco"?"Petisco":"Refeição"))}`:""}</fieldset>
 <fieldset><legend>Peixe, marisco e congelados</legend>${options("itemCategory",categories.slice(1).map((c,i)=>[String(i+1),c]),String(draft.itemCategory))}
 <div class="quiz-options">${catalog.filter(p=>p.cat===Number(draft.itemCategory)).map(p=>`<button type="button" data-add="${esc(p.id)}">+ ${esc(p.name)}</button>`).join("")}</div>${items}</fieldset>`;
}
function contactStep(){
 return `${options("delivery",[["Levantamento","Levantar na loja"],["Entrega","Entrega"]],draft.delivery)}
 ${draft.delivery==="Entrega"?input("Morada de entrega","address",draft.address,'required maxlength="200"'):""}
 <div class="form-grid">${input("Dia","day",draft.day,`type="date" min="${dayNow()}" max="${shiftDay(dayNow(),365)}" required`)}${input("Hora","time",draft.time,'type="time" required')}</div>
 ${input("Nome do cliente ou restaurante","name",draft.name,'required maxlength="80"')}
 ${options("type",[["particular","Particular"],["restaurante","Restaurante"]],draft.type)}
 ${input("Telemóvel","phone",draft.phone,'type="tel" inputmode="tel" required maxlength="40" placeholder="Número português ou +indicativo e número"')}
 <p>Usamos o nome e o telemóvel só para esta encomenda.</p>
 ${input("Notas (opcional)","note",draft.note,'maxlength="600"')}
`;
}
const partyLabel=n=>fmtQty(n)+" "+(Number(n)===1?"pessoa":"pessoas");
function review(){
 const description=[partyLabel(draft.party),occasions[draft.occasion],draft.occasion==="outro"?draft.occasionOther:""].filter(Boolean).join(" · ");
 return `<p><strong>${esc(description)}</strong></p>${allItems().map(i=>`<p><strong>${esc(label(i))}${product(i.product).cat===0?" × "+fmtQty(i.qty):""}</strong> · ${esc(lineDescription(i))}</p>`).join("")}
 <p>Marisco preferido: ${esc(preferences(draft,"liked").join(", ")||"Sem preferência")}</p><p>Marisco a evitar: ${esc(preferences(draft,"avoid").join(", ")||"Sem preferência")}</p>
 <p>${esc(draft.delivery)} · ${esc(draft.day)} às ${esc(draft.time)}${draft.delivery==="Entrega"?" · "+esc(draft.address):""}</p>
 <p>${esc(draft.name)} · ${esc(draft.phone)}</p>${draft.note?`<p>${esc(draft.note)}</p>`:""}${draft.priority?"<p>Encomenda prioritária</p>":""}`;
}
function drawForm(){
 const pages=[()=>counter("Número de pessoas","party",draft.party,300),
  ()=>options("occasion",Object.entries(occasions),draft.occasion)+(draft.occasion==="outro"?input("Descreva a ocasião","occasionOther",draft.occasionOther,'required maxlength="100"'):""),
  ()=>shellfish("liked","Há algum marisco de que goste especialmente?")+shellfish("avoid","Há algum de que não goste ou não possa comer?"),
  articleStep,contactStep,review];
 panel.innerHTML=modalHead("PASSO "+draftStep+" DE 6 · "+steps[draftStep-1],stepTitles[draftStep-1])+`<form id="quizForm" class="modal-body quiz" autocomplete="off">
 <progress value="${draftStep}" max="6" aria-label="Progresso"></progress>${pages[draftStep-1]()}
 <p id="quizError" role="alert">${esc(hadFormError)}</p><div class="form-foot"><button type="button" class="btn" data-quiz-back ${busy?"disabled":""}>Voltar</button>
 <button class="btn primary" type="submit" ${busy?"disabled":""}>${busy?"A registar…":draftStep===6?"Confirmar encomenda":"Continuar"}</button></div></form>`;
 persistDraft();
}
function quizError(){
 if(draftStep===2&&(!draft.occasion||(draft.occasion==="outro"&&!draft.occasionOther.trim())))return "Indique a ocasião.";
 if(draftStep===2&&draft.occasion==="outro"&&Array.from(draft.occasionOther).length>100)return "A descrição da ocasião pode ter até 100 caracteres.";
 if(draftStep===3){
  for(const key of ["liked","avoid"]){
   const items=preferences(draft,key);
   if(items.length>30)return "Escolha até 30 itens por lista de marisco.";
   if(items.some(s=>Array.from(s).length>60))return "Cada item de marisco pode ter até 60 caracteres.";
  }
 }
 if(draftStep===4&&!allItems().length)return "Adicione pelo menos um artigo para continuar.";
 if(draftStep===5){
  if(!normalizedPhone(draft.phone))return "Indique 9 dígitos para Portugal ou + seguido do indicativo e do número (8 a 15 dígitos).";
  if(!draft.name.trim()||(draft.delivery==="Entrega"&&!draft.address.trim()))return "Preencha os campos obrigatórios.";
 }
 return "";
}
function quizClick(b){
 if(busy)return;
 if(b.hasAttribute("data-quiz-back")){
  if(draftStep===1){dialog.close();return;}
  draftStep--;
 }else if(b.dataset.count){
  const key=b.dataset.count,max=key==="party"?300:draft.party;
  draft[key]=Math.max(1,Math.min(max,(Number(draft[key])||0)+Number(b.dataset.delta)));
 }else if(b.dataset.pick){
  const key=b.dataset.pick,v=b.dataset.value;
  if(key==="liked"||key==="avoid"){
   if(v==="none"){draft[key]=[];draft[key+"Text"]="";}
   else draft[key]=draft[key].includes(v)?draft[key].filter(x=>x!==v):[...draft[key],v];
  }else{draft[key]=v;if(key==="boatChoice")delete draft.boatBudget;}
 }else if(b.dataset.add){
  if(draft.items.length>=48){notice("Máximo de 48 artigos adicionais.");return;}
  const p=product(b.dataset.add);
  const item={product:p.id,qty:1,cut:p.cat===1?cuts[0]:"",note:""};
  if(p.id.startsWith("custom-"))item.catalogEntry={...p};
  draft.items.push(item);
 }else if(b.dataset.drop!==undefined){draft.items.splice(Number(b.dataset.drop),1);}
 else return;
 hadFormError="";drawForm();
}
async function submitOrder(){
 if(busy)return;
 if(draft.day<dayNow()||draft.day>shiftDay(dayNow(),365)){
  draftStep=5;hadFormError="Escolha uma data válida para a encomenda.";drawForm();return;
 }
 const pending=draft,scope=draftScope;
 busy=true;hadFormError="";drawForm();
 try{
 const {order:o}=await request("/api/orders",{...pending,items:allItems()});
 if(drafts.get(scope)?.draft.requestKey===pending.requestKey)drafts.delete(scope);
 try{
  if(JSON.parse(localStorage.getItem(keyFor(scope)))?.draft.requestKey===pending.requestKey)localStorage.removeItem(keyFor(scope));
 }catch{}
 if(draft!==pending)return;
 draft=null;draftStep=1;
 if(scope!=="Cliente"){if(day!==o.day){day=o.day;orders=[];loaded=false;}updateOrder(o);}
 dialogMode="success";panel.innerHTML=modalHead("ENCOMENDA REGISTADA","Encomenda confirmada")+`<div class="modal-body success"><strong class="order-number">${esc(code(o.id))}</strong><p>${esc(o.delivery)} · ${esc(o.day)} às ${esc(o.time)}</p>${button("check","Concluir","close","primary")}</div>`;render();await sync();
 }catch(e){hadFormError=e.message||"Não foi possível registar o pedido.";busy=false;drawForm();dialog.scrollTop=0;}finally{busy=false;}
}
// Formulário rápido da equipa: um ecrã para os artigos e outro para o cliente e a hora.
// O questionário de 6 passos é só do separador Cliente. Os dois partilham a criação (/api/orders).
let quick=null,qEntry=null,qEdit=-1,qStep=1,qError="";
function persistQuick(){
 if(!quick||!teamSession)return;
 try{localStorage.setItem(keyFor("Rapida"),JSON.stringify({quick,qEntry,qEdit,qStep}));}catch{}
}
const opts=(items,v)=>items.map(([id,t])=>`<option value="${esc(id)}" ${String(v)===String(id)?"selected":""}>${esc(t)}</option>`).join("");
const qinput=(label,key,value,attrs="")=>`<label class="field"><span>${label}</span><input data-qf="${key}" value="${esc(value)}" ${attrs}></label>`;
function qDefault(id){const p=product(id);return {product:id,name:p.name,measure:"weight",weight:1,qty:1,cut:p.cat===1?cuts[0]:"",people:p.cat===0?capacities[p.id]||3:1,use:"Refeição",budget:p.budget||0,note:""};}
function startQuick(){
 if(!teamSession)return;
 if(!quick){
  try{
   const saved=JSON.parse(localStorage.getItem(keyFor("Rapida")));
   if(saved?.quick?.requestKey&&Array.isArray(saved.quick.items)){
    quick=saved.quick;qEntry=saved.qEntry;qEdit=saved.qEdit??-1;qStep=saved.qStep===2?2:1;
   }
  }catch{}
 }
 if(!quick){
  const t=new Date(Date.now()+3600000);
  quick={requestKey:mkKey(),channel:"Equipa",name:"",phone:"",type:"particular",delivery:"Levantamento",address:"",
   day:day>lisbonDay(t)?day:lisbonDay(t),time:new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Lisbon",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(t),note:"",priority:false,items:[]};
  qStep=1;
 }
 qError="";
 if(!qEntry)qEntry=qDefault(catalog.find(p=>p.cat===(page==="encomendas"&&station==="bancada"?1:0)).id);
 openDialog("order");drawQuick();
}
function qEditor(){
 const p=product(qEntry.product);
 return `<div class="editor"><div class="quiz-options" role="group" aria-label="Categoria">${categories.map((name,n)=>`<button type="button" data-qcategory="${n}" aria-pressed="${p.cat===n}">${esc(name)}</button>`).join("")}</div>
 <div class="quiz-options" role="group" aria-label="Produtos">${catalog.filter(x=>x.cat===p.cat).map(x=>`<button type="button" data-qproduct="${esc(x.id)}" aria-pressed="${qEntry.name===x.name}">${esc(x.name)}</button>`).join("")}</div>
 ${p.cat!==0?qinput("Produto","i.name",qEntry.name,'required maxlength="100" placeholder="Nome do produto"'):""}
 ${p.cat===0?`<p class="boat-price">${icon("boat",16)} ${esc(p.size)} · Referência de ${p.budget} € em marisco por barca</p><div class="form-grid three">${qinput("N.º de barcas","i.qty",qEntry.qty,'type="number" min="1" max="9999" step="1" required')}${qinput("Pessoas por barca","i.people",qEntry.people,'type="number" min="1" max="300" step="1" required')}${qinput("Marisco por barca (€)","i.budget",qEntry.budget,'type="number" min="1" max="10000" step="0.01" required')}</div><label class="field"><span>Tipo de serviço</span><select data-qf="i.use">${opts(["Refeição","Petisco"].map(x=>[x,x]),qEntry.use)}</select></label>`:
 `${p.cat===1?`<div class="quiz-options" role="group" aria-label="Forma de encomendar"><button type="button" data-qmeasure="weight" aria-pressed="${qEntry.measure!=="pieces"}">Ao quilo</button><button type="button" data-qmeasure="pieces" aria-pressed="${qEntry.measure==="pieces"}">À peça</button></div>`:""}<div class="form-grid">${qinput(qEntry.measure==="pieces"?"Número de peixes":"Quantidade ("+p.unit+")","i.qty",qEntry.qty,`type="number" min="${qEntry.measure==="pieces"||p.unit==="un."?1:"0.01"}" max="9999" step="${qEntry.measure==="pieces"||p.unit==="un."?1:"0.01"}" required`)}${qEntry.measure==="pieces"?qinput("Peso aproximado por peixe (kg)","i.weight",qEntry.weight,'type="number" min="0.01" max="100" step="0.01" required'):""}${p.cat===1?`<label class="field"><span>Preparação</span><select data-qf="i.cut">${opts(cuts.map(x=>[x,x]),qEntry.cut)}</select></label>`:""}</div>`}
 ${qinput("Instruções do artigo (opcional)","i.note",qEntry.note,'maxlength="200" placeholder="Ex. embalar em separado"')}
 <button type="submit" class="btn outline">${icon(qEdit<0?"plus":"check",16)}${qEdit<0?"Adicionar à encomenda":"Guardar artigo"}</button>${qEdit>=0?'<button type="button" class="btn minor" data-qact="canceledit">Cancelar edição</button>':""}</div>`;
}
function drawQuick(){
 if(!quick)return;
 persistQuick();
 const cart=quick.items.map((i,k)=>`<div class="cart-row"><div><strong>${esc(label(i))} ${product(i.product).cat===0&&i.qty>1?"× "+fmtQty(i.qty):""}</strong><small>${esc(lineDescription(i))}</small></div><button type="button" class="textbtn" data-qedit="${k}">Editar</button><button type="button" class="close" data-qremove="${k}" aria-label="Remover ${esc(label(i))}">${icon("trash",16)}</button></div>`).join("")||"<p>Adicione o primeiro artigo para continuar.</p>";
 panel.innerHTML=modalHead("EQUIPA","Nova encomenda")+`<div class="modal-body"><div class="steps"><span class="${qStep===1?"current":""}">1 &nbsp; Artigos</span><span class="${qStep===2?"current":""}">2 &nbsp; Cliente e horário</span></div>${qError?`<div class="error" role="alert">${esc(qError)}</div>`:""}
 ${qStep===1?`<form id="qItemForm">${qEditor()}</form><div class="cart-title"><strong>Artigos na encomenda</strong><span class="total">${quick.items.length}</span></div><div class="cart-lines">${cart}</div><div class="form-foot">${button("","Fechar","close","minor")}<button type="button" data-qact="next" class="btn primary" ${quick.items.length&&qEdit<0?"":"disabled"}>Continuar</button></div>`:
 `<form id="qOrderForm"><div class="form-grid">${qinput("Nome do cliente ou restaurante","o.name",quick.name,'maxlength="80" required autocomplete="name"')}<label class="field"><span>Cliente</span><select data-qf="o.type">${opts([["particular","Particular"],["restaurante","Restaurante"]],quick.type)}</select></label></div>
 <div class="form-grid">${qinput("Telemóvel (opcional)","o.phone",quick.phone,'type="tel" maxlength="25" autocomplete="off" placeholder="9 dígitos ou +indicativo"')}<label class="field"><span>Modalidade</span><select data-qf="o.delivery">${opts(["Levantamento","Entrega"].map(x=>[x,x]),quick.delivery)}</select></label></div>
 ${quick.delivery==="Entrega"?qinput("Morada de entrega","o.address",quick.address,'maxlength="200" autocomplete="street-address" required'):""}
 <div class="form-grid">${qinput("Dia","o.day",quick.day,`type="date" min="${dayNow()}" max="${shiftDay(dayNow(),365)}" required`)}${qinput("Hora pretendida","o.time",quick.time,'type="time" required')}</div><label class="field"><span>Notas de preparação (opcional)</span><textarea data-qf="o.note" maxlength="600" rows="2">${esc(quick.note)}</textarea></label><label class="checkfield"><input type="checkbox" data-qf="o.priority" ${quick.priority?"checked":""}> Encomenda prioritária</label>
 <div class="summary"><strong>${quick.items.length===1?"1 artigo":quick.items.length+" artigos"}</strong><span>${esc(quick.items.map(i=>label(i)).join(" · "))}</span></div>
 <div class="form-foot"><button type="button" class="btn minor" data-qact="prev">Voltar aos artigos</button><button type="submit" class="btn primary" ${busy?"disabled":""}>${icon("check",16)}${busy?"A registar…":"Confirmar encomenda"}</button></div></form>`}</div>`;
}
async function submitQuick(){
 if(busy||!quick)return;
 if(quick.phone.trim()&&!normalizedPhone(quick.phone)){qError="Telemóvel inválido. Use 9 dígitos ou + e o indicativo, ou deixe em branco.";drawQuick();return;}
 if(quick.day<dayNow()||quick.day>shiftDay(dayNow(),365)){qError="Escolha uma data válida para a encomenda.";drawQuick();return;}
 const pending=quick;busy=true;qError="";drawQuick();
 panel.querySelectorAll("input,select,textarea,button").forEach(el=>el.disabled=true);
 try{
  const {order:o}=await request("/api/orders",pending);
  if(quick!==pending)return;
  try{localStorage.removeItem(keyFor("Rapida"));}catch{}
  quick=null;qEntry=null;qStep=1;
  if(day!==o.day){day=o.day;orders=[];loaded=false;}
  updateOrder(o);
  dialogMode="success";panel.innerHTML=modalHead("ENCOMENDA REGISTADA","Encomenda confirmada")+`<div class="modal-body success"><strong class="order-number">${esc(code(o.id))}</strong><p>${esc(o.delivery)} · ${esc(o.day)} às ${esc(o.time)}</p>${button("check","Concluir","close","primary")}</div>`;render();await sync();
 }catch(e){qError=e.message||"Não foi possível registar o pedido.";busy=false;drawQuick();dialog.scrollTop=0;}finally{busy=false;}
}
document.addEventListener("input",e=>{
 const t=e.target;
 if(quick&&t.dataset.qf&&t.closest("#qItemForm,#qOrderForm")){const [who,k]=t.dataset.qf.split(".");(who==="i"?qEntry:quick)[k]=t.type==="checkbox"?t.checked:t.value;persistQuick();return;}
 if(!t.closest("#quizForm")||!draft)return;
 if(t.dataset.field){const k=t.dataset.field.slice(2);draft[k]=t.type==="checkbox"?t.checked:t.value;}
 if(t.dataset.item!==undefined)draft.items[Number(t.dataset.item)][t.dataset.prop]=t.dataset.prop==="qty"?Number(t.value):t.value;
 if(["o.likedText","o.avoidText"].includes(t.dataset.field)){
  const key=t.dataset.field==="o.likedText"?"liked":"avoid";
  t.closest("fieldset").querySelector('[data-value="none"]').setAttribute("aria-pressed",!preferences(draft,key).length);
 }
 persistDraft();
});
document.addEventListener("change",e=>{
 const t=e.target;
 if(t.id==="cancelReason"){const other=$("#otherReason");other.hidden=t.value!=="Outro";other.querySelector("input").required=!other.hidden;return;}
 if(t.id==="orderDay"){setDay(t.value);return;}
 if(quick&&t.dataset.qf==="o.delivery"){quick.delivery=t.value;drawQuick();return;}

});
document.addEventListener("submit",e=>{
 if(e.target.id==="historyConfirm"){
  e.preventDefault();
  const action=e.target.dataset.action;
  const reason=$("#cancelReason")?.value==="Outro"?$("#otherReason input").value.trim():$("#cancelReason")?.value;
  if(action==="cancel"&&!reason){notice("Indique um motivo.");return;}
  dialogMode="detail";drawDetail();mutate(confirmOrder,action,{reason});return;
 }
 if(e.target.id==="qItemForm"&&quick){
  e.preventDefault();
  if(qEdit<0&&quick.items.length>=50){notice("Máximo de 50 artigos por encomenda.");return;}
  const p=product(qEntry.product),item={...qEntry,qty:Number(qEntry.qty),weight:Number(qEntry.weight||1),people:Number(qEntry.people),budget:Number(qEntry.budget)};
  if(qEdit>=0)quick.items[qEdit]=item;else quick.items.push(item);
  qEdit=-1;qEntry=qDefault(p.id);drawQuick();notice("Artigo guardado na encomenda.");return;
 }
 if(e.target.id==="qOrderForm"&&quick){e.preventDefault();submitQuick();return;}
 if(e.target.id==="quizForm"){
  e.preventDefault();if(busy)return;
  hadFormError=quizError();if(hadFormError){$("#quizError").textContent=hadFormError;return;}
  if(draftStep===6){submitOrder();return;}
  draft.boatCount=Math.min(Number(draft.boatCount)||1,Number(draft.party));
  draftStep++;drawForm();dialog.scrollTop=0;
 }
});
document.addEventListener("click",async e=>{
 const picker=e.target.closest("#quizForm .field,#qOrderForm .field")?.querySelector('input[type="date"],input[type="time"]');
 if(picker?.showPicker){try{picker.focus();picker.showPicker();e.preventDefault();return;}catch{/* Preferência nativa do navegador. */}}
 if(e.target===dialog){const rect=dialog.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom){if(!busy)dialog.close();}return;}
 const b=e.target.closest("button");if(!b)return;
 if(b.dataset.station){selectStation(b.dataset.station);return;}
 if(b.dataset.filter){filter=b.dataset.filter;render();document.querySelector(`[data-filter="${filter}"]`).focus();return;}
 if(b.dataset.list){listState=b.dataset.list;rerenderResults();return;}
 if(b.hasAttribute("data-quick-undo")){if(undoOrder&&Date.now()<undoUntil)await mutate(undoOrder,"undo");return;}
 if(b.dataset.confirm){confirmHistory(findOrder(detailId),b.dataset.confirm);return;}
 if(b.dataset.detail){openDetail(b.dataset.detail);return;}
 if(b.dataset.advance){await mutate(findOrder(b.dataset.advance),"advance",{station:b.dataset.s||station});return;}
 if(b.dataset.handoff){await mutate(findOrder(b.dataset.handoff),"handoff");return;}
 if(b.dataset.task){await mutate(findOrder(detailId),b.dataset.task,{station:b.dataset.s||station});return;}
 if(quick&&b.closest("#dialog")&&busy)return;
 if(quick&&b.dataset.qcategory!==undefined){qEntry=qDefault(catalog.find(p=>p.cat===Number(b.dataset.qcategory)).id);drawQuick();return;}
 if(quick&&b.dataset.qproduct){qEntry=qDefault(b.dataset.qproduct);drawQuick();return;}
 if(quick&&b.dataset.qmeasure){qEntry.measure=b.dataset.qmeasure;qEntry.qty=1;drawQuick();return;}
 if(quick&&b.dataset.qedit!==undefined){qEdit=+b.dataset.qedit;qEntry={...quick.items[qEdit]};drawQuick();dialog.scrollTop=0;return;}
 if(quick&&b.dataset.qremove!==undefined){quick.items.splice(+b.dataset.qremove,1);qEdit=-1;qEntry=qDefault(qEntry.product);drawQuick();return;}
 if(quick&&b.dataset.qact){
  const a=b.dataset.qact;
  if(a==="canceledit"){qEdit=-1;qEntry=qDefault(qEntry.product);drawQuick();return;}
  if(a==="next"&&!quick.items.length)return;
  qStep=a==="next"?2:1;qError="";drawQuick();dialog.scrollTop=0;return;
 }
 if(b.closest("#quizForm")&&b.type==="button"){quizClick(b);return;}
 const act=b.dataset.act;
 if(act==="new")page==="cliente"?startOrder():startQuick();
 if(act==="close"&&!busy)dialog.close();
 if(act==="focus"){focusMode=!focusMode;try{localStorage.setItem("ddm-modo-posto",String(focusMode))}catch{}document.body.classList.toggle("focus",focusMode);render();try{if(focusMode&&!document.fullscreenElement)await document.documentElement.requestFullscreen();else if(!focusMode&&document.fullscreenElement)await document.exitFullscreen();}catch{}}
});
dialog.addEventListener("cancel",e=>{if(busy)e.preventDefault();});
dialog.addEventListener("close",()=>{if(!dialog.open){detailId=null;dialogMode="";}});
// O modo posto mantém-se mesmo quando o navegador sai do ecrã inteiro.
window.addEventListener("hashchange",route);window.addEventListener("online",sync);
window.addEventListener("offline",()=>{++serial;synced=false;networkProblem=true;renderSync();});
document.addEventListener("visibilitychange",()=>{if(!document.hidden)sync();});
document.querySelector("#retrySync").onclick=sync;
const auth=teamAuth(base,publicKey,showSession);
setInterval(()=>{if(!document.hidden&&!busy)sync();},3500);
setInterval(()=>{updateClock();refreshDeadlines();},1000);
