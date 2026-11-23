import {acceptSample,samples} from './folha-store.js';

const key="ddm-preview-incoming-v1";
const clock=new Intl.DateTimeFormat("pt-PT",{timeZone:"Europe/Lisbon",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
const dayInLisbon=()=>new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Lisbon"}).format(new Date());

function pendingOrders(){
 const saved=JSON.parse(localStorage.getItem(key)||"[]");
 // Earlier previews stored a single Mar Azul message.
 return Array.isArray(saved)?saved:saved?.id?[{...saved,sample:0}]:[];
}
function orderCard(order){
 const sample=samples[order.sample];
 const card=document.createElement("article");
 card.className="incoming-card";
 card.dataset.incomingId=order.id;
 const received=new Date(order.receivedAt);
 const receivedTime=Number.isFinite(received.getTime())?"Recebido às "+clock.format(received):"";
 const pickupDay=order.day===dayInLisbon()?"":new Intl.DateTimeFormat("pt-PT",{day:"numeric",month:"short",timeZone:"Europe/Lisbon"}).format(new Date(order.day+"T12:00:00Z"))+" · ";
 // Sample content is fixed in the isolated review fixture.
 card.innerHTML=`<header class="incoming-meta"><span>${order.contacted?"Contactado":"Novo"} · SMS</span><small>${receivedTime}</small></header>
  <div class="incoming-title"><div><h3>${sample.name}</h3><span>Levantamento</span> <strong>${pickupDay}${sample.time}</strong></div></div>
  <div class="incoming-body">${sample.station==="barcas"?'<div class="incoming-boat"><img alt="" src="./barca_media.png"></div>':""}
   <strong>${sample.summary}</strong><p>${sample.details}</p>
   ${sample.preferred?`<p><b>Prefere</b> · ${sample.preferred.join(", ")}</p><p><b>Evitar</b> · ${sample.avoid.join(", ")}</p><p>${sample.note}</p>`:""}
   <details><summary>Ver SMS</summary><p>${sample.text}</p></details>
   ${order.contacted?`<p class="incoming-answer">Resposta simulada · «Confirmo as ${sample.time}, obrigado!»</p>`:""}
  </div>
  <div class="incoming-actions">
   <button type="button" data-decision="accept"><i aria-hidden="true">✓</i>Aceitar</button>
   <button type="button" data-decision="contact" ${order.contacted?"disabled":""}><i aria-hidden="true">☎</i>Contactar</button>
   <button type="button" data-decision="reject"><i aria-hidden="true">×</i>Recusar</button>
  </div>`;
 return card;
}

export const simulatedOrders={
 cardsFor(day){
  return pendingOrders().filter(order=>order.day===day).map(order=>orderCard(order).outerHTML);
 },
 simulate(){
  const pending=pendingOrders();
  const index=Number(localStorage.getItem(key+"-next"))%samples.length;
  pending.push({id:crypto.randomUUID(),day:dayInLisbon(),receivedAt:Date.now(),sample:index});
  localStorage.setItem(key+"-next",String((index+1)%samples.length));
  localStorage.setItem(key,JSON.stringify(pending));
 },
 decide(id,decision){
  const pending=pendingOrders(),order=pending.find(o=>o.id===id);
  if(!order)return;
  if(decision==="contact"){
   order.contacted=true;
   localStorage.setItem(key,JSON.stringify(pending));
   return;
  }
  const sample=samples[order.sample];
  if(decision==="accept")acceptSample(id,order.day,sample);
  localStorage.setItem(key,JSON.stringify(pending.filter(o=>o.id!==id)));
  return {station:decision==="accept"?sample.station:null,message:sample.name+(decision==="accept"?" · Pedido aceite":" · Pedido recusado")};
 },
 onChange(refresh){
  window.addEventListener("storage",e=>{if(e.key===key)refresh();});
 }
};

export function teamAuth(_base,_publicKey,onChange){
 const banner=document.createElement("aside");
 banner.className="review-banner";banner.textContent="Pré-visualização · Pedidos só neste navegador";
 document.body.prepend(banner);
 queueMicrotask(()=>onChange({access_token:"local-preview",user:{id:"local-counter-preview"}}));
 return {reject(){}};
}
