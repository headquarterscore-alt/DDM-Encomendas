// Two independent browser contexts share only the server, never localStorage.
const {chromium}=require('playwright');
const {createServer}=require('node:http');
const {readFileSync,mkdirSync}=require('node:fs');
const {resolve}=require('node:path');
const assert=require('node:assert/strict');
const live=process.argv.includes('--live');
const root=resolve(__dirname,'..');
const source=readFileSync(resolve(root,'src/app.js'),'utf8');
const base=source.match(/const base="([^"]+)"/)[1];
const apikey=source.match(/publicKey="([^"]+)"/)[1];
const day=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Lisbon'}).format(new Date());
const customer='TESTE POSTOS · Restaurante Mar Azul '+Date.now();
const payload={customer_name:customer,customer_type:'restaurante',fulfilment:'recolha',address:'',scheduled_time:'19:30',business_date:day,source:'equipa',priority:'normal',notes:'Encomenda fictícia para validar a PR. Não preparar.',client_token:crypto.randomUUID(),items:[
 {category:'barcas',product:'Barca média',quantity:1,unit:'un',barca_size:'media',meal_type:'refeicao',people:6,budget:100},
 {category:'peixe_fresco',product:'Robalo',quantity:2.5,unit:'kg',cut:'em filetes'},
 {category:'peixe_fresco',product:'Dourada',quantity:4,unit:'un',cut:'amanhado'}
]};
// Dourada is kg in the real catalog; use the catalog unit in the live fixture.
if(live)payload.items[2].unit='kg';
const fixture={id:'test-mixed',ref:'DDM-900001',...payload,status:'ativa',history_version:0,scheduled_time:'19:30:00',order_items:payload.items.map((x,position)=>({...x,position})),station_tasks:['barcas','bancada'].map(station=>({id:station,station,status:'por_iniciar',version:0,shellfish_collected:false,cooking:'por_cozer',assembly_done:false}))};
let mutations=0,failNext=false;
const server=createServer((req,res)=>{
 try{const path=req.url.split('?')[0];const file=resolve(root,'dist',path==='/'?'index.html':'.'+path);if(!file.startsWith(resolve(root,'dist')+require('node:path').sep))throw Error();res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':'text/html');res.end(readFileSync(file));}catch{res.writeHead(404);res.end();}
});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,message){for(let i=0;i<100;i++){if(await fn())return;await wait(100);}throw Error(message);}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({...(process.env.DDM_BROWSER?{channel:process.env.DDM_BROWSER}:{}),headless:true});
 const contexts=await Promise.all([browser.newContext({viewport:{width:1440,height:1100},serviceWorkers:'block'}),browser.newContext({viewport:{width:1440,height:1100},serviceWorkers:'block'})]);
 const errors=[];
 try{
  if(!live){
   await require('./auth.cjs').testLogin(browser,url,base);
   for(const context of contexts)await require('./auth.cjs').prepareSession(context);
  }
  if(!live)for(const context of contexts)await context.route(base+'/**',async route=>{
   const path=new URL(route.request().url()).pathname;
   assert.match(route.request().headers().authorization||'',/^Bearer /);
   if(path.endsWith('/rpc/update_task')){
    mutations++;await wait(450);
    if(failNext){failNext=false;return route.fulfill({status:500,json:{message:'Falha simulada ao guardar'}});}
    const data=route.request().postDataJSON(),task=fixture.station_tasks.find(x=>x.id===data.p_task_id);
    if(data.p_expected_version!==task.version)return route.fulfill({status:409,json:{message:'Outro posto alterou a encomenda.'}});
    assert.ok(['barcas','bancada'].includes(data.p_patch.device_station));
    if(fixture.status!=='ativa')return route.fulfill({status:400,json:{message:'Encomenda encerrada'}});
    fixture.history_version++;
    Object.assign(task,data.p_patch);task.version++;return route.fulfill({json:task});
   }
   if(path.endsWith('/rpc/change_order_status')){
    const {p_order_id,p_action,p_version,p_reason,p_station}=route.request().postDataJSON();
    assert.equal(p_order_id,fixture.id);
    assert.ok(['barcas','bancada'].includes(p_station));
    if(p_version!==fixture.history_version)return route.fulfill({status:409,json:{message:'A encomenda mudou.'}});
    const transitions={handoff:['ativa','entregue'],undo:['entregue','ativa'],cancel:['ativa','cancelada'],reopen:['cancelada','ativa']};
    const [from,to]=transitions[p_action];assert.equal(fixture.status,from);
    if(p_action==='handoff')assert.ok(fixture.station_tasks.every(x=>x.status==='pronta'));
    fixture.status=to;fixture.cancel_reason=p_reason;fixture.history_version++;
    return route.fulfill({json:fixture});
   }
   return route.fulfill({json:[structuredClone(fixture)]});
  });
  let id=fixture.id;
  if(live){
   const email=process.env.DDM_TEST_EMAIL,password=process.env.DDM_TEST_PASSWORD;
   if(!email||!password)throw Error('O teste live requer uma conta de teste fornecida pelo operador.');
   const login=await contexts[0].request.post(base+'/auth/v1/token?grant_type=password',{headers:{apikey},data:{email,password}});
   assert.ok(login.ok(),'Falhou a autenticação da conta de teste');
   const session=await login.json(),headers={apikey,Authorization:'Bearer '+session.access_token};
   for(const c of contexts)await require('./auth.cjs').prepareSession(c,session);
   const response=await contexts[0].request.post(base+'/rest/v1/rpc/create_order',{headers,data:{payload}});
   assert.ok(response.ok(),await response.text());const created=await response.json();
   const row=await contexts[0].request.get(base+'/rest/v1/orders?select=*,station_tasks(*),order_items(*)&id=eq.'+created.id,{headers});
   const rows=await row.json();id=rows[0].id;console.log('Live fixture:',rows[0].ref,customer);
  }
  const pages=await Promise.all(contexts.map(c=>c.newPage()));const [barcas,bancada]=pages;
  pages.forEach(p=>p.on('pageerror',e=>errors.push(e.message)));
  await Promise.all(pages.map((p,i)=>p.goto(url+(i?'/#encomendas/bancada':'/#preparacao/barcas'))));
  const card=p=>p.locator(`[data-order="${id}"]`);
  await Promise.all(pages.map(p=>card(p).waitFor()));
  for(const p of pages){await p.locator('[data-act="focus"]').click();assert.equal(await p.locator('#search').count(),0);}
  for(const p of pages){
   assert.deepEqual(await p.locator('[data-nav]').allTextContents(),['Encomendas','Histórico','Cliente']);
   assert.ok(await p.locator('nav').isVisible(),'navigation remains available in station mode');
   assert.equal(await p.getByText('Modo demo',{exact:true}).count(),0);
   assert.match(await p.locator('[data-station]').first().innerText(),/POSTO 01[\s\S]*Peixe-Marisco/);
   assert.match(await p.locator('[data-station]').last().innerText(),/POSTO 02[\s\S]*Barcas/);
   const expected=await p.evaluate(()=>new Intl.DateTimeFormat('pt-PT',{timeZone:'Europe/Lisbon',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date()));
   assert.equal(await p.locator('[data-clock]').innerText(),expected);
  }
  assert.match(await card(bancada).innerText(),new RegExp('Robalo[\\s\\S]*2,5 kg[\\s\\S]*Em filetes[\\s\\S]*Dourada[\\s\\S]*4 '+(live?'kg':'un\\.')+'[\\s\\S]*Amanhado'));
  assert.match(await card(barcas).innerText(),/19:30[\s\S]*Barca média[\s\S]*6 pessoas[\s\S]*75 × 24 cm/);
  assert.equal(await card(bancada).getByText('Barca média',{exact:true}).count(),0);
  const click=async(p,text)=>{await card(p).getByRole('button',{name:text,exact:true}).click();await until(async()=>await p.locator('#writeStatus').innerText()==='Alteração guardada.','mutation was not confirmed: '+text);};
  if(!live){
   await card(barcas).getByRole('button',{name:'Iniciar',exact:true}).evaluate(b=>{b.click();b.click();});
   assert.equal(await barcas.locator('#writeStatus').innerText(),'A guardar…');
   assert.ok(await card(barcas).getByRole('button',{name:'Iniciar',exact:true}).isDisabled());
   await until(()=>Promise.resolve(mutations===1),'one request');
   await until(async()=>await barcas.locator('#writeStatus').innerText()==='Alteração guardada.','save complete');
   await wait(500);assert.equal(mutations,1,'double tap sent one write');
  }else await click(barcas,'Iniciar');
  assert.ok(barcas.url().endsWith('#encomendas/barcas'),'legacy shortcut redirected');
  await barcas.setViewportSize({width:390,height:900});
  for(const [index,label] of ['Por iniciar','Em preparação','Prontas'].entries()){
   await barcas.getByRole('button',{name:label,exact:true}).click();
   assert.deepEqual(await barcas.locator('.lane:visible h3').allTextContents(),[label]);
   assert.equal(await card(barcas).count(),index===1?1:0);
  }
  await barcas.setViewportSize({width:1440,height:1100});
  assert.equal(await barcas.locator('.lane:visible').count(),3);
  await barcas.getByRole('button',{name:'Todas',exact:true}).click();
  assert.ok(await card(barcas).isVisible());
  await barcas.getByRole('link',{name:'Histórico'}).click();
  await barcas.locator('.order-table').waitFor();
  assert.ok(barcas.url().endsWith('#historico'));
  await barcas.getByRole('link',{name:'Encomendas',exact:true}).click();
  await until(async()=>!(await barcas.locator('#toast').getAttribute('class')).includes('on'),'toast cleared for screenshot');
  const imageDir=process.argv.includes('--header-images')?'docs/topo':'docs/postos';
  mkdirSync(resolve(root,imageDir),{recursive:true});
  if(process.argv.includes('--update-images')){
   await wait(250); // Allow the toast fade to finish before capturing evidence.
   for(const p of pages)await p.setViewportSize({width:1673,height:1100});
   await barcas.screenshot({path:resolve(root,imageDir,'barcas.png'),fullPage:true});
   await bancada.screenshot({path:resolve(root,imageDir,'bancada.png'),fullPage:true});
   for(const p of pages)await p.setViewportSize({width:1440,height:1100});
  }
  await click(barcas,'Barca pronta');
  assert.match(await card(barcas).innerText(),/A aguardar Peixe-Marisco/);
  await bancada.reload();await card(bancada).waitFor();
  assert.ok(await card(bancada).getByRole('button',{name:'Iniciar',exact:true}).isVisible(),'fish still pending');
  assert.equal(await card(barcas).getByRole('button',{name:'Confirmar levantamento',exact:true}).count(),0);
  assert.equal(await card(bancada).getByRole('button',{name:'Confirmar levantamento',exact:true}).count(),0);
  // Also check the complete-order detail, not only the board.
  await card(barcas).locator('.ref').click();assert.equal(await barcas.locator('[data-task="handoff"]').count(),0);await barcas.getByRole('button',{name:'Fechar',exact:true}).click();
  if(!live){
   await card(bancada).locator('.ref').click();
   await bancada.getByRole('button',{name:'Cancelar encomenda'}).click();
   await bancada.getByLabel('Motivo',{exact:true}).selectOption('Outro');
   await bancada.locator('#otherReason input').fill('Pedido repetido por telefone');
   await bancada.getByRole('button',{name:'Confirmar cancelamento'}).click();
   await bancada.getByRole('button',{name:'Reabrir',exact:true}).waitFor();
   await bancada.getByRole('button',{name:'Fechar',exact:true}).click();
   assert.equal(await card(bancada).count(),0);
   await bancada.getByRole('link',{name:'Histórico'}).click();
   assert.deepEqual(await bancada.locator('[data-list]').allTextContents(),['Todas','Por iniciar','Em preparação','Prontas','Entregues','Canceladas']);
   await bancada.getByRole('button',{name:'Em preparação',exact:true}).click();
   assert.equal(await bancada.locator('.table-row[data-detail]').count(),0);
   await bancada.getByRole('button',{name:'Canceladas',exact:true}).click();
   await bancada.locator('.table-row[data-detail]').click();
   assert.match(await bancada.locator('#dialog').innerText(),/Pedido repetido por telefone/);
   await bancada.getByRole('button',{name:'Reabrir',exact:true}).click();
   await bancada.getByRole('button',{name:'Cancelar encomenda'}).waitFor();
   assert.deepEqual(fixture.station_tasks.map(t=>t.status),['pronta','por_iniciar']);
   await bancada.getByRole('button',{name:'Fechar',exact:true}).click();
   await bancada.getByRole('link',{name:'Encomendas',exact:true}).click();
  }
  await click(bancada,'Iniciar');
  if(!live){failNext=true;await card(bancada).getByRole('button',{name:'Preparação pronta',exact:true}).click();await until(async()=>await bancada.locator('#writeStatus').innerText()==='Confirma o estado antes de tentar novamente.','failure feedback');assert.ok(await card(bancada).getByRole('button',{name:'Preparação pronta',exact:true}).isEnabled());}
  await click(bancada,'Preparação pronta');
  await barcas.reload();await card(barcas).waitFor();
  for(const p of pages)assert.ok(await card(p).getByRole('button',{name:'Confirmar levantamento',exact:true}).isVisible(),'handoff only after both ready');
  // Reopen root URL in fresh pages; the two contexts retain separate device preferences.
  for(let i=0;i<2;i++){
   await pages[i].close();pages[i]=await contexts[i].newPage();await pages[i].goto(url+'/');
   await until(async()=>await pages[i].locator('#main h1').innerText()===(i?'Peixe-Marisco':'Barcas'),'device reopened correct station');
   assert.equal(await pages[i].locator('[data-station="'+(i?'bancada':'barcas')+'"]').getAttribute('aria-pressed'),'true');
  }
  for(const p of pages){
   const heights=await p.locator('.ticket-action,.head-actions .btn,.queue-filters .btn,.date-pick').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().height));assert.ok(heights.every(h=>h>=56),JSON.stringify(heights));
  }
  for(const width of [1673,1440,1024,768,390]){
   await pages[0].setViewportSize({width,height:1000});
   const layout=await pages[0].locator('.station-header').evaluate(el=>{
    const box=el.getBoundingClientRect();const elements=[...el.querySelectorAll('h1,.header-date,.header-clock,.sync,.btn')].map(x=>x.getBoundingClientRect());
    return {fits:elements.every(r=>r.left>=box.left&&r.right<=box.right+1),width:el.scrollWidth,client:el.clientWidth};
   });
   assert.ok(layout.fits&&layout.width<=layout.client+1,'header overflow at '+width+': '+JSON.stringify(layout));
  }
  await pages[0].setViewportSize({width:1440,height:1100});
  if(!live){
   await contexts[0].setOffline(true);await until(async()=>await pages[0].locator('.sync').innerText()==='Sem ligação','offline status');
   assert.ok(await card(pages[0]).getByRole('button',{name:'Confirmar levantamento',exact:true}).isDisabled());
   await contexts[0].setOffline(false);await until(async()=>await pages[0].locator('.sync').innerText()==='Ligado','reconnected');
   fixture.fulfilment='entrega';
   await pages[0].reload();
   await card(pages[0]).getByRole('button',{name:'Confirmar entrega',exact:true}).waitFor();
   await card(pages[0]).locator('.ref').click();
   assert.equal(await pages[0].locator('[data-task="handoff"]').innerText(),'Confirmar entrega');
   fixture.fulfilment='recolha';
   await pages[1].reload();
   await card(pages[1]).waitFor();
  }
  await click(pages[1],'Confirmar levantamento');
  await until(async()=>await card(pages[1]).count()===0,'handed order removed');
  if(!live){
   const p=pages[1];
   await p.getByRole('button',{name:'Desfazer',exact:true}).click();
   await card(p).waitFor();
   await click(p,'Confirmar levantamento');
   const undo=p.getByRole('button',{name:'Desfazer',exact:true});
   await undo.waitFor();await wait(7000);assert.ok(await undo.isVisible());
   await undo.waitFor({state:'hidden',timeout:2000});
   for(const device of pages){
    await device.goto(url+'/#historico');
    await device.getByRole('button',{name:'Entregues',exact:true}).click();
    await device.locator('.table-row[data-detail]').click();
    await device.getByRole('button',{name:'Desfazer levantamento',exact:true}).click();
   }
   const before=fixture.history_version;
   await Promise.all(pages.map(device=>device.getByRole('button',{name:'Confirmar',exact:true}).click()));
   await until(async()=>fixture.status==='ativa','undo restored active order');
   await until(async()=>(await Promise.all(pages.map(device=>device.locator('#writeStatus').innerText()))).includes('Confirma o estado antes de tentar novamente.'),'stale confirmation rejected');
   assert.equal(fixture.history_version,before+1);
   await p.getByRole('button',{name:'Fechar',exact:true}).click();await p.getByRole('button',{name:'Prontas',exact:true}).click();
   await p.locator('.table-row[data-detail]').waitFor();
  }
  if(!live)await require("./questionario.cjs")(browser,url,base);
  assert.deepEqual(errors,[]);
  console.log('PASS: independent sessions, mixed order, per-product quantities, simplified workflow, filters, handoff gate, device persistence, 56px targets'+(!live?', repeated taps, failed save, offline/reconnect':''));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
