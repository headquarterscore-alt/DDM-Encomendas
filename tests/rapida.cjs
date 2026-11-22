const assert=require('node:assert/strict');

// Nova encomenda da equipa: botão «+» verde e formulário rápido (o questionário é só do Cliente).
module.exports=async function testQuick(browser,url,base){
 const context=await browser.newContext({serviceWorkers:'block',viewport:{width:1024,height:900}});
 await require('./auth.cjs').prepareSession(context);
 const rows=[],submitted=[];
 await context.route(base+'/**',async route=>{
  const path=new URL(route.request().url());
  if(path.pathname.endsWith('/rpc/create_order')){
   const {payload}=route.request().postDataJSON();
   submitted.push(payload);
   const id='rapida-'+submitted.length;
   rows.push({...payload,id,ref:'TESTE-'+id,status:'ativa',order_items:payload.items.map((item,position)=>({...item,position})),
    station_tasks:[...new Set(payload.items.map(i=>i.category==='barcas'?'barcas':'bancada'))].map(station=>({station,status:'por_iniciar',version:1}))});
   return route.fulfill({json:{id}});
  }
  const id=path.searchParams.get('id')?.slice(3);
  return route.fulfill({json:id?rows.filter(o=>o.id===id):rows});
 });
 const p=await context.newPage(),button=name=>p.getByRole('button',{name,exact:true}),click=name=>button(name).click();
 const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Lisbon'}).format(new Date());
 try{
  await p.goto(url+'/#encomendas/bancada');
  const plus=button('Nova encomenda');
  await plus.waitFor();
  // Só um «+»: sem texto visível, verde e com alvo grande.
  assert.equal((await plus.innerText()).trim(),'');
  const box=await plus.boundingBox();
  assert.ok(box.width>=64&&box.height>=64,'o botão tem de ser grande');
  const [r,g,b]=(await plus.evaluate(el=>getComputedStyle(el).backgroundColor)).match(/\d+/g).map(Number);
  assert.ok(g>r*1.5&&g>b*1.5,'o botão tem de ser verde: rgb('+[r,g,b]+')');

  // Formulário rápido: dois ecrãs, sem o questionário.
  await plus.click();
  assert.equal(await p.locator('#quizForm').count(),0);
  await p.getByText('1 Artigos').waitFor();
  await p.getByLabel('Quantidade (kg)').fill('2');
  await click('Adicionar à encomenda');
  await click('Continuar');
  await p.getByLabel('Nome do cliente ou restaurante').fill('TESTE RAPIDA');
  await p.getByLabel('Dia',{exact:true}).fill(today);
  await p.getByLabel('Hora pretendida').fill('23:59');
  await p.getByLabel('Encomenda prioritária').check();
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
  assert.equal(first.items.length,1);assert.equal(first.items[0].quantity,2);
  // Formato antigo da RPC: nenhum campo do questionário.
  for(const key of ['party_size','occasion','occasion_other','shellfish_preferred','shellfish_avoid','customer_phone'])
   assert.equal(Object.hasOwn(first,key),false,key+' não devia ser enviado');
  assert.ok(first.client_token);
  await click('Concluir');

  // Segunda encomenda, de entrega, com telemóvel estrangeiro e uma barca.
  await plus.click();
  await p.getByLabel('Categoria').selectOption({label:'Barcas'});
  await click('Adicionar à encomenda');
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

  // O separador Cliente continua a abrir o questionário de 6 passos.
  await p.goto(url+'/#cliente');
  await p.getByLabel('Número de pessoas',{exact:true}).waitFor();
  assert.equal(await p.locator('#quizForm').count(),1);
  console.log('PASS: Nova encomenda da equipa: botão «+» verde, formulário rápido, formato antigo da RPC, entrega e telemóvel estrangeiro');
 }finally{await context.close();}
};
