import {acceptSample,sampleText} from './folha-store.js';
export function teamAuth(_base,_publicKey,onChange){
 const banner=document.createElement("aside");
 banner.className="review-banner";
 banner.innerHTML=`<span>Pré-visualização · Pedidos só neste navegador</span>
  <button type="button" class="btn" data-sample>Simular SMS</button>
  <section data-inbox hidden aria-label="Recebidos">
   <h2>Recebidos</h2><strong>Mar Azul</strong><p data-sms></p>
   <p data-answer hidden>Resposta simulada · «Confirmo as 18h, obrigado!»</p>
   <div>
    <button type="button" class="btn primary" data-decision="accept">Aceitar</button>
    <button type="button" class="btn" data-decision="contact">Contactar</button>
    <button type="button" class="btn" data-decision="reject">Recusar</button>
   </div>
  </section><span role="status" data-result></span>`;
 const inbox=banner.querySelector('[data-inbox]'),simulate=banner.querySelector('[data-sample]'),result=banner.querySelector('[data-result]');
 const key="ddm-preview-incoming-v1";
 const dayInLisbon=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Lisbon'}).format(new Date());
 function refresh(){
  const pending=JSON.parse(localStorage.getItem(key)||'null');
  inbox.hidden=!pending;simulate.disabled=Boolean(pending);
  banner.querySelector('[data-answer]').hidden=!pending?.contacted;
  banner.querySelector('[data-decision="contact"]').disabled=Boolean(pending?.contacted);
 }
 banner.querySelector('[data-sms]').textContent=sampleText;
 banner.onclick=e=>{
  if(e.target.closest('[data-sample]')){
   if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({id:crypto.randomUUID(),day:dayInLisbon()}));
   result.textContent="";refresh();return;
  }
  const action=e.target.closest('[data-decision]')?.dataset.decision;
  const pending=JSON.parse(localStorage.getItem(key)||'null');
  if(!pending||!action)return;
  if(action==="contact"){
   pending.contacted=true;localStorage.setItem(key,JSON.stringify(pending));
  }else{
   if(action==="accept"){
    acceptSample(pending.id,pending.day);
    location.hash="encomendas/bancada";
    const picker=document.querySelector('#orderDay');
    if(picker&&picker.value!==pending.day){picker.value=pending.day;picker.dispatchEvent(new Event("change",{bubbles:true}));}
    document.querySelector('[data-filter="all"]')?.click();
    document.querySelector('#retrySync').click();
   }
   localStorage.removeItem(key);result.textContent=action==="accept"?"Pedido aceite · Peixe-Marisco":"Pedido recusado";
  }
  refresh();
 };
 window.addEventListener("storage",e=>{if(e.key===key)refresh();});
 refresh();
 document.body.prepend(banner);
 queueMicrotask(()=>onChange({access_token:"local-preview",user:{id:"local-counter-preview"}}));
 return {reject(){}};
}
