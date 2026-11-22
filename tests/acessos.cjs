// Matriz HTTP para uma réplica local de PostgREST configurada com db-tx-end=rollback.
const assert=require('node:assert/strict');
async function verifyAccess(origin,authenticatedToken,orderId,taskId){
 if(new URL(origin).hostname!=='127.0.0.1')throw Error('Este teste requer uma réplica local descartável.');
 const probes=[
  ...['orders','order_items','station_tasks','order_events'].map(t=>[t+'?select=id&'+(t==='orders'?'id':'order_id')+'=eq.'+orderId,null,t!=='order_events']),
  ['rpc/lisbon_today',{},true],
  ['rpc/create_order',{payload:{customer_name:'TESTE LOCAL',items:[{category:'peixe_fresco',product:'Robalo',unit:'kg',quantity:1}]}},true],
  ['rpc/update_task',{p_task_id:taskId,p_expected_version:1,p_patch:{status:'em_preparacao',device_station:'barcas'}},true],
  ['rpc/change_order_status',{p_order_id:orderId,p_action:'cancel',p_station:'barcas',p_version:0,p_reason:'Teste local'},true],
  ['rpc/hand_off',{p_order_id:orderId},true],
  ['rpc/create_order_before_003',{payload:{}},false],['rpc/reset_demo',{},false]
 ];
 for(const [path,body,teamAllowed] of probes){
  const statuses=[];
  for(const token of [null,authenticatedToken]){
   const headers={'Content-Type':'application/json'};
   if(token)headers.Authorization='Bearer '+token;
   const r=await fetch(origin+'/'+path,{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined});
   statuses.push(r.status);
   if(token&&teamAllowed){
    const content=await r.text();assert.ok(r.ok,path+' '+r.status+' '+content);
    if(!body)assert.ok(JSON.parse(content).length>0,'Encomenda de teste invisível: '+path);
   }
   else assert.equal(r.status,token?403:401,'Acesso inesperado: '+path);
  }
  console.log(path.split('?')[0],...statuses);
 }
}
module.exports={verifyAccess};
