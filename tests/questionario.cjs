const assert=require('node:assert/strict');

module.exports=async function testQuestionnaire(browser,url,base){
 const context=await browser.newContext({serviceWorkers:'block',viewport:{width:1024,height:900}});
 await require("./auth.cjs").prepareSession(context);
 const rows=[],submitted=[],attempts=[];
 await context.route(base+'/**',async route=>{
  const path=new URL(route.request().url());
  if(path.pathname.endsWith('/rpc/create_order')){
   const {payload}=route.request().postDataJSON();
   attempts.push(payload.client_token);
   const existing=rows.find(o=>o.client_token===payload.client_token);
   if(existing)return route.fulfill({json:{id:existing.id,duplicate:true}});
   submitted.push(payload);
   const id='quiz-'+submitted.length;
   rows.push({...payload,id,ref:'TESTE-'+id,status:'ativa',order_items:payload.items.map((item,position)=>({...item,position})),
    station_tasks:[...new Set(payload.items.map(i=>i.category==='barcas'?'barcas':'bancada'))].map(station=>({station,status:'por_iniciar',version:1}))});
   if(submitted.length===1)return route.fulfill({status:503,json:{message:'Resposta perdida (teste)'}});
   return route.fulfill({json:{id}});
  }
  const id=path.searchParams.get('id')?.slice(3);
  return route.fulfill({json:id?rows.filter(o=>o.id===id):rows});
 });
 const p=await context.newPage(),button=name=>p.getByRole('button',{name,exact:true}),click=name=>button(name).click();
 try{
  for(const [idx,occasion] of ['Refeição','Evento','Petisco','Outro'].entries()){
   const people=idx===1?0:idx===2?1:12;
   await p.goto(url+'/#cliente');
   // A 1.ª vez abre sozinho ao entrar no separador. Depois, o cliente carrega em «Começar encomenda».
   if(idx>0)await click('Começar encomenda');
   const slider=p.getByRole('slider');assert.equal(await slider.inputValue(),'0');
   if(people)await slider.fill(String(people));await click('Continuar');
   await click(occasion);
   if(occasion==='Outro'){await click('Continuar');}
   await p.getByText('Marisco a evitar',{exact:true}).click();
   const avoid=p.getByRole('group',{name:'Há algum de que não goste ou não possa comer?'});
   await avoid.getByRole('button',{name:'Ostras',exact:true}).click();
   if(idx===0){
    await p.clock.install();await p.clock.fastForward(91000);
    await p.reload();
    assert.equal(await avoid.getByRole('button',{name:'Ostras',exact:true}).getAttribute('aria-pressed'),'true');
   }
   await click('Continuar');
   assert.equal(await p.locator('.boat-options button').count(),3);
   if(!people)assert.match(await p.locator('.budget-title').innerText(),/50 €/);
   if(people===1){
    const value=p.getByRole('slider',{name:'Ajustar valor da barca'});
    for(const [id,min] of [['bm','100'],['bg','200'],['bp','50']]){
     await p.locator(`.boat-options [data-value="${id}"]`).click();
     assert.equal(await value.inputValue(),min);
    }
   }
   await click('Continuar');
   await p.getByLabel('Nome do cliente ou restaurante').fill('TESTE LOCAL');
   await p.getByLabel('Hora',{exact:true}).fill('00:00');
   await p.getByLabel('Dia',{exact:true}).fill(new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Lisbon'}).format(new Date()));
   assert.equal(await p.getByLabel('Encomenda prioritária').count(),0);
   await p.getByLabel('Telemóvel (opcional)',{exact:true}).fill('123');await click('Continuar');
   assert.match(await p.locator('#quizError').innerText(),/9 dígitos/);
   const phone=['+44 7700 900123','+351 900 000 000','900000000','+1 (202) 555-0143'][idx];
   await p.getByLabel('Telemóvel (opcional)',{exact:true}).fill(phone);await click('Continuar');
   await click('Voltar');assert.match(await p.getByLabel('Nome do cliente ou restaurante').inputValue(),/TESTE LOCAL/);
   await click('Continuar');await click('Confirmar encomenda');
   if(idx===0){
    await p.getByText('Resposta perdida (teste)',{exact:true}).waitFor();
    await click('Confirmar encomenda');
   }
   await p.locator('.order-number').waitFor();
   if(idx===0)assert.equal(attempts[0],attempts[1]);
   assert.equal(await p.locator('.order-number').innerText(),'TESTE-quiz-'+(idx+1));
   const data=submitted[idx];
   assert.equal(data.customer_phone,['+447700900123','+351900000000','+351900000000','+12025550143'][idx]);
   assert.equal(data.fulfilment,'recolha');
   assert.equal(data.address,'');
   assert.equal(data.priority,'normal');
   assert.equal(data.occasion,['refeicao','evento','petisco','outro'][idx]);
   assert.equal(data.occasion_other,null);
   assert.deepEqual(data.shellfish_avoid,['Ostras']);
   assert.ok(data.client_token);assert.equal(data.party_size,people||null);
   const boats=data.items.filter(i=>i.category==='barcas');
   assert.equal(boats.reduce((n,i)=>n+i.quantity*i.people,0),people);
   assert.ok(boats.every(i=>i.meal_type===(idx===2?'petisco':'refeicao')));
   assert.equal(await p.evaluate(scope=>Object.keys(localStorage).find(k=>k.startsWith('ddm-questionario-2-')&&k.endsWith('-'+scope))||null,'Cliente'),null);
   await click('Concluir');
  }
  await p.goto(url+'/#encomendas/barcas');
  const card=p.locator('[data-order="quiz-1"]');
  assert.match(await card.innerText(),/Marisco a evitar.*Ostras/s);
  assert.equal(await card.getByRole('link',{name:'Ligar ao cliente'}).getAttribute('href'),'tel:+447700900123');
  await card.locator('.ticket-customer').click();assert.match(await p.locator('#dialog').innerText(),/Ostras/);
  await click('Fechar');
  await p.goto(url+'/#encomendas/barcas');await click('Encomendar barca');
  if(process.argv.includes('--update-images'))await p.locator('#dialog').screenshot({path:require('node:path').resolve(__dirname,'../docs/postos/pessoas.png')});
  await p.getByRole('slider').fill('6');await click('Continuar');await click('Refeição');await click('Continuar');
  assert.match(await p.locator('.boat-options [aria-pressed=true]').innerText(),/Barca média/);
  const photos=p.locator('.boat-options img');
  await p.waitForFunction(()=>[...document.querySelectorAll('.boat-options img')].every(img=>img.complete&&img.naturalWidth>0));
  assert.deepEqual(await photos.evaluateAll(nodes=>nodes.map(img=>img.getAttribute('src'))),[
   './barca_pequena.png','./barca_media.png','./barca_grande.png'
  ]);
  if(process.argv.includes('--boat-image'))await p.locator('#dialog').screenshot({path:require('node:path').resolve(__dirname,'../docs/postos/escolher-barca.png')});
  await p.locator('.boat-options [data-value="bg"]').click();
  assert.equal(await p.locator('.boat-options [data-value="bg"]').getAttribute('aria-pressed'),'true');
  const slider=p.getByRole('slider',{name:'Ajustar valor da barca'});
  assert.equal(await slider.inputValue(),'200');
  assert.equal(await slider.getAttribute('min'),'50');
  assert.equal(await slider.getAttribute('max'),'400');
  for(const [value,size] of [['99','bp'],['100','bm'],['199','bm'],['200','bg'],['275','bg']]){
   await slider.fill(value);
   assert.equal(await p.locator('.boat-options [aria-pressed=true]').getAttribute('data-value'),size);
   assert.equal(await p.locator('.budget-title output').innerText(),value+' €');
  }
  await click('Continuar');await p.getByLabel('Encomenda prioritária').check();
  await click('Escrever à mão');const pad=p.locator('[data-ink] canvas');await pad.click();
  await pad.evaluate(el=>{const ctx=el.getContext('2d');ctx.fillStyle='black';ctx.font='90px Arial';ctx.fillText('MARIA',50,145);});
  await click('Ler nome');await p.waitForFunction(()=>document.querySelector('[data-field="o.name"]').value==='MARIA',{},{timeout:45000});

  await p.reload();await click('Encomendar barca');
  assert.equal(await p.getByLabel('Encomenda prioritária').isChecked(),true);
  await click('Continuar');await click('Confirmar encomenda');await p.locator('.order-number').waitFor();
  assert.equal(submitted.at(-1).source,'equipa');assert.equal(submitted.at(-1).party_size,6);
  assert.equal(submitted.at(-1).priority,'alta');assert.equal(submitted.at(-1).customer_phone,null);
  assert.equal(submitted.at(-1).items[0].budget,275);
  assert.equal(submitted.at(-1).items[0].barca_size,'grande');
  console.log('PASS: questionário do Cliente: escrita do nome, preço, levantamento, campos opcionais e rascunho');
 }finally{await context.close();}
};
