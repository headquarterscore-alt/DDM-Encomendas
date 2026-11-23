// Only injected into the isolated review page. All reads and writes stay in this browser.
const storageKey="ddm-preview-folhas-v1";
const demoContact={contact_id:"2462c668-63fd-4077-b5d4-6d0beb42cf19",kind:"restaurante",name:"Mar Azul"};
export async function fetch(url,options={}){
 const endpoint=new URL(url),path=endpoint.pathname.split("/").pop(),params=endpoint.searchParams;
 const rows=JSON.parse(localStorage.getItem(storageKey)||"[]");
 const body=JSON.parse(options.body||"{}");
 const reply=(data,status=200)=>new Response(JSON.stringify(data),{status});
 const save=()=>localStorage.setItem(storageKey,JSON.stringify(rows));
 const eq=key=>params.get(key)?.replace(/^eq\./,"");
 if(path==="counter_contacts"){
  const contacts=new Map(rows.map(o=>[o.counter_contact_id,{contact_id:o.counter_contact_id,kind:o.customer_type,name:o.customer_name}]));
  if(!contacts.has(demoContact.contact_id))contacts.set(demoContact.contact_id,demoContact);
  return reply([...contacts.values()].slice(Number(params.get("offset")),Number(params.get("offset"))+100));
 }
 if(path==="orders"){
  let found=rows.filter(o=>["business_date","id","counter_contact_id"].every(key=>!eq(key)||eq(key)===o[key]));
  if(params.has("order"))found.sort((a,b)=>b.business_date.localeCompare(a.business_date)||b.ref.localeCompare(a.ref));
  const offset=Number(params.get("offset"));
  return reply(found.slice(offset,offset+Number(params.get("limit")||1000)));
 }
 if(path==="create_counter_sheet"){
  const p=body.payload;
  const duplicate=rows.find(o=>o.client_token===p.client_token);
  if(duplicate)return reply({id:duplicate.id,duplicate:true});
  const id=crypto.randomUUID();
  rows.unshift({id,ref:"TESTE-"+(rows.length+1),client_token:p.client_token,customer_name:p.name,customer_type:p.kind,fulfilment:"recolha",
   source:"equipa",priority:"normal",status:"ativa",history_version:0,business_date:p.day,scheduled_time:p.time||"23:59",counter_time_unset:!p.time,
   counter_sheet:p.drawing,counter_contact_id:p.contact_id,order_items:[{product:"Folha de balcão",category:"peixe_fresco",unit:"un",quantity:1,position:0}],
   station_tasks:[{id:crypto.randomUUID(),station:"bancada",status:"por_iniciar",version:0}]});
  save();return reply({id});
 }
 if(path==="update_task"){
  const t=rows.flatMap(o=>o.station_tasks).find(t=>t.id===body.p_task_id);
  if(!t||t.version!==body.p_expected_version)return reply({message:"A preparação mudou."},409);
  t.status=body.p_patch.status;t.version++;save();return reply(t);
 }
 if(path==="change_order_status"){
  const o=rows.find(o=>o.id===body.p_order_id);
  if(!o||o.history_version!==body.p_version)return reply({message:"A encomenda mudou."},409);
  o.status=({handoff:"entregue",undo:"ativa",cancel:"cancelada",reopen:"ativa"})[body.p_action];o.cancel_reason=body.p_reason;o.history_version++;
  save();return reply(o);
 }
 return reply({message:"Esta pré-visualização permite experimentar a folha de balcão."},400);
}
