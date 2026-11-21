const stations = {barcas:"Barcas de marisco",bancada:"Peixe e marisco"};
const states = ["Por iniciar","Em preparação","Prontas"];
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
const group=i=> i.product==="apoio"?"bancada":product(i.product).cat===0?"barcas":"bancada";
const label=i=>i.product==="apoio"?"Cozedura para a barca":product(i.product)?.name||"Artigo";
const unit=i=>i.product==="apoio"?"":product(i.product)?.unit||"";
const fmtQty=n=>Number(n).toLocaleString("pt-PT",{maximumFractionDigits:2});
const code=id=>refs.get(Number(id))||String(id);
const globalState=o=>Object.values(o.tasks).every(v=>v===2)?2:Object.values(o.tasks).some(v=>v>0)?1:0;
const typeName=o=>o.type==="restaurante"?"Restaurante":"Particular";
const isBlocked=o=>o.items.some(i=>i.product==="apoio"&&!i.done)&&o.tasks.bancada!==2;
function lineDescription(i){
 if(i.product==="apoio")return i.note;
 const p=product(i.product);
 if(p.cat===0)return [i.people+" pessoas",i.use,fmtQty(i.budget)+" € de marisco"].join(" · ");
 return [fmtQty(i.qty)+" "+p.unit,i.cut,i.note].filter(Boolean).join(" · ");
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
let page="preparacao",station="barcas",day=dayNow(),orders=[],loaded=false,synced=false,loading=false,serial=0;
let syncError=false;let query="",filter="all",listState="all",menu="",focusMode=false,detailId=null,busy=false,dialogMode="",draft=null,entry=null,editIndex=-1;
const dialog=$("#dialog"),panel=$("#dialogContent"),main=$("#main");
const dateText=(d,opts)=>new Intl.DateTimeFormat("pt-PT",opts).format(new Date(d+"T12:00:00Z"));
const findOrder=id=>orders.find(o=>o.id===Number(id));
const byTime=(a,b)=>Number(b.priority)-Number(a.priority)||a.time.localeCompare(b.time)||a.id-b.id;
const fullDate=d=>dateText(d,{weekday:"long",day:"numeric",month:"long",year:"numeric"});
function notice(msg){const t=$("#toast");t.textContent=msg;t.classList.add("on");clearTimeout(notice.timer);notice.timer=setTimeout(()=>t.classList.remove("on"),4200);}
const base="https://c--1d4e2f3e-c086-4293-8fd9-9ee55c295b01-prod.lovable.cloud", publicKey="sb_publishable_dt7LHmnqzFD-dD54yp77GA_YIya6oQJ";

const refs=new Map(), rawOrders=new Map();
const catKeys=["barcas","peixe_fresco","marisco_fresco","marisco_cozido","congelados"];
const statusKeys=["por_iniciar","em_preparacao","pronta"];
const cookKeys={pending:"por_cozer",done:"cozido_no_posto",skip:"dispensado"};
const unitKeys={"un.":"un","dz.":"dz","kg":"kg"};
async function rest(path,payload){
 let r;try{r=await fetch(base+"/rest/v1/"+path,{signal:AbortSignal.timeout(8000),method:payload?"POST":"GET",headers:{apikey:publicKey,"Content-Type":"application/json"},body:payload?JSON.stringify(payload):undefined,cache:"no-store"});}catch{throw Error("Sem ligação à demo. Verifica a ligação à internet e tenta novamente.");}
 const j=await r.json();if(!r.ok)throw Error(j.message||"Não foi possível guardar.");return j;
}
function convertRow(o){
 const id=Number(o.ref.split("-").at(-1));refs.set(id,o.ref);rawOrders.set(id,o);
 const tasks=Object.fromEntries(o.station_tasks.map(t=>[t.station,statusKeys.indexOf(t.status)])),boat=o.station_tasks.find(t=>t.station==="barcas");
 const items=o.order_items.sort((a,b)=>a.position-b.position).map((i,k)=>{
 let p=catalog.find(p=>p.name===i.product&&catKeys[p.cat]===i.category);
 if(!p){p={id:"custom-"+i.category+"-"+i.product,cat:catKeys.indexOf(i.category),name:i.product,unit:{"kg":"kg","un":"un.","dz":"dz."}[i.unit]||"un."};catalog.push(p);}
 return {product:p.id,line:k+1,qty:Number(i.quantity||1),note:i.notes||"",people:i.people,use:i.meal_type==="petisco"?"Petisco":"Refeição",budget:i.budget,cut:i.cut?i.cut[0].toUpperCase()+i.cut.slice(1):"",done:tasks[catKeys[p.cat]==="barcas"?"barcas":"bancada"]===2};});
 return {id,version:o.station_tasks.reduce((s,t)=>s+t.version,0),name:o.customer_name,type:o.customer_type,day:o.business_date,time:o.scheduled_time.slice(0,5),delivery:o.fulfilment==="entrega"?"Entrega":"Levantamento",address:o.address,priority:o.priority!=="normal",note:o.notes,phone:"",channel:o.source==="cliente"?"Cliente":"Equipa",handed:o.status==="entregue",items,tasks,boatSteps:boat?{gathered:boat.shellfish_collected,cooked:Object.keys(cookKeys).find(k=>cookKeys[k]===boat.cooking),assembled:boat.assembly_done}:null};
}
async function readOne(uuid){const rows=await rest("orders?select=*,station_tasks(*),order_items(*)&id=eq."+encodeURIComponent(uuid));return convertRow(rows[0]);}
async function onlineRequest(url,data){
 if(!data){
  const day=new URL(url,"https://demo.invalid").searchParams.get("day");
  return {orders:(await rest("orders?select=*,station_tasks(*),order_items(*)&business_date=eq."+encodeURIComponent(day))).map(convertRow)};
 }
 if(url==="/api/orders"){
  const r=await rest("rpc/create_order",{payload:{customer_name:data.name.trim(),customer_type:data.type,fulfilment:data.delivery==="Entrega"?"entrega":"recolha",address:data.address,scheduled_time:data.time,business_date:data.day,source:data.channel==="Cliente"?"cliente":"equipa",priority:data.priority?"alta":"normal",notes:[data.note,data.phone?"Contacto: "+data.phone:""].filter(Boolean).join("\n"),client_token:data.requestKey,items:data.items.map(i=>{const p=product(i.product);return {category:catKeys[p.cat],product:p.name,quantity:i.qty,unit:unitKeys[p.unit],cut:p.cat===1?i.cut.toLowerCase():null,barca_size:p.cat===0?({bp:"pequena",bm:"media",bg:"grande"}[i.product]):null,meal_type:p.cat===0?(i.use==="Petisco"?"petisco":"refeicao"):null,people:p.cat===0?i.people:null,budget:p.cat===0?i.budget:null,notes:i.note};})}});
  return {order:await readOne(r.id)};
 }
 const row=rawOrders.get(Number(url.split("/").at(-1)));if(!row)throw Error("Encomenda indisponível.");
 if(data.action==="handoff"){await rest("rpc/hand_off",{p_order_id:row.id});}
 else{
 if(data.version!==row.station_tasks.reduce((sum,t)=>sum+t.version,0))throw Object.assign(Error("Outro posto alterou a encomenda. Confirma o novo estado."),{status:409});
 const t=row.station_tasks.find(t=>t.station===data.station);const patch={};
 if(!t)throw Error("Posto indisponível.");
 if(data.action==="advance"||data.action==="back"){
 const n=statusKeys.indexOf(t.status)+(data.action==="advance"?1:-1);if(n<0||n>2)throw Error("Atualiza o posto.");
 patch.status=statusKeys[n];if(t.station==="barcas"&&n===0){Object.assign(patch,{cooking:"por_cozer",shellfish_collected:false,assembly_done:false});}
 }else if(data.action==="boat"){
 if(data.step==="gathered")patch.shellfish_collected=data.value;
 if(data.step==="cooked")patch.cooking=cookKeys[data.value];
 if(data.step==="assembled")patch.assembly_done=data.value;
 }else throw Error("Ação indisponível.");
 await rest("rpc/update_task",{p_task_id:t.id,p_expected_version:t.version,p_patch:patch});
 }
 return {order:await readOne(row.id)};
}

const boat=(product,people,use,budget)=>({product,people,use,budget,qty:1,note:""});
const item=(product,qty,cut="",note="")=>({product,qty,cut,note});

async function request(url,data){
 if(data&&!synced)throw Error("Sem ligação à base de dados. Volta a ligar antes de confirmar.");
 return onlineRequest(url,data);
}
function route(){
 const [raw,param]=location.hash.slice(1).split("/");page=["cliente","encomendas"].includes(raw)?raw:"preparacao";
 if(["barcas","bancada"].includes(param))station=param;else if(!raw||raw==="preparacao"){try{station=localStorage.getItem("ddm-posto")==="bancada"?"bancada":"barcas"}catch{}}
 query="";filter="all";menu="";if(page!=="preparacao")focusMode=false;
 document.body.classList.toggle("focus",focusMode);if(dialog.open)dialog.close();render();sync();
}
function selectStation(s){
 if(!Object.hasOwn(stations,s))return;station=s;try{localStorage.setItem("ddm-posto",s)}catch{}
 history.replaceState(null,"","#preparacao/"+s);query="";filter="all";menu="";render();
}

let lastSync=0,fetchDay=null,networkProblem=false;
async function sync(){
 const selected=day;if(fetchDay===selected)return;fetchDay=selected;
 const current=++serial;
 try{
 const data=await request("/api/orders?day="+encodeURIComponent(selected));if(current!==serial||day!==selected)return;
 const changed=JSON.stringify(orders)!==JSON.stringify(data.orders)||!synced;
 orders=data.orders;loaded=true;synced=true;networkProblem=false;lastSync=Date.now();
 if(changed){if(!menu&&!$("#search")?.matches(":focus")&&!$("#orderDay")?.matches(":focus"))render();else rerenderResults();if(dialog.open&&dialogMode==="detail"&&!busy)drawDetail();}
 }catch{if(current!==serial||day!==selected)return;synced=false;networkProblem=true;if(!loaded)render();}
 finally{if(fetchDay===selected)fetchDay=null;renderSync();}
}
function renderSync(){
 document.querySelectorAll(".sync").forEach(el=>{el.classList.toggle("off",!synced);el.innerHTML=`<span></span>${synced?"Base ligada":networkProblem?"Sem ligação":"A ligar"}`;el.title=lastSync?"Última leitura às "+new Date(lastSync).toLocaleTimeString("pt-PT"):"Ligação à base de dados da equipa";});
 const b=document.getElementById("networkStatus");
 b.hidden=!networkProblem;b.querySelector("span").textContent=lastSync?"Sem ligação. A última leitura foi às "+new Date(lastSync).toLocaleTimeString("pt-PT")+". Volta a ligar para guardar alterações.":"Não foi possível carregar as encomendas da equipa. Verifica a ligação e tenta novamente.";
}
const button=(name,text,act,extra="")=>`<button type="button" class="btn ${extra}" data-act="${act}">${name?icon(name):""}${text}</button>`;
function header(){
 const client=page==="cliente",list=page==="encomendas";
 const title=client?"Encomendar na Delicias do Mar":list?"Encomendas":"Painel de preparação";
 return `<div class="pagehead"><div><div class="kicker date">${icon(client?"store":"calendar",15)}${client?"LOJA DE DEMONSTRAÇÃO":esc(fullDate(day))}</div><h1>${title}</h1></div><div class="head-actions">${client?"":`<span class="sync"></span>${!list?`<button class="btn square" title="${focusMode?"Sair do modo posto":"Modo posto em ecrã inteiro"}" aria-label="${focusMode?"Sair do modo posto":"Modo posto em ecrã inteiro"}" data-act="focus">${icon(focusMode?"shrink":"expand")}</button>`:""}${button("plus","Nova encomenda","new","primary")}`}</div></div>`;
}
function stationCards(){return `<div class="stations" aria-label="Selecionar posto">${Object.entries(stations).map(([k,title],i)=>`<button data-station="${k}" class="station ${k} ${station===k?"selected":""}" aria-pressed="${station===k}">
<div class="station-art" aria-hidden="true"></div><div class="station-copy"><span class="station-num"><span class="tiny-rule"></span>POSTO 0${i+1}</span><strong>${title}</strong><span class="station-desc">${i===0?"Recolha, cozedura e montagem":"Frescos, cozidos e congelados"}</span></div><span class="station-state">${station===k?icon("check",13):""}</span></button>`).join("")}</div>`;}
function statusPill(n){return `<span class="status-pill ${cls[n]}"><b></b>${["Por iniciar","Em preparação","Pronta"][n]}</span>`;}
const modeIcon=o=>o.delivery==="Entrega"?"truck":"shop";
function datePicker(){const text=day===dayNow()?"Hoje":day===shiftDay(dayNow(),1)?"Amanhã":dateText(day,{day:"2-digit",month:"short"});return `<label class="date-pick" title="Escolher dia">${icon("calendar",16)}${esc(text)}${icon("chev",13)}<input type="date" id="orderDay" aria-label="Dia das encomendas" value="${esc(day)}"></label>`;}
function toolbar(total){
 return `<div class="queuehead"><div class="queue-title"><h2>${page==="preparacao"?"Fila de preparação":"Lista de encomendas"}</h2><span class="total">${total}</span>${focusMode?`<small>${esc(stations[station])}</small>`:""}</div><div class="tools"><label class="searchbox">${icon("search",17)}<input id="search" type="search" placeholder="Pesquisar encomenda" aria-label="Pesquisar por nome, número ou artigo" value="${esc(query)}"></label>${datePicker()}<div class="filterwrap">${button("filter",filter==="all"?"Filtros":"Filtro ativo","filter",filter==="all"?"":"tinted")}${menu==="filter"?`<div class="popover" role="group" aria-label="Filtros">${[["all","Todas as encomendas"],["urgente","Prioritárias"],["Entrega","Entregas"],["Levantamento","Levantamentos"],["restaurante","Restaurantes"],["mista","Dos dois postos"]].map(([v,t])=>`<button data-filter="${v}" aria-pressed="${filter===v}">${t}${filter===v?icon("check",15):""}</button>`).join("")}</div>`:""}</div></div></div>`;
}
const normal=t=>String(t).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
function match(o){const f=filter==="all"||filter==="urgente"&&o.priority||filter===o.delivery||filter===o.type||filter==="mista"&&Object.keys(o.tasks).length===2;
 return f&&normal([code(o.id),o.name,...o.items.map(label)].join(" ")).includes(normal(query.trim()));}
function orderCard(o,n){
 const lines=o.items.filter(i=>group(i)===station);const i=lines[0],p=product(i.product);
 const subtitle=p.cat===0?`${i.people} pessoas · ${i.use}`:lineDescription(i);
 const detail=lines.length>1?` <span class="moreitems">+${lines.length-1}</span>`:"";
 const fullName=`${p.cat===0&&i.qty>1?fmtQty(i.qty)+" × ":""}${label(i)}`;
 return `<article class="ticket ${cls[n]}"><div class="ticket-top"><button class="ref" data-detail="${o.id}" aria-label="Abrir ${code(o.id)}">${code(o.id)}</button>${o.priority?`<span class="priority">${icon("flag",13)}Prioritária</span>`:o.tasks.barcas!==undefined&&o.tasks.bancada!==undefined?`<span class="mixed" title="Encomenda dos dois postos">${icon("columns",13)}Dois postos</span>`:""}</div>
 <button class="ticket-name" data-detail="${o.id}">${esc(fullName)}${detail}</button><div class="ticket-sub">${esc(subtitle)}</div>
 <div class="customer">${icon(o.type==="restaurante"?"fork":"user",16)}<span>${esc(o.name)}</span></div>
 <div class="ticket-meta"><strong>${icon("clock",16)}${esc(o.time)}</strong><span>${icon(modeIcon(o),15)}${esc(o.delivery)}</span></div>
 <button class="ticket-action ${cls[n]}" ${n===2?`data-detail="${o.id}"`:`data-advance="${o.id}"`}><span>${icon(["play","check","detail"][n],15)}${["Iniciar preparação","Concluir preparação","Ver ficha"][n]}</span>${icon("right",14)}</button></article>`;
}
function empty(text){return `<div class="empty">${icon("bando",24)}<span>${text}</span></div>`;}
function boardContent(){
 const relevant=orders.filter(o=>!o.handed&&o.tasks[station]!==undefined),shown=relevant.filter(match).sort(byTime);
 return `<div class="board">${states.map((title,n)=>{const row=shown.filter(o=>o.tasks[station]===n);return `<section class="lane ${cls[n]}"><div class="lane-head"><div><span class="state-dot"></span><h3>${title}</h3></div><span class="lane-count">${row.length}</span></div><div class="lane-body">${row.map(o=>orderCard(o,n)).join("")||empty(!loaded?synced?"A carregar…":(networkProblem?"Sem ligação. Abre o ficheiro num navegador com internet.":"A ligar ao posto…"):query||filter!=="all"?"Sem resultados":"Sem encomendas")}</div></section>`;}).join("")}</div>`;
}
function listContent(){
 const items=orders.filter(match).filter(o=>listState==="all"||listState==="entregues"&&o.handed||listState==="ativas"&&!o.handed).sort(byTime);
 return `<div class="list-tabs">${[["all","Todas"],["ativas","Em aberto"],["entregues","Entregues"]].map(([key,t])=>`<button data-list="${key}" class="${key===listState?"active":""}">${t}</button>`).join("")}</div><div class="order-table"><div class="table-row table-head"><span>Encomenda</span><span>Cliente</span><span>Hora prevista</span><span>Postos</span><span>Estado</span></div>${items.map(o=>`<button data-detail="${o.id}" class="table-row"><strong>${code(o.id)}</strong><span>${esc(o.name)}<small>${typeName(o)}</small></span><span>${esc(o.time)}<small>${esc(o.delivery)}</small></span><span>${Object.keys(o.tasks).map(k=>k==="barcas"?"Barcas":"Bancada").join(" + ")}</span><span>${o.handed?`<span class="delivered">${icon("check",14)} Entregue</span>`:statusPill(globalState(o))}</span></button>`).join("")||empty("Sem encomendas para estes critérios.")}</div>`;
}
function clientContent(){return `<div class="client-intro"><div><span class="station-num">ENCOMENDAS</span><h2>O que vai levar?</h2><p>Escolha os artigos, a preparação e a hora pretendida.</p>${button("bag","Começar encomenda","new","primary")}</div><div class="client-art"></div></div><h2 class="catalog-title">Escolher por categoria</h2><div class="cat-grid">${categories.map((c,n)=>`<button type="button" data-startcat="${n}"><span class="cat-symbol">${icon(categoryIcons[n],28)}</span><strong>${c}</strong><span>${catalog.filter(p=>p.cat===n).length} opções ${icon("right",14)}</span></button>`).join("")}</div><p class="helptext">${icon("info",16)} Demonstração. Os pedidos entram apenas nos postos de teste.</p>`;}
function render(){
 document.title=(page==="preparacao"?"Preparação":page==="cliente"?"Encomendar":"Encomendas")+" · Delicias do Mar";
 document.querySelectorAll("[data-nav]").forEach(a=>{a.classList.toggle("active",a.dataset.nav===page);if(a.dataset.nav===page)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");});
 const total=page==="preparacao"?orders.filter(o=>!o.handed&&o.tasks[station]!==undefined).length:orders.length;
 main.innerHTML=header()+(page==="cliente"?clientContent():(page==="preparacao"?stationCards():"")+toolbar(total)+`<div id="results">${page==="preparacao"?boardContent():listContent()}</div>`)+`<footer><span>Delicias do Mar <b>·</b> Loulé</span><span>${icon("waves",19)} Central de encomendas</span></footer>`;
 renderSync();
}
function rerenderResults(){const el=$("#results");if(el)el.innerHTML=page==="preparacao"?boardContent():listContent();}
function setDay(d){if(!d||d===day)return;day=d;orders=[];loaded=false;synced=false;render();sync();}
function updateOrder(o){if(o.day!==day)return;const i=orders.findIndex(x=>x.id===o.id);if(i<0)orders.push(o);else if(orders[i].version<=o.version)orders[i]=o;}
async function mutate(o,action,extra={}){
 if(busy||!o)return;busy=true;
 try{
 const target=extra.station||station;
 const send=version=>request("/api/orders/"+o.id,{version,action,station:target,...extra});
 let result;
 try{result=await send(o.version);}catch(error){
  if(error.status!==409||action==="handoff")throw error;
  const fresh=(await request("/api/orders?day="+encodeURIComponent(o.day))).orders.find(x=>x.id===o.id);
  const signature=x=>JSON.stringify([x.tasks[target],target==="barcas"?x.boatSteps:null,x.items.filter(i=>group(i)===target)]);
  if(!fresh||fresh.handed||signature(fresh)!==signature(o))throw error;
  result=await send(fresh.version);
 }
 const {order}=result;
 ++serial;updateOrder(order);synced=true;render();if(dialog.open&&dialogMode==="detail")drawDetail();
 if(action==="advance")notice(order.tasks[extra.station||station]===2?"Preparação concluída.":"Preparação iniciada.");
 if(action==="handoff")notice("Entrega registada.");
 }catch(e){notice(e.message||"Não foi possível guardar.");await sync();if(dialog.open&&dialogMode==="detail")drawDetail();}
 finally{busy=false;}
}
function openDialog(mode){dialogMode=mode;dialog.classList.toggle("form-dialog",mode==="order");if(!dialog.open)dialog.showModal();dialog.scrollTop=0;}
const modalHead=(eyebrow,title)=>`<div class="modal-head"><div><div class="kicker">${eyebrow}</div><h2 id="dialog-title">${title}</h2></div><button class="close" type="button" data-act="close" aria-label="Fechar">${icon("close",20)}</button></div>`;
function openDetail(id){detailId=Number(id);openDialog("detail");drawDetail();}
function workControls(o,s){
 const n=o.tasks[s],chek=o.boatSteps||{};
 return `<div class="task-head"><h3>${icon(s==="barcas"?"boat":"fish")} ${stations[s]}</h3>${statusPill(n)}</div>
 <div class="task-lines">${o.items.filter(i=>group(i)===s).map(i=>`<div class="task-line">${icon(n===2?"checked":s==="barcas"?"boat":"fish",18)}<div><strong>${esc(label(i))}${i.qty>1&&s==="barcas"?" × "+fmtQty(i.qty):""}</strong><small>${esc(lineDescription(i))}${s==="barcas"&&i.note?" · "+esc(i.note):""}</small></div></div>`).join("")}</div>
 ${s==="barcas"&&n===1?`<div class="boat-check"><label><input data-step="gathered" type="checkbox" ${chek.gathered?"checked":""}> Marisco recolhido</label><label for="cozedura">Cozedura no posto das barcas</label><select id="cozedura" data-step="cooked"><option value="pending">Por confirmar</option><option value="done" ${chek.cooked==="done"?"selected":""}>Marisco cozido neste posto</option><option value="skip" ${chek.cooked==="skip"?"selected":""}>Já cozido / dispensada</option></select><label><input type="checkbox" data-step="assembled" ${chek.assembled?"checked":""}> Montagem concluída</label></div>`:""}
 ${o.handed?"":`<div class="task-btns">${n>0?`<button class="btn minor" data-task="back" data-s="${s}">${n===1?"Voltar a por iniciar":"Reabrir preparação"}</button>`:""}${n<2?`<button class="btn dark" data-task="advance" data-s="${s}" ${s==="barcas"&&n===1&&(!chek.gathered||!chek.assembled||chek.cooked==="pending")?"disabled":""}>${icon(n?"check":"play",15)}${n?"Concluir preparação":"Iniciar preparação"}</button>`:""}</div>`}`;
}
function drawDetail(){
 const o=findOrder(detailId);if(!o)return;
 const pos=dialog.scrollTop;
 const state=o.handed?"Entregue":globalState(o)===2?"Pronta para entrega":globalState(o)===1?"Em preparação":"Por iniciar";
 panel.innerHTML=modalHead(`${code(o.id)} · ${esc(o.channel)}`,esc(o.name))+`<div class="modal-body"><div class="detail-info"><span>${icon("calendar",16)}${dateText(o.day,{day:"numeric",month:"short"})} · ${esc(o.time)}</span><span>${icon(modeIcon(o),16)}${esc(o.delivery)}</span><span>${icon("user",16)}${typeName(o)}</span></div>
 ${o.address||o.phone?`<p class="detail-contact">${[esc(o.address),esc(o.phone)].filter(Boolean).join(" · ")}</p>`:""}${o.note?`<div class="note">${icon("note",17)}<div><strong>Notas de preparação</strong><p>${esc(o.note)}</p></div></div>`:""}
 ${Object.keys(o.tasks).sort((a,b)=>a===station?-1:b===station?1:0).map(s=>`<section class="task">${workControls(o,s)}</section>`).join("")}
 <div class="global"><div><small>Estado da encomenda completa</small><strong>${state}</strong></div>${globalState(o)===2&&!o.handed?`<button class="btn primary" data-task="handoff">${icon("bag",16)} Registar entrega</button>`:""}</div></div>`;
 dialog.scrollTop=pos;
}

const mkKey=()=>globalThis.crypto?.randomUUID?.()||"demo-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2);
let draftScope="",draftStep=1,hadFormError="";
function startOrder(cat=page==="preparacao"&&station==="bancada"?1:0){
 const scope=page==="cliente"?"Cliente":"Equipa";
 if(!draft||draftScope!==scope){
 const t=new Date(Date.now()+3600000);draft={name:"",phone:"",type:"particular",delivery:"Levantamento",address:"",day:day<dayNow()?dayNow():day,time:new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Lisbon",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(t),note:"",priority:false,channel:scope,items:[],requestKey:mkKey()};draftScope=scope;draftStep=1;
 }
 hadFormError="";editIndex=-1;entry=defaultEntry(catalog.find(p=>p.cat===cat).id);openDialog("order");drawForm();
}
function defaultEntry(id){const p=product(id);return {product:id,qty:1,cut:p.cat===1?cuts[0]:"",people:p.cat===0?[3,6,10][catalog.filter(x=>x.cat===0).indexOf(p)]:1,use:"Refeição",budget:p.budget||0,note:""};}
const opts=(items,v)=>items.map(([id,t])=>`<option value="${esc(id)}" ${String(v)===String(id)?"selected":""}>${esc(t)}</option>`).join("");
const input=(label,key,value,attrs="")=>`<label class="field"><span>${label}</span><input data-field="${key}" value="${esc(value)}" ${attrs}></label>`;
function entryEditor(){
 const p=product(entry.product);
 return `<div class="editor"><div class="form-grid"><label class="field"><span>Categoria</span><select id="categoryPick">${opts(categories.map((t,n)=>[n,t]),p.cat)}</select></label><label class="field"><span>Produto</span><select id="productPick">${opts(catalog.filter(x=>x.cat===p.cat).map(x=>[x.id,x.name]),p.id)}</select></label></div>
 ${p.cat===0?`<p class="boat-price">${icon("boat",16)} ${p.size} · Referência de ${p.budget} € em marisco por barca</p><div class="form-grid three">${input("N.º de barcas","i.qty",entry.qty,'type="number" min="1" max="9999" step="1" required')}${input("Pessoas por barca","i.people",entry.people,'type="number" min="1" max="300" step="1" required')}${input("Marisco por barca (€)","i.budget",entry.budget,'type="number" min="1" max="10000" step="0.01" required')}</div><label class="field"><span>Tipo de serviço</span><select data-field="i.use">${opts(["Refeição","Petisco"].map(x=>[x,x]),entry.use)}</select></label>`:
 `<div class="form-grid">${input("Quantidade ("+p.unit+")","i.qty",entry.qty,`type="number" min="${p.unit==="un."?1:"0.01"}" max="9999" step="${p.unit==="un."?1:"0.01"}" required`)}${p.cat===1?`<label class="field"><span>Preparação</span><select data-field="i.cut">${opts(cuts.map(x=>[x,x]),entry.cut)}</select></label>`:""}</div>`}
 ${input("Instruções do artigo (opcional)","i.note",entry.note,'maxlength="200" placeholder="Ex. embalar em separado"')}
 <button type="submit" class="btn outline">${icon(editIndex<0?"plus":"check",16)}${editIndex<0?"Adicionar à encomenda":"Guardar artigo"}</button>${editIndex>=0?button("","Cancelar edição","canceledit","minor"):""}</div>`;
}
function drawForm(){
 if(!draft)return;
 const customer=draft.channel==="Cliente",title=customer?"A sua encomenda":"Nova encomenda";
 panel.innerHTML=modalHead(customer?"VISTA CLIENTE · DEMO":"EQUIPA · DEMO",title)+`<div class="modal-body"><div class="steps"><span class="${draftStep===1?"current":""}">1 &nbsp; Artigos</span><span class="${draftStep===2?"current":""}">2 &nbsp; Cliente e horário</span></div>${hadFormError?`<div class="error" role="alert">${esc(hadFormError)}</div>`:""}
 ${draftStep===1?`<form id="itemForm">${entryEditor()}</form><div class="cart-title"><strong>Artigos na encomenda</strong><span class="total">${draft.items.length}</span></div><div class="cart-lines">${draft.items.map((i,k)=>`<div class="cart-row"><div><strong>${esc(label(i))} ${product(i.product).cat===0&&i.qty>1?"× "+fmtQty(i.qty):""}</strong><small>${esc(lineDescription(i))}</small></div><button type="button" class="textbtn" data-edit="${k}">Editar</button><button type="button" class="close" data-remove="${k}" aria-label="Remover ${esc(label(i))}">${icon("trash",16)}</button></div>`).join("")||'<p>Adicione o primeiro artigo para continuar.</p>'}</div><div class="form-foot">${button("","Fechar","close","minor")}<button type="button" data-act="next" class="btn primary" ${draft.items.length&&editIndex<0?"":"disabled"}>Continuar</button></div>`:
 `<form id="orderForm"><div class="form-grid">${input("Nome do cliente ou restaurante","o.name",draft.name,'maxlength="80" required autocomplete="name"')}<label class="field"><span>Cliente</span><select data-field="o.type">${opts([["particular","Particular"],["restaurante","Restaurante"]],draft.type)}</select></label></div>
 <div class="form-grid">${input("Contacto (opcional)","o.phone",draft.phone,'type="tel" maxlength="25" autocomplete="tel"')}<label class="field"><span>Modalidade</span><select data-field="o.delivery">${opts(["Levantamento","Entrega"].map(x=>[x,x]),draft.delivery)}</select></label></div>
 ${draft.delivery==="Entrega"?input("Morada de entrega","o.address",draft.address,'maxlength="200" autocomplete="street-address" required'):""}
 <div class="form-grid">${input("Dia","o.day",draft.day,`type="date" min="${dayNow()}" max="${shiftDay(dayNow(),365)}" required`)}${input("Hora pretendida","o.time",draft.time,'type="time" required')}</div><label class="field"><span>Notas de preparação (opcional)</span><textarea data-field="o.note" maxlength="600" rows="2">${esc(draft.note)}</textarea></label>${customer?"":`<label class="checkfield"><input type="checkbox" data-field="o.priority" ${draft.priority?"checked":""}> Encomenda prioritária</label>`}
 <div class="summary"><strong>${draft.items.length===1?"1 artigo":draft.items.length+" artigos"}</strong><span>${esc(draft.items.map(i=>label(i)).join(" · "))}</span></div>
 <p class="helptext">${icon("info",15)} Pedido de demonstração. Não implica pagamento ou reserva.</p><div class="form-foot">${button("","Voltar aos artigos","prev","minor")}<button type="submit" class="btn primary" ${busy?"disabled":""}>${icon("check",16)}${busy?"A registar…":"Confirmar encomenda"}</button></div></form>`}</div>`;
}
async function submitOrder(){
 if(busy)return;busy=true;hadFormError="";drawForm();
 try{
 const {order:o}=await request("/api/orders",draft);const scope=draftScope;draft=null;entry=null;draftStep=1;
 if(scope!=="Cliente"){if(day!==o.day){day=o.day;orders=[];loaded=false;}updateOrder(o);}
 dialogMode="success";panel.innerHTML=modalHead("ENCOMENDA REGISTADA",code(o.id))+`<div class="modal-body success"><div class="success-icon">${icon("check",27)}</div><h3>Encomenda de teste recebida</h3><p>${esc(o.name)} · ${dateText(o.day,{day:"numeric",month:"long"})} às ${esc(o.time)}.</p><div class="summary"><strong>Preparação</strong><span>${esc(Object.keys(o.tasks).map(k=>stations[k]).join(" + "))}</span></div><div class="form-foot">${button("check","Concluir","close","primary")}</div></div>`;render();await sync();
 }catch(e){hadFormError=e.message||"Não foi possível registar o pedido.";busy=false;drawForm();dialog.scrollTop=0;}finally{busy=false;}
}
document.addEventListener("input",e=>{
 const t=e.target;if(t.id==="search"){query=t.value;rerenderResults();return;}
 if(t.dataset.field&&draft){const [who,k]=t.dataset.field.split(".");(who==="i"?entry:draft)[k]=t.type==="checkbox"?t.checked:t.value;}
});
document.addEventListener("change",e=>{
 const t=e.target;
 if(t.id==="orderDay"){setDay(t.value);return;}
 if(t.id==="productPick"||t.id==="categoryPick"){entry=defaultEntry(t.id==="productPick"?t.value:catalog.find(p=>p.cat===+t.value).id);drawForm();return;}
 if(t.dataset.field==="o.delivery"){draft.delivery=t.value;drawForm();return;}
 if(t.dataset.line){mutate(findOrder(detailId),"line",{station:t.dataset.s,line:+t.dataset.line,done:t.checked});return;}
 if(t.dataset.step){mutate(findOrder(detailId),"boat",{station:"barcas",step:t.dataset.step,value:t.type==="checkbox"?t.checked:t.value});return;}
});
document.addEventListener("submit",e=>{
 if(e.target.id==="itemForm"){e.preventDefault();if(editIndex<0&&draft.items.length>=50){notice("Máximo de 50 artigos por encomenda.");return;}
 const p=product(entry.product);const item={...entry,qty:Number(entry.qty),people:Number(entry.people),budget:Number(entry.budget)};
 if(editIndex>=0)draft.items[editIndex]=item;else draft.items.push(item);editIndex=-1;entry=defaultEntry(p.id);drawForm();notice("Artigo guardado na encomenda.");}
 if(e.target.id==="orderForm"){e.preventDefault();submitOrder();}
});
document.addEventListener("click",async e=>{
 if(e.target===dialog){const rect=dialog.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom){if(!busy)dialog.close();}return;}
 const b=e.target.closest("button");if(!b){if(menu&&!e.target.closest(".filterwrap")){menu="";render();}return;}
 if(b.dataset.station){selectStation(b.dataset.station);return;}
 if(b.dataset.filter){filter=b.dataset.filter;menu="";render();return;}
 if(b.dataset.list){listState=b.dataset.list;rerenderResults();return;}
 if(b.dataset.detail){openDetail(b.dataset.detail);return;}
 if(b.dataset.advance){const o=findOrder(b.dataset.advance);if(station==="barcas"&&o.tasks.barcas===1&&(!o.boatSteps.gathered||!o.boatSteps.assembled||o.boatSteps.cooked==="pending")){openDetail(o.id);return;}await mutate(o,"advance");return;}
 if(b.dataset.task){await mutate(findOrder(detailId),b.dataset.task,{station:b.dataset.s||station});return;}
 if(b.dataset.startcat!==undefined){startOrder(+b.dataset.startcat);return;}
 if(b.dataset.edit!==undefined){editIndex=+b.dataset.edit;entry={...draft.items[editIndex]};drawForm();dialog.scrollTop=0;return;}
 if(b.dataset.remove!==undefined){draft.items.splice(+b.dataset.remove,1);editIndex=-1;entry=defaultEntry(entry.product);drawForm();return;}
 const act=b.dataset.act;
 if(act==="new")startOrder();
 if(act==="close"&&!busy)dialog.close();
 if(act==="filter"){menu=menu==="filter"?"":"filter";render();}
 if(act==="next"||act==="prev"){if(act==="next"&&!draft.items.length)return;draftStep=act==="next"?2:1;hadFormError="";drawForm();dialog.scrollTop=0;}
 if(act==="canceledit"){editIndex=-1;entry=defaultEntry(entry.product);drawForm();}
 if(act==="focus"){focusMode=!focusMode;document.body.classList.toggle("focus",focusMode);render();try{if(focusMode&&!document.fullscreenElement)await document.documentElement.requestFullscreen();else if(!focusMode&&document.fullscreenElement)await document.exitFullscreen();}catch{}}
});
dialog.addEventListener("cancel",e=>{if(busy)e.preventDefault();});
dialog.addEventListener("close",()=>{detailId=null;dialogMode="";});
document.addEventListener("fullscreenchange",()=>{if(!document.fullscreenElement&&focusMode){focusMode=false;document.body.classList.remove("focus");render();}});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&menu){menu="";render();}});
window.addEventListener("hashchange",route);window.addEventListener("online",sync);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)sync();});
document.querySelector("#retrySync").onclick=sync;
setInterval(()=>{if(!document.hidden&&!busy)sync();},3500);route();
