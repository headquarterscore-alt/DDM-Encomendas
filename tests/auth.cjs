const assert=require('node:assert/strict');
const teamUser={id:'a0000000-0000-4000-a000-000000000001',email:'equipa@example.invalid',aud:'authenticated',role:'authenticated'};
function fixtureSession(){
 const expires_at=Math.floor(Date.now()/1000)+3600;
 const claims=Buffer.from(JSON.stringify({sub:teamUser.id,role:'authenticated',exp:expires_at})).toString('base64url');
 return {access_token:'eyJhbGciOiJIUzI1NiJ9.'+claims+'.abc',refresh_token:'mock-only',user:teamUser,expires_at,expires_in:3600,token_type:'bearer'};
}
async function prepareSession(context,session=fixtureSession()){
 await context.addInitScript(value=>{
  if(!sessionStorage.getItem('test-initialised')&&!localStorage.getItem('ddm-equipa-auth')){
   localStorage.setItem('ddm-equipa-auth',JSON.stringify(value));
  }
  sessionStorage.setItem('test-initialised','true');
 },session);
}
async function testLogin(browser,url,base){
 const page=await browser.newPage({serviceWorkers:'block'});
 const session=fixtureSession();
 let reject=false,refreshes=0,reads=0;
 await page.route(base+'/**',async route=>{
  const request=route.request(),endpoint=new URL(request.url());
  if(endpoint.pathname.endsWith('/token')){
   if(endpoint.searchParams.get('grant_type')==='refresh_token')refreshes++;
   return route.fulfill({json:session});
  }
  if(endpoint.pathname.endsWith('/logout'))return route.fulfill({status:204});
  assert.equal(request.headers().authorization,'Bearer '+session.access_token);
  reads++;
  return route.fulfill(reject?{status:401,json:{message:'Expired'}}:{json:[]});
 });
 try{
  await page.goto(url+'/#historico');
  await page.getByRole('heading',{name:'Inicia sessão'}).waitFor();
  assert.equal(reads,0);
  await page.getByLabel('E-mail da equipa').fill(teamUser.email);
  await page.getByLabel('Palavra-passe').fill('apenas-simulacao-local');
  await page.getByRole('button',{name:'Iniciar sessão',exact:true}).click();
  await page.getByText('Ligado',{exact:true}).waitFor();
  await page.reload();
  await page.getByText('Ligado',{exact:true}).waitFor();
  await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('ddm-equipa-auth'));s.expires_at=1;localStorage.setItem('ddm-equipa-auth',JSON.stringify(s));});
  await page.reload();await page.getByText('Ligado',{exact:true}).waitFor();assert.ok(refreshes>0);
  reject=true;await page.reload();
  await page.getByRole('heading',{name:'Inicia sessão'}).waitFor();
  await page.waitForFunction(()=>!localStorage.getItem('ddm-equipa-auth'));
  assert.equal(await page.locator('.order-table:visible').count(),0);
 }finally{await page.close();}
}
module.exports={prepareSession,testLogin};
