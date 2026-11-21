
const trigger=document.querySelector("#installApp"),help=document.querySelector("#installHelp");
let invitation=null;
const standalone=()=>matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
trigger.hidden=standalone();
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();invitation=e;trigger.hidden=false});
window.addEventListener("appinstalled",()=>{invitation=null;trigger.hidden=true;if(help.open)help.close()});
document.querySelector("#closeInstall").onclick=()=>help.close();
trigger.onclick=async()=>{if(invitation){const active=invitation;invitation=null;await active.prompt();await active.userChoice;return}
const mobileApple=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
document.querySelector("#installInstructions").textContent=location.protocol==="file:"?"A instalação requer o endereço HTTPS da app.":mobileApple?"No Safari, toca em Partilhar, escolhe Adicionar ao ecrã principal e confirma em Adicionar.":/Android/i.test(navigator.userAgent)?"No menu do Chrome, escolhe Instalar aplicação ou Adicionar ao ecrã principal.":"Abre o menu do Chrome ou Edge e procura «Instalar aplicação». A app passa a abrir numa janela própria.";help.showModal();};
if("serviceWorker" in navigator&&window.isSecureContext&&location.protocol!=="file:")navigator.serviceWorker.register("./sw.js").catch(()=>{});
