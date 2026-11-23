export function teamAuth(_base,_publicKey,onChange){
 const banner=document.createElement("aside");
 banner.className="review-banner";
 banner.textContent="Pré-visualização · As folhas de teste ficam neste navegador";
 document.body.prepend(banner);
 queueMicrotask(()=>onChange({access_token:"local-preview",user:{id:"local-counter-preview"}}));
 return {reject(){}};
}
