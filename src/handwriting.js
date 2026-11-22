import {createWorker, PSM} from 'tesseract.js';

export function openPad(host, field){
 host.innerHTML='<canvas width="900" height="210" aria-label="Escreva o nome em letra de imprensa"></canvas><small>Escreva em letra de imprensa</small><div><button type="button" class="btn">Limpar</button> <button type="button" class="btn">Ler nome</button></div><span role="status"></span>';
 const canvas=host.querySelector('canvas'),ctx=canvas.getContext('2d');
 const [clear,read]=host.querySelectorAll('button'),status=host.querySelector('[role=status]');
 function reset(){ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);read.disabled=true;}
 reset();clear.onclick=reset;
 function point(e){
  const box=canvas.getBoundingClientRect();
  return [(e.clientX-box.left)*canvas.width/box.width,(e.clientY-box.top)*canvas.height/box.height];
 }
 canvas.onpointerdown=e=>{
  if(!e.isPrimary||clear.disabled)return;
  canvas.setPointerCapture(e.pointerId);ctx.lineWidth=5;ctx.lineCap='round';ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(...point(e));read.disabled=false;
 };
 canvas.onpointermove=e=>{if(canvas.hasPointerCapture(e.pointerId)){ctx.lineTo(...point(e));ctx.stroke();}};
 read.onclick=async()=>{
  clear.disabled=read.disabled=true;status.textContent='A ler o nome…';
  const original=field.value;
  let worker;
  try{
   const path=new URL('./ocr/',document.baseURI).href;
   worker=await createWorker('por',1,{workerPath:path+'worker.min.js',corePath:path+'core.wasm.js',langPath:path});
   await worker.setParameters({tessedit_pageseg_mode:PSM.SINGLE_LINE});
   const {data}=await worker.recognize(canvas);
   if(!field.isConnected||field.value!==original)return;
   const name=data.text.trim().replace(/\s+/g,' ').slice(0,80);
   if(name){field.value=name;field.dispatchEvent(new Event('input',{bubbles:true}));status.textContent='Confirme o nome acima.';}
   else status.textContent='Escreva novamente ou use o teclado.';
  }catch{status.textContent='Não foi possível ler. Pode escrever o nome com o teclado.';}
  finally{clear.disabled=read.disabled=false;if(worker)await worker.terminate();}
 };
}
