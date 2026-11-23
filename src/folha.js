import {openPad,encodeNameDrawing,decodeNameDrawing} from './handwriting.js';

export function counterSheets({panel,dialog,openDialog,modalHead,esc,displayName,rest,today,lastDay,keyFor,mkKey,onSaved,onCatalog,maySave}) {
 let sheet, contacts=[], revision=0, saving=false;
 const key=()=>keyFor("Folha");
 const persist=()=>{try{localStorage.setItem(key(),JSON.stringify(sheet));}catch{}};
 const freshIdentity=()=>({contact:mkKey(),name:"",typed:false});
 const message=text=>{const el=panel.querySelector('[data-sheet-message]');if(el)el.textContent=text;};
 const choice=(value,label,active)=>`<button type="button" class="btn" data-choice="${value}" aria-pressed="${active}">${label}</button>`;
 const pad=(id,label,width,height)=>`<div class="counter-pad" id="${id}"><canvas aria-label="${label}" width="${width}" height="${height}"></canvas><button type="button" class="btn pad-undo" title="Desfazer último traço" aria-label="Desfazer último traço">↶</button></div>`;
 function recentButtons(list,attr){
  return list.map(c=>`<button type="button" class="btn" ${attr}="${esc(c.contact_id)}">${displayName(c.name)}</button>`).join("");
 }
 async function loadContacts(){
  const results=[];
  for(let offset=0;;offset+=100){
   const page=await rest('rpc/counter_contacts?limit=100&offset='+offset);
   results.push(...page);
   if(page.length<100)return results;
  }
 }
 async function open(){
  const token=++revision;
  if(!sheet){try{sheet=JSON.parse(localStorage.getItem(key()));}catch{}}
  if(!sheet?.requestKey)sheet={...freshIdentity(),requestKey:mkKey(),kind:"particular",drawing:"",day:today(),time:""};
  openDialog("sheet");draw();
  try{
   const list=await loadContacts();
   if(token!==revision||!dialog.open||!panel.querySelector('#counterForm'))return;
   contacts=list;updateRecents();
  }catch{if(token===revision)message("Não foi possível carregar os contactos habituais.");}
 }
 function updateRecents(){
  const box=panel.querySelector('[data-recents]');if(!box)return;
  const list=contacts.filter(c=>c.kind===sheet.kind);
  const favourites=sheet.kind==="particular"?contacts.filter(c=>c.kind==="restaurante").slice(0,2):[];
  box.innerHTML=recentButtons(favourites,"data-contact")+recentButtons(list.slice(0,3),"data-contact")+(list.length>3?`<details><summary>Ver todos</summary>${recentButtons(list.slice(3),"data-contact")}</details>`:"");
 }
 function draw(){
  const client=sheet.kind==="particular";
  const named=sheet.selected;
  panel.innerHTML=modalHead("Peixe-Marisco","Folha de balcão")+`<form id="counterForm" class="counter-form">
   <div class="counter-choices">${choice("particular","Cliente",client)}${choice("restaurante","Restaurante",!client)}</div>
   ${named?`<div class="counter-selected"><strong>${displayName(sheet.name)}</strong><button type="button" class="btn" data-other>Alterar</button></div>`:
    `<div class="counter-recents" data-recents></div>
    ${!client||sheet.typed?`<label class="field">Nome ${client?"do cliente":"do restaurante"}<input id="counterName" maxlength="100" value="${esc(sheet.name)}" required></label>`:
    `<div class="counter-label">Nome do cliente <button type="button" class="text-action" data-type-name>Usar teclado</button></div>${pad("counterNamePad","Desenhar nome do cliente",700,95)}`}`}
   <div class="counter-label">Pedido</div>${pad("counterOrderPad","Escrever o pedido",900,340)}
   <div class="counter-bottom"><label class="field"><span id="sheetDayLabel">${sheet.day===today()?"Hoje":"Dia de levantamento"}</span><input type="date" aria-label="Dia de levantamento" id="sheetDay" required min="${today()}" max="${lastDay()}" value="${esc(sheet.day)}"></label>
   <label class="field"><span id="sheetTimeLabel">${sheet.time?"Hora de levantamento":"Hora a combinar"}</span><input type="time" id="sheetTime" aria-label="Hora de levantamento" value="${esc(sheet.time)}"></label>
   <button class="btn primary" type="submit">Guardar</button></div>
   <p data-sheet-message role="status"></p><button type="button" class="text-action" data-catalog>Usar catálogo</button></form>`;
  updateRecents();
  const namePad=panel.querySelector('#counterNamePad');
  if(namePad)openPad(namePad,decodeNameDrawing(sheet.name),png=>{sheet.name=png?encodeNameDrawing(png):"";persist();},{undo:true});
  openPad(panel.querySelector('#counterOrderPad'),sheet.drawing,png=>{sheet.drawing=png;persist();},{undo:true});
  const form=panel.querySelector('#counterForm');
  form.oninput=e=>{
   if(e.target.id==="counterName")sheet.name=e.target.value;
   if(e.target.id==="sheetDay"){sheet.day=e.target.value;form.querySelector("#sheetDayLabel").textContent=sheet.day===today()?"Hoje":"Dia de levantamento";}
   if(e.target.id==="sheetTime"){sheet.time=e.target.value;form.querySelector("#sheetTimeLabel").textContent=sheet.time?"Hora de levantamento":"Hora a combinar";}
   persist();
  };
  form.onclick=e=>{
   if(saving)return;
   const b=e.target.closest('button');if(!b)return;
   if(b.hasAttribute("data-catalog")){onCatalog();return;}
   if(b.dataset.choice&&sheet.kind!==b.dataset.choice){sheet.kind=b.dataset.choice;Object.assign(sheet,freshIdentity(),{selected:false});}
   else if(b.dataset.contact){const c=contacts.find(c=>c.contact_id===b.dataset.contact);if(!c)return;Object.assign(sheet,{kind:c.kind,contact:c.contact_id,name:c.name,selected:true});}
   else if(b.hasAttribute('data-other'))Object.assign(sheet,freshIdentity(),{selected:false});
   else if(b.hasAttribute('data-type-name'))Object.assign(sheet,{typed:true,name:""});
   else return;
   persist();draw();
  };
  form.onsubmit=async e=>{
   e.preventDefault();if(saving)return;
   if(!sheet.name.trim()){message("Indique o nome.");return;}
   if(!sheet.drawing){message("Escreva o pedido na folha.");return;}
   if(sheet.drawing.length>450000){message("A folha está demasiado cheia. Reduza o desenho antes de guardar.");return;}
   if(!maySave()){message("Aguarde a ligação para guardar.");return;}
   const pending=sheet;
   saving=true;panel.inert=true;message("A guardar…");
   try{
    const result=await rest("rpc/create_counter_sheet",{payload:{client_token:sheet.requestKey,kind:sheet.kind,contact_id:sheet.contact,name:sheet.name.trim(),day:sheet.day,time:sheet.time,drawing:sheet.drawing}});
    if(sheet!==pending)return;
    await onSaved(result.id);
    if(sheet!==pending)return;
    try{localStorage.removeItem(key());}catch{}
    sheet=null;dialog.close();
   }catch(e){if(sheet===pending)message(e.status===404?"A folha aguarda a atualização da base de dados.":e.message);}
   finally{saving=false;panel.inert=false;}
  };
 }
 async function directory(){
  const token=++revision;
  openDialog("counter-history");panel.innerHTML=modalHead("Histórico","Clientes e restaurantes")+'<div class="modal-body" data-directory>A carregar…</div>';
  const box=panel.querySelector('[data-directory]');
  try{
   const list=await loadContacts();if(token!==revision||!box.isConnected)return;
   box.innerHTML=["particular","restaurante"].map(kind=>`<h3>${kind==="particular"?"Clientes":"Restaurantes"}</h3><div class="counter-recents">${recentButtons(list.filter(c=>c.kind===kind),"data-history-contact")||"Sem folhas guardadas."}</div>`).join("");
   box.onclick=async e=>{
    const b=e.target.closest('[data-history-contact]');if(!b)return;
    const c=list.find(x=>x.contact_id===b.dataset.historyContact);
    panel.innerHTML=modalHead("Histórico",displayName(c.name))+'<div class="modal-body"><button type="button" class="btn" data-contacts-back>Voltar</button><div data-contact-orders aria-live="polite"></div></div>';
    panel.querySelector('[data-contacts-back]').onclick=directory;
    const target=panel.querySelector('[data-contact-orders]');
    async function more(offset){
     const rows=await rest("orders?select=id,business_date,scheduled_time,counter_time_unset,counter_sheet&counter_contact_id=eq."+encodeURIComponent(c.contact_id)+"&order=business_date.desc,id.desc&limit=20&offset="+offset);
     if(!target.isConnected)return;
     target.insertAdjacentHTML('beforeend',rows.map(o=>`<article class="counter-history-row"><strong>${esc(o.business_date.split("-").reverse().join("/"))} · ${o.counter_time_unset?"Hora a combinar":esc(o.scheduled_time.slice(0,5))}</strong>${sheetImage(o.counter_sheet)}</article>`).join(""));
     if(rows.length===20){const next=document.createElement('button');next.className="btn";next.textContent="Ver mais";target.append(next);next.onclick=()=>{next.remove();more(offset+20).catch(()=>target.append("Não foi possível carregar as folhas."));};}
    }
    try{await more(0);}catch{target.textContent="Não foi possível carregar as folhas.";}
   };
  }catch{box.textContent="Não foi possível carregar os contactos.";}
 }
 return {open,directory,isSaving:()=>saving,reset(){revision++;contacts=[];sheet=null;}};
}

export function sheetImage(src){
 return typeof src==="string"&&src.length<=450000&&/^data:image\/png;base64,iVBORw0KGgo[A-Za-z0-9+/]+=*$/.test(src)
  ?`<img class="counter-ink" src="${src}" alt="Pedido manuscrito">`:"";
}
