const assert=require('node:assert/strict');

// Entrada direta para os artigos no posto Peixe-Marisco.
module.exports=async function testQuick(browser,url,base){
 const context=await browser.newContext({serviceWorkers:'block',viewport:{width:1024,height:900}});
 await require('./auth.cjs').prepareSession(context);
 const rows=[],submitted=[];
 await context.route(base+'/**',async route=>{
  const path=new URL(route.request().url());
  if(path.pathname.endsWith('/rpc/counter_contacts')){
   const list=rows.filter(o=>o.counter_contact_id).map(o=>({name:o.customer_name,contact_id:o.counter_contact_id,kind:o.customer_type}));
   return route.fulfill({json:[...new Map(list.map(c=>[c.contact_id,c])).values()]});
  }
  if(path.pathname.endsWith('/rpc/create_counter_sheet')){
   const {payload:p}=route.request().postDataJSON();
   const id='folha-'+rows.length;
   rows.push({id,ref:id,client_token:p.client_token,counter_sheet:p.drawing,counter_contact_id:p.contact_id,
    counter_time_unset:!p.time,scheduled_time:p.time||'23:59',customer_name:p.name,customer_type:p.kind,fulfilment:'recolha',
    business_date:p.day,status:'ativa',priority:'normal',order_items:[{category:'peixe_fresco',product:'Folha de balcão',unit:'un',quantity:1}],
    station_tasks:[{station:'bancada',status:'por_iniciar',version:0}]});
   return route.fulfill({json:{id}});
  }
  if(path.pathname.endsWith('/rpc/create_order')){
   const {payload}=route.request().postDataJSON();
   submitted.push(payload);
   const id='rapida-'+submitted.length;
   rows.push({...payload,id,ref:'TESTE-'+id,status:'ativa',order_items:payload.items.map((item,position)=>({...item,position})),
    station_tasks:[...new Set(payload.items.map(i=>i.category==='barcas'?'barcas':'bancada'))].map(station=>({station,status:'por_iniciar',version:1}))});
   return route.fulfill({json:{id}});
  }
  const id=path.searchParams.get('id')?.slice(3);
  const contact=path.searchParams.get('counter_contact_id')?.slice(3);
  return route.fulfill({json:id?rows.filter(o=>o.id===id):contact?rows.filter(o=>o.counter_contact_id===contact):rows});
 });
 const p=await context.newPage(),button=name=>p.getByRole('button',{name,exact:true}),click=name=>button(name).click();
 const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Lisbon'}).format(new Date());
 try{
  await p.goto(url+'/#encomendas/bancada');
  const plus=button('Nova encomenda');
  await plus.waitFor();
  assert.equal((await plus.innerText()).trim(),'');
  assert.equal(await plus.locator('svg').count(),1);
  const box=await plus.boundingBox();
  assert.ok(box.width>=64&&box.height>=64,'o botão tem de ser grande');

  // Formulário rápido: dois ecrãs, sem o questionário.
  await plus.click();await click('Usar catálogo');
  assert.equal(await p.locator('#quizForm').count(),0);
  await p.getByText('1 Artigos').waitFor();
  if(process.argv.includes('--update-images'))await p.locator('#dialog').screenshot({path:require('node:path').resolve(__dirname,'../docs/postos/artigos.png')});
  await click('Robalo');
  assert.equal(await button('À peça').getAttribute('aria-pressed'),'true');
  await p.getByLabel('Número de peixes').fill('4');
  await p.getByLabel('Peso aproximado por peixe (kg)').fill('1');
  // Um artigo ainda em edição também tem de sobreviver ao reload.
  await p.reload();await plus.click();await click('Usar catálogo');
  assert.equal(await p.getByLabel('Número de peixes').inputValue(),'4');
  await click('Adicionar à encomenda');
  await click('Gamba da costa');
  await p.getByLabel('Quantidade (kg)').fill('2');
  await click('Continuar');
  await p.getByLabel('Nome do cliente ou restaurante').fill('TESTE RAPIDA');
  await p.getByLabel('Dia',{exact:true}).fill(today);
  await p.getByLabel('Hora pretendida').fill('23:59');
  await p.getByLabel('Encomenda prioritária').check();
  const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.endsWith('-Rapida')))));
  await p.reload();await plus.click();await click('Usar catálogo');
  assert.equal(await p.getByLabel('Nome do cliente ou restaurante').inputValue(),'TESTE RAPIDA');
  assert.equal(await p.getByLabel('Encomenda prioritária').isChecked(),true);
  assert.equal(saved.quick.items.length,2);
  // O clique na etiqueta do retângulo invoca o seletor, mesmo fora do ícone.
  await p.evaluate(()=>{window.pickers=[];HTMLInputElement.prototype.showPicker=function(){window.pickers.push(this.type)};});
  await p.locator('#qOrderForm .field').filter({has:p.getByLabel('Dia',{exact:true})}).locator('span').click();
  await p.locator('#qOrderForm .field').filter({has:p.getByLabel('Hora pretendida')}).locator('span').click();
  assert.deepEqual(await p.evaluate(()=>window.pickers),['date','time']);
  // Telemóvel é opcional, mas se vier tem de ser válido.
  await p.getByLabel('Telemóvel (opcional)').fill('12');
  await click('Confirmar encomenda');
  assert.match(await p.locator('.error').innerText(),/Telemóvel inválido/);
  await p.getByLabel('Telemóvel (opcional)').fill('');
  await click('Confirmar encomenda');
  await p.locator('.order-number').waitFor();
  assert.equal(submitted.length,1);
  const first=submitted[0];
  assert.equal(first.source,'equipa');assert.equal(first.priority,'alta');
  assert.equal(first.items.length,2);
  assert.equal(first.items[0].product,'Robalo');assert.equal(first.items[0].quantity,4);
  assert.equal(first.items[0].unit,'kg');assert.match(first.items[0].notes,/4 peças.*1 kg por peça/);
  assert.equal(first.items[1].product,'Gamba da costa');assert.equal(first.items[1].quantity,2);
  assert.equal(first.items[1].unit,'kg');assert.equal(first.client_token,saved.quick.requestKey);
  assert.equal(await p.evaluate(()=>Object.keys(localStorage).some(k=>k.endsWith('-Rapida'))),false);
  // Formato antigo da RPC: nenhum campo do questionário.
  for(const key of ['party_size','occasion','occasion_other','shellfish_preferred','shellfish_avoid','customer_phone'])
   assert.equal(Object.hasOwn(first,key),false,key+' não devia ser enviado');
  assert.ok(first.client_token);
  await click('Concluir');

  // Segunda encomenda, de entrega, com telemóvel estrangeiro e uma barca.
  await plus.click();await click('Usar catálogo');
  await p.getByText('Todos os artigos',{exact:true}).click();
  await click('Barcas');
  await click('Continuar');
  await p.getByLabel('Nome do cliente ou restaurante').fill('TESTE ENTREGA');
  await p.getByLabel('Modalidade').selectOption('Entrega');
  await p.getByLabel('Morada de entrega').fill('Morada de teste');
  await p.getByLabel('Dia',{exact:true}).fill(today);
  await p.getByLabel('Hora pretendida').fill('23:59');
  await p.getByLabel('Telemóvel (opcional)').fill('+44 7700 900123');
  await click('Confirmar encomenda');
  await p.locator('.order-number').waitFor();
  const second=submitted[1];
  assert.equal(second.fulfilment,'entrega');assert.equal(second.address,'Morada de teste');
  assert.equal(second.customer_phone,'+447700900123');assert.equal(second.priority,'normal');
  assert.equal(second.items[0].category,'barcas');
  assert.equal(Object.hasOwn(second,'party_size'),false);
  await click('Concluir');

  async function writeOn(selector){
   const rect=await p.locator(selector).boundingBox();
   await p.mouse.move(rect.x+20,rect.y+20);await p.mouse.down();
   await p.mouse.move(rect.x+95,rect.y+38,{steps:8});await p.mouse.up();
  }
  await plus.click();
  await click('Restaurante');
  await p.getByLabel('Nome do restaurante').fill('Mar Azul');
  await writeOn('#counterOrderPad canvas');
  await p.locator('#counterOrderPad button').click();await click('Guardar');
  assert.match(await p.locator('[data-sheet-message]').innerText(),/Escreva o pedido/);
  await writeOn('#counterOrderPad canvas');
  await p.reload();await plus.click();
  assert.equal(await p.getByLabel('Nome do restaurante').inputValue(),'Mar Azul');
  await click('Guardar');await p.locator('#counterForm').waitFor({state:'hidden'});
  const firstSheet=rows.find(o=>o.counter_sheet);
  const card=p.locator('[data-order="'+firstSheet.id+'"]');
  assert.equal(await card.locator('.ticket-deadline strong').innerText(),'Hora a combinar');
  assert.equal(await card.locator('.counter-ink').getAttribute('src'),firstSheet.counter_sheet);
  await card.getByRole('button',{name:'Ampliar folha'}).click();await p.locator('#dialog .counter-ink').waitFor();await click('Fechar');
  await plus.click();await p.locator('[data-contact]').filter({hasText:'Mar Azul'}).click();await writeOn('#counterOrderPad canvas');
  await p.getByLabel('Hora de levantamento').fill('18:00');await click('Guardar');
  await p.locator('#counterForm').waitFor({state:'hidden'});
  assert.equal(rows.filter(o=>o.counter_contact_id===firstSheet.counter_contact_id).length,2);
  await plus.click();await writeOn('#counterNamePad canvas');await writeOn('#counterOrderPad canvas');await click('Guardar');
  await p.locator('#counterForm').waitFor({state:'hidden'});
  assert.ok(rows.at(-1).customer_name.startsWith('ddm-ink:'));
  await p.goto(url+'/#historico');await click('Clientes e restaurantes');await click('Mar Azul');
  await p.locator('.counter-history-row').first().waitFor();assert.equal(await p.locator('.counter-history-row').count(),2);
  await click('Fechar');
  console.log('PASS: folha manuscrita, rascunho, nome desenhado, restaurante habitual, hora opcional e histórico');

  // O separador Cliente continua a abrir o questionário de 6 passos.
  await p.goto(url+'/#cliente');
  await p.getByRole('slider').waitFor();
  assert.equal(await p.locator('#quizForm').count(),1);
  console.log('PASS: Nova encomenda em Peixe-Marisco, artigos habituais, catálogo, rascunho, entrega e telemóvel estrangeiro');
 }finally{await context.close();}
};
