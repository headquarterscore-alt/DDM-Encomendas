import { GoTrueClient } from '@supabase/auth-js';

export function teamAuth(base,publicKey,onChange){
 const client=new GoTrueClient({
  url:base+'/auth/v1',headers:{apikey:publicKey},storageKey:'ddm-equipa-auth',
  persistSession:true,autoRefreshToken:true,detectSessionInUrl:false
 });
 const form=document.querySelector('#loginForm');
 const email=document.querySelector('#loginEmail'),password=document.querySelector('#loginPassword');
 const message=document.querySelector('#loginMessage'),submit=form.querySelector('button');
 let token=null,expiryTimer;
 function accept(session){
  clearTimeout(expiryTimer);
  const remaining=(session?.expires_at||0)*1000-Date.now();
  const current=remaining>0 && session.user && !session.user.is_anonymous ? session : null;
  token=current?.access_token||null;
  if(current){
   message.textContent='';password.value='';
   expiryTimer=setTimeout(()=>{if(token===current.access_token)accept(null);},remaining);
  }
  onChange(current);
 }
 client.onAuthStateChange((_event,session)=>accept(session));
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(submit.disabled)return;
  submit.disabled=true;message.textContent='A iniciar sessão…';
  try{
   const {error}=await client.signInWithPassword({email:email.value.trim(),password:password.value});
   if(error)message.textContent=error.status===400?'Confirma o e-mail e a palavra-passe.':'Não foi possível iniciar sessão. Verifica a ligação e tenta novamente.';
  }catch{message.textContent='Sem ligação. Tenta novamente.';}
  finally{submit.disabled=false;password.value='';}
 });
 async function signOut(){
  accept(null);
  try{await client.signOut({scope:'local'});}catch{message.textContent='Inicia sessão novamente.';}
 }
 document.querySelector('#signOut').addEventListener('click',signOut);
 return {reject(rejected){if(rejected===token)void signOut();}};
}
