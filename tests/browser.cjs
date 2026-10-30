const assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'))}catch{({chromium}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 const errors=[];const page=await browser.newPage({viewport:{width:1500,height:1100}});page.on('pageerror',e=>errors.push(e.message));
 const angles=()=>page.locator('#states span').evaluateAll(nodes=>nodes.map(n=>Number(n.textContent.match(/ (-?\d+)°/)[1])));
 async function point(j,kind){return page.evaluate(async({j,kind})=>{
  const {Renderer}=await import('/renderer.js');const {joints,tasks}=await import('/model.js');const task=tasks.find(t=>t.id===document.getElementById('task').value);
  const values=[...document.querySelectorAll('#states span')].map(n=>Number(n.textContent.match(/ (-?\d+)°/)[1]));
  const pose={...task.from,...Object.fromEntries(joints.map((j,i)=>[j,values[i]]))};
  const main=document.getElementById('scene'),box=document.createElement('div');box.style.cssText=`position:fixed;left:-10000px;width:${main.clientWidth}px;height:${main.clientHeight}px`;const c=document.createElement('canvas');c.style.cssText='width:100%;height:100%';box.append(c);document.body.append(box);
  const r=new Renderer(c);r.render(pose,{yaw:Number(document.getElementById('yaw').value),pitch:Number(document.getElementById('pitch').value),layers:{labels:true,muscle:true}});
  const p=r.picks.find(p=>p.joint===j&&p.kind===kind&&p.label).point;box.remove();return p;
 },{j,kind})}
 async function press(j,kind,ms){const pt=await point(j,kind),rect=await page.locator('#scene').boundingBox();await page.mouse.move(rect.x+pt[0],rect.y+pt[1]);await page.mouse.down();await page.waitForTimeout(ms);await page.mouse.up()}
 await page.goto('http://127.0.0.1:8000/dist/index.html');await page.locator('#en').click();
 assert.equal(await page.locator('#angle,#joint,#progress,#initial,#current').count(),0);
 assert.equal(await page.locator('.references figure').count(),1);assert.ok((await page.locator('#target').boundingBox()).height>=330);
 assert.equal(await page.locator('[data-muscle]').count(),16);
 assert.equal(await page.locator('.controls #guide').count(),1);assert.equal(await page.locator('.operationHelp [data-t="holdHelp"]').count(),1);assert.equal(await page.locator('.stage .viewToolbar #layers').count(),1);
 assert.deepEqual(await page.locator('#prediction-left option').allTextContents(),['Choose a prediction','A Contracting / B Relaxing','B Contracting / A Relaxing']);
assert.ok(await page.locator('#fallback').isHidden());console.log('PASS one enlarged target; no old angle bars or joint selector; A–P controls');
 const before=await angles();await press('left','flex',500);assert.deepEqual(await angles(),before);await page.locator('#attempt').click();assert.match(await page.locator('#feedback').innerText(),/Complete/);
 await page.locator('#prediction-left').selectOption('flex');await page.locator('#attempt').click();console.log('PASS prediction required before movement');
 await press('left','flex',750);const after=await angles();assert.ok(after[0]>before[0]);assert.deepEqual(after.slice(1),before.slice(1));await page.waitForTimeout(400);assert.deepEqual(await angles(),after);console.log('PASS direct hold moves one joint and release stops');
 await page.locator('#reset').click();await press('left','flex',1300);const longer=await angles();assert.ok(longer[0]>after[0]);console.log('PASS longer hold produces greater contraction');
 await page.locator('#zh').click();await page.locator('#en').click();assert.deepEqual(await angles(),longer);assert.equal(await page.locator('#prediction-left').inputValue(),'flex');console.log('PASS language preserves pose and prediction');
 await page.locator('#record').click();const record=await page.locator('#records').innerText();await page.locator('#reset').click();assert.equal(await page.locator('#records').innerText(),record);console.log('PASS immutable observation');
 await page.locator('#explore').click();
 // Exercise every direct diagram label with a short tap, in both members of every pair.
 const {joints}=await import('../model.js');
 for(let i=0;i<joints.length;i++)for(const kind of ['flex','extend']){
  await page.locator('#reset').click();const start=await angles();await press(joints[i],kind,40);const end=await angles();
  assert.equal(end[i]-start[i],kind==='flex'?4:-4,`${joints[i]} ${kind}`);for(let k=0;k<8;k++)if(k!==i)assert.equal(end[k],start[k]);
 }
 console.log('PASS all sixteen diagram labels actuate the correct joint in the correct direction');
 // Keyboard and replay use the same motion state as direct interaction.
 await page.locator('#reset').click();await page.locator('.operationHelp details').evaluate(e=>e.open=true);
 await page.locator('[data-muscle="E"]').focus();await page.keyboard.down('Enter');await page.waitForTimeout(500);await page.keyboard.up('Enter');const wrist=await angles();assert.ok(wrist[2]>0);
 await page.locator('#replay').click();await page.waitForTimeout(1500);assert.deepEqual(await angles(),wrist);console.log('PASS keyboard hold and replay equivalence');
 for(const id of ['run','dance','hands','feet']){await page.locator('#task').selectOption(id);assert.ok((await page.locator('#target').boundingBox()).height>=330);assert.equal(await page.locator('#states span').count(),8);assert.equal(await page.locator('#muscles button').count(),16)}
 await page.locator('#task').selectOption('run');await page.screenshot({path:'/tmp/movement-revised-running.png',fullPage:true});await page.locator('#task').selectOption('dance');await page.screenshot({path:'/tmp/movement-revised-dance.png',fullPage:true});assert.doesNotMatch(await page.locator('#taskText').innerText(),/Extension reference/);console.log('PASS running, dancing, hands and feet references render');
 const labelsChecked=await page.evaluate(async()=>{
 const {Renderer}=await import('/renderer.js');const {tasks}=await import('/model.js');const box=document.createElement('div');box.style.cssText='position:fixed;left:-10000px;width:600px;height:640px';const c=document.createElement('canvas');c.style.cssText='width:100%;height:100%';box.append(c);document.body.append(box);const r=new Renderer(c);
 for(const task of [tasks[0],tasks.at(-1),tasks.at(-2)])for(const pose of [task.from,task.to])for(const yaw of [-90,-25,70]){
 r.render(pose,{yaw,layers:{labels:true,muscle:true}});if(r.labelLayout.length!==16)throw Error('Missing muscle labels');
 for(const a of r.labelLayout){const radial=a.world.map((x,i)=>x-a.mid[i]);if(Math.abs(Math.hypot(...radial)-a.bulge)>1e-9)throw Error('Anchor not on muscle ring');if(Math.abs(radial.reduce((v,x,i)=>v+x*a.axis[i],0))>1e-9)throw Error('Anchor off muscle ring plane');const q=r.project(a.world);if(Math.hypot(q[0]-a.point[0],q[1]-a.point[1])>1e-9)throw Error('Leader endpoint projection incorrect');if(a.label[0]!==22&&a.label[0]!==578)throw Error('Label not outside diagram');}
 for(let i=0;i<16;i++)for(let j=i+1;j<16;j++){const a=r.labelLayout[i].label,b=r.labelLayout[j].label;if(Math.hypot(a[0]-b[0],a[1]-b[1])<24)throw Error('Overlapping labels');}
 }
 box.remove();return true;});assert.ok(labelsChecked);console.log('PASS label rails never overlap and leader endpoints lie on actual muscle mesh vertices across poses and camera angles');

 const download=page.waitForEvent('download');await page.locator('#csv').click();assert.match((await download).suggestedFilename(),/csv$/);console.log('PASS CSV export');
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.ok(await page.locator('#zh').isVisible());await page.screenshot({path:'/tmp/movement-revised-mobile.png',fullPage:true});console.log('PASS narrow layout');
 const fallback=await browser.newPage();fallback.on('pageerror',e=>errors.push(e.message));await fallback.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl'?null:get.call(this,type,...args)}});await fallback.goto('http://127.0.0.1:8000/dist/index.html');assert.ok(await fallback.locator('#fallback').isVisible());assert.deepEqual(errors,[]);console.log('PASS explicit fallback and no JavaScript errors');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
