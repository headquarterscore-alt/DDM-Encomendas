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

export function openPad(host, drawing, onChange, {undo=false}={}) {
 const canvas = host.querySelector("canvas");
 const clear = host.querySelector("button");
 const context = canvas.getContext("2d");
 const brushRadius = 2.5;
 let activePointer = null;
 const history=[];
 let hasInk=Boolean(drawing);
 let previous;
 let loading = Boolean(drawing);
 clear.disabled = true;
 context.fillStyle = context.strokeStyle = "#102d3d";
 context.lineWidth = brushRadius * 2;
 context.lineCap = "round";
 context.lineJoin = "round";

 if(drawing) {
  const saved = new Image();
  saved.onload = () => {
   context.drawImage(saved, 0, 0, canvas.width, canvas.height);
   loading = false;
   clear.disabled = undo;
  };
  saved.onerror = () => { loading = false; clear.disabled = false; };
  saved.src = drawing;
 }
 clear.onclick = () => {
  if(undo){
   const last=history.pop();if(!last)return;
   context.putImageData(last.image,0,0);hasInk=last.hasInk;
   clear.disabled=!history.length;
   onChange(hasInk?canvas.toDataURL("image/png"):"");
   return;
  }
  context.clearRect(0, 0, canvas.width, canvas.height);
  clear.disabled = true;
  onChange("");
 };
 function point(event) {
  const box = canvas.getBoundingClientRect();
  return [
   (event.clientX - box.left) * canvas.width / box.width,
   (event.clientY - box.top) * canvas.height / box.height
  ];
 }
 canvas.onpointerdown = event => {
  if(loading || activePointer !== null || !event.isPrimary || event.button !== 0) return;
  if(undo){
   if(history.length===16)history.shift();
   history.push({image:context.getImageData(0,0,canvas.width,canvas.height),hasInk});
   hasInk=true;
  }
  activePointer = event.pointerId;
  canvas.setPointerCapture(activePointer);
  previous = point(event);
  context.beginPath();
  context.arc(...previous, brushRadius, 0, 2 * Math.PI);
  context.fill();
  clear.disabled = true;
 };
 canvas.onpointermove = event => {
  if(event.pointerId !== activePointer) return;
  const next = point(event);
  context.beginPath();
  context.moveTo(...previous);
  context.lineTo(...next);
  context.stroke();
  previous = next;
 };
 function finish(event) {
  if(event.pointerId !== activePointer) return;
  activePointer = null;
  clear.disabled = false;
  onChange(canvas.toDataURL("image/png"));
 }
 canvas.onpointerup = canvas.onpointercancel = canvas.onlostpointercapture = finish;
}
