const pngPrefix = "data:image/png;base64,";
const namePrefix = "ddm-ink:";

export function decodeNameDrawing(value) {
 if(typeof value !== "string" || !value.startsWith(namePrefix) || value.length > 120000) return "";
 const png = value.slice(namePrefix.length);
 return /^iVBORw0KGgo[A-Za-z0-9+/]+={0,2}$/.test(png) ? pngPrefix + png : "";
}

export function encodeNameDrawing(png) {
 return namePrefix + png.slice(pngPrefix.length);
}

export function openPad(host, drawing, onChange, {undo=false,extend=false,onLimit=()=>{}}={}) {
 const canvas = host.querySelector("canvas");
 const clear = host.querySelector("button");
 const context = canvas.getContext("2d");
 const brushRadius = 2.5;
 let activePointer = null;
 const strokes=[];
 const initialHeight=canvas.height;
 const maxHeight=3840;
 let background=null, backgroundHeight=0, inkBottom=0;
 let activeStroke=null;
 let previous;
 let loading = Boolean(drawing);
 clear.disabled = true;
 function brush(){
  context.fillStyle=context.strokeStyle="#102d3d";
  context.lineWidth=brushRadius*2;
  context.lineCap=context.lineJoin="round";
 }
 function dot(p){
  context.beginPath();context.arc(...p,brushRadius,0,2*Math.PI);context.fill();
 }
 function line(a,b){
  context.beginPath();context.moveTo(...a);context.lineTo(...b);context.stroke();
 }
 function replay(){
  context.clearRect(0,0,canvas.width,canvas.height);
  if(background)context.drawImage(background,0,0,canvas.width,backgroundHeight);
  inkBottom=backgroundHeight;
  for(const stroke of strokes){
   dot(stroke[0]);
   for(let i=1;i<stroke.length;i++)line(stroke[i-1],stroke[i]);
   for(const p of stroke)inkBottom=Math.max(inkBottom,p[1]+brushRadius);
  }
 }
 function picture(){
  if(!background&&!strokes.length)return "";
  if(!extend)return canvas.toDataURL("image/png");
  // Keep empty writing space in the editor, and only the written lines on tickets.
  const paper=document.createElement("canvas");
  paper.width=canvas.width;paper.height=Math.min(canvas.height,Math.ceil(inkBottom)+1);
  paper.getContext("2d").drawImage(canvas,0,0);
  return paper.toDataURL("image/png");
 }
 function makeRoom(){
  if(!extend||inkBottom<canvas.height-64||canvas.height>=maxHeight)return false;
  canvas.height=Math.min(maxHeight,Math.ceil(inkBottom)+230);
  brush();replay();
  return true;
 }
 brush();

 if(drawing) {
  const saved = new Image();
  saved.onload = () => {
   background=saved;
   backgroundHeight=extend?Math.min(maxHeight,Math.round(saved.naturalHeight*canvas.width/saved.naturalWidth)):initialHeight;
   if(extend)canvas.height=Math.min(maxHeight,Math.max(initialHeight,backgroundHeight+80));
   brush();replay();
   loading = false;
   clear.disabled = undo;
  };
  saved.onerror = () => { loading = false; clear.disabled = undo; };
  saved.src = drawing;
 }
 clear.onclick = () => {
  if(undo){
   if(!strokes.pop())return;
   replay();clear.disabled=!strokes.length;
   onChange(picture());
   return;
  }
  context.clearRect(0, 0, canvas.width, canvas.height);
  clear.disabled = true;
  onChange("");
 };
 function point(event) {
  const box = canvas.getBoundingClientRect();
  return [
   Math.max(0,Math.min(canvas.width,(event.clientX-box.left)*canvas.width/box.width)),
   Math.max(0,Math.min(canvas.height,(event.clientY-box.top)*canvas.height/box.height))
  ];
 }
 canvas.onpointerdown = event => {
  if(loading || activePointer !== null || !event.isPrimary || event.button !== 0) return;
  activePointer = event.pointerId;
  canvas.setPointerCapture(activePointer);
  previous = point(event);
  if(undo){activeStroke=[previous];strokes.push(activeStroke);}
  inkBottom=Math.max(inkBottom,previous[1]+brushRadius);
  dot(previous);
  clear.disabled = true;
 };
 canvas.onpointermove = event => {
  if(event.pointerId !== activePointer) return;
  const next = point(event);
  if(activeStroke)activeStroke.push(next);
  inkBottom=Math.max(inkBottom,next[1]+brushRadius);
  line(previous,next);
  previous = next;
 };
 function finish(event) {
  if(event.pointerId !== activePointer) return;
  activePointer = null;
  activeStroke=null;
  clear.disabled=false;
  const png=undo?picture():canvas.toDataURL("image/png");
  if(extend&&png.length>450000){
   strokes.pop();replay();clear.disabled=!strokes.length;
   onLimit("A folha atingiu o limite. O último traço foi desfeito. Pode guardar o pedido.");
   return;
  }
  onChange(png);
  if(makeRoom()){
   const bounds=canvas.getBoundingClientRect();
   const y=bounds.top+previous[1]*bounds.width/canvas.width;
   const dialog=host.closest("dialog");
   if(dialog&&y>dialog.getBoundingClientRect().bottom-80)dialog.scrollBy(0,100);
  }else if(extend&&inkBottom>maxHeight-64){
   onLimit("Chegou ao fim desta folha. Pode guardar e continuar noutra.");
  }
 }
 canvas.onpointerup = canvas.onpointercancel = canvas.onlostpointercapture = finish;
}
