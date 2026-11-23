const assert=require('node:assert/strict');

module.exports=async function testInbox(browser,url){
 const p=await browser.newPage({serviceWorkers:'block'});
 try{
  await p.goto(url+'/experimentar.html#encomendas/bancada');
  const inbox=p.locator('.board .lane.wait .lane-body');
  const simulate=p.locator('.head-actions .sync + [data-act="simulate-sms"]');
  assert.equal(await p.locator('.queue-title h2').innerText(),'Encomendas');
  await simulate.click();await simulate.click();
  assert.equal(await p.locator('.queue-title .total').innerText(),'2');
  assert.equal(await p.locator('.lane.wait .lane-count').innerText(),'2');
  assert.equal(await inbox.locator('.empty').count(),0);
  await p.locator('[data-filter="pronta"]').click();
  assert.equal(await inbox.locator('.incoming-card').count(),0);
  await p.locator('[data-filter="all"]').click();
  const fish=inbox.locator('.incoming-card').filter({hasText:'Mar Azul'});
  const boat=inbox.locator('.incoming-card').filter({hasText:'Maria Santos'});
  for(const width of [360,768,1024,1673]){
   await p.setViewportSize({width,height:840});
   const buttons=await fish.locator('[data-decision]').evaluateAll(nodes=>nodes.map(node=>{
    const box=node.getBoundingClientRect();return {y:box.y,w:box.width,h:box.height,fit:node.scrollWidth<=node.clientWidth+1};
   }));
   assert.ok(buttons.every(b=>b.y===buttons[0].y&&Math.abs(b.w-buttons[0].w)<1&&b.h>=56&&b.fit));
  }
  await boat.getByRole('button',{name:'Contactar'}).click();await p.reload();
  assert.ok(await boat.getByRole('button',{name:'Contactar'}).isDisabled());
  await fish.getByRole('button',{name:'Recusar'}).click();
  assert.equal(await p.locator('.ticket').count(),0);
  await boat.getByRole('button',{name:'Aceitar'}).click();await p.locator('.barcas-ticket').waitFor();
  assert.equal(await p.locator('.barcas-ticket .ticket-customer').innerText(),'Maria Santos');
  await simulate.click();await fish.getByRole('button',{name:'Aceitar'}).click();
  await p.locator('.bancada-ticket').waitFor();
  assert.equal(await p.locator('.bancada-ticket .ticket-customer').innerText(),'Mar Azul');
  assert.equal(await inbox.locator('.incoming-card').count(),0);
  assert.equal(await p.locator('.lane.wait .lane-count').innerText(),'1');
  console.log('PASS: cartões de SMS por pedido, ações táteis, persistência e encaminhamento por posto');
 }finally{await p.close();}
};
