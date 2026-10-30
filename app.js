import {tasks,joints,limits,minimum,muscleID,muscleNameKey,advance,matches,direction,interpolate} from './model.js';
import {dictionary,glossary} from './i18n.js';
import {Renderer} from './renderer.js';
const $=id=>document.getElementById(id);
let lang='zh';try{lang=localStorage.getItem('movement-language')==='en'?'en':'zh'}catch{}
const t=id=>dictionary[lang][id]??id;
let task=tasks[0],pose={...task.from},selected='left',active=null,motion=null,lastMotion=null;
let playing=false,elapsed=0,progress=0,mode='guided',hint=0,feedback='predictFirst',predictionFeedback='',attempted=false,close=false,records=[],yaw=-25,pitch=10;
let holding=null,drag=null;
const layers={skeleton:true,muscle:true,tendon:true,ligament:true,pull:true,labels:true,skin:false,overlay:false};
const scene=new Renderer($('scene')),targetRenderer=new Renderer($('target'));
$('fallback').hidden=!!scene.gl;
const predictions=Object.fromEntries(joints.map(j=>[j,'']));
const name=(j,k)=>`${muscleID(j,k)} · ${t(muscleNameKey(j,k))}`;
const pairText=(j,k)=>`${name(j,k)} ${t('contracting')} / ${name(j,k==='flex'?'extend':'flex')} ${t('relaxing')}`;
function option(value,label){const o=document.createElement('option');o.value=value;o.textContent=label;return o}
let referenceKey='',targetYaw=-25,targetPitch=8,targetDrag=null;
function render(){
 scene.render(pose,{yaw,pitch,layers,active,t,joint:selected,close,target:task.to});
 const key=task.id+lang+$('target').clientWidth+':'+targetYaw+':'+targetPitch;
 $('target').setAttribute('aria-label',`${t('targetView')} · ${t('rotate')} ${targetYaw.toFixed(0)}° · ${t('tilt')} ${targetPitch.toFixed(0)}° · ${t('targetRotate')}`);
 if(referenceKey!==key){referenceKey=key;targetRenderer.render(task.to,{yaw:targetYaw,pitch:targetPitch,layers:{skeleton:true,muscle:true,tendon:true,labels:true},t,mini:true})}
}
function update(){
 $('elapsed').textContent=`${t('time')} ${elapsed.toFixed(1)} s`;
 $('play').textContent=t(playing?'pause':'play');
 $('holdStatus').textContent=holding?`${name(holding.joint,holding.kind)} · ${t('contracting')} · ${(100*(holding.kind==='flex'?(pose[holding.joint]-minimum[holding.joint])/(limits[holding.joint]-minimum[holding.joint]):(limits[holding.joint]-pose[holding.joint])/(limits[holding.joint]-minimum[holding.joint]))).toFixed(0)}%`:t('holdStatus');
 $('states').replaceChildren(...joints.map(j=>{const s=document.createElement('span');s.textContent=`${t(j)} ${pose[j].toFixed(0)}°${active?.joint===j?' · '+t(holding||playing?'moving':'lastAction')+': '+pairText(j,active.kind):''}`;return s}));
 $('caption').textContent=active?`${t(holding||playing?'moving':'lastAction')} · ${t(active.joint)} · ${name(active.joint,active.kind)} ${t('causal')}`:t('idle');
 $('checklist').replaceChildren(...task.joint.map(j=>{const li=document.createElement('li');li.textContent=`${Math.abs(pose[j]-task.to[j])<=5?'✓':'○'} ${t(j)}: ${task.from[j]}° → ${task.to[j]}°`;return li}));
 $('feedback').textContent=t(mode==='guided'&&attempted&&matches(pose,task)?'success':feedback);
 $('answer').textContent=(predictionFeedback?t(predictionFeedback)+' ':'')+task.joint.map(j=>`${t(j)}: ${pairText(j,direction(task,j))}`).join(' · ')+'. '+t('answer');
 $('hintText').textContent=hint?t('hint'+Math.min(hint,3)):'';
 document.querySelectorAll('[data-muscle]').forEach(b=>b.classList.toggle('active',active?.joint===b.dataset.joint&&active?.kind===b.dataset.kind));
 render();
}
function translate(){
 document.documentElement.lang=lang==='zh'?'zh-Hant':'en-GB';document.title=t('title')+' · Movement Lab';
 document.querySelectorAll('[data-t]').forEach(e=>e.textContent=t(e.dataset.t));
 for(const id of ['zh','en']){$(id).classList.toggle('active',lang===id);$(id).setAttribute('aria-pressed',String(lang===id))}
 $('task').replaceChildren(...tasks.map(q=>option(q.id,t(q.id))));$('task').value=task.id;
 $('taskText').textContent=task.joint.map(j=>`${t(j)}: ${t('start')} ${task.from[j]}° → ${t('end')} ${task.to[j]}°`).join(' · ');
 const oldSpeed=$('speed').value||'1';$('speed').replaceChildren(option('1',t('normal')),option('.5',t('slower')),option('.25',t('slowest')));$('speed').value=oldSpeed;$('speed').setAttribute('aria-label',t('view'));
 $('scene').setAttribute('aria-label',t('holdHelp'));
 $('layers').replaceChildren();
 for(const id of Object.keys(layers)){const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=layers[id];input.onchange=()=>{layers[id]=input.checked;render()};label.append(input,document.createTextNode(t(id)));$('layers').append(label)}
 $('muscles').replaceChildren();
 for(const j of joints)for(const kind of ['flex','extend']){
  const b=document.createElement('button');b.textContent=`${name(j,kind)} · ${t(j)}`;b.title=t('holdHelp');b.dataset.muscle=muscleID(j,kind);b.dataset.joint=j;b.dataset.kind=kind;
  b.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();b.setPointerCapture(e.pointerId);beginHold(j,kind)};
  b.onpointerup=e=>{e.preventDefault();endHold(true)};b.onpointercancel=()=>endHold(false);b.onlostpointercapture=()=>endHold(false);
  b.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();if(!e.repeat)beginHold(j,kind)}};
  b.onkeyup=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();endHold(true)}};
  b.onblur=()=>{if(holding?.joint===j&&holding.kind===kind)endHold(false)};
  b.onclick=e=>{if(e.detail===0&&!holding){beginHold(j,kind);endHold(true)}};
  $('muscles').append(b);
 }
 $('predictions').replaceChildren();
 for(const j of task.joint){const row=document.createElement('div');row.className='predictionRow';const label=document.createElement('label');label.textContent=t(j);const select=document.createElement('select');select.id='prediction-'+j;label.htmlFor=select.id;select.setAttribute('aria-label',t('prediction')+' '+t(j));select.replaceChildren(option('',t('choose')),...['flex','extend'].map(k=>option(k,`${muscleID(j,k)} ${t('contracting')} / ${muscleID(j,k==='flex'?'extend':'flex')} ${t('relaxing')}`)));select.value=predictions[j];select.disabled=attempted;select.onchange=()=>{predictions[j]=select.value};row.append(label,select);$('predictions').append(row)}
 document.querySelector('.controls').hidden=mode!=='guided';document.querySelector('.layout').classList.toggle('exploring',mode==='explore');$('guide').hidden=mode!=='guided';$('reflection').hidden=mode!=='guided';$('attempt').disabled=attempted;
 $('explore').classList.toggle('active',mode==='explore');$('guided').classList.toggle('active',mode==='guided');
 $('glossary').replaceChildren(...glossary.map(a=>{const s=document.createElement('span');s.textContent=lang==='zh'?a[0]+' · '+a[1]:a[1]+' · '+a[0];return s}));
 drawRecords();update();
}
function beginHold(j,kind){
 if(mode==='guided'&&!attempted){feedback='predictFirst';update();return}
 if(holding)endHold(false);
 selected=j;playing=false;active={joint:j,kind};progress=0;feedback='working';
 holding={joint:j,kind,from:{...pose},began:performance.now(),moved:false};
 motion=null;update();
}
function moveHeld(degrees){
 if(!holding)return;
 const next=advance(pose,holding.joint,holding.kind,degrees);
 if(next[holding.joint]===pose[holding.joint]){feedback='limit';return}
 pose=next;holding.moved=true;
}
function endHold(tap){
 if(!holding)return;
 if(tap&&!holding.moved)moveHeld(1);
 const h=holding;holding=null;
 if(h.moved){lastMotion={from:h.from,to:{...pose},joint:h.joint,kind:h.kind};motion=structuredClone(lastMotion);progress=1;feedback='stopped'}
 update();
}
function step(){
 if(holding)endHold(false);
 if(!active){feedback='idle';update();return}
 beginHold(active.joint,active.kind);endHold(true);
}
function reset(all){
 endHold(false);playing=false;motion=null;lastMotion=null;active=null;progress=0;feedback=mode==='guided'&&!attempted?'predictFirst':'working';
 if(all){pose={...task.from};elapsed=0}else pose={...pose,[selected]:task.from[selected]};update();
}
function drawRecords(){
 const host=$('records');host.replaceChildren();
 if(!records.length){const p=document.createElement('p');p.className='empty';p.textContent=t('empty');host.append(p);return}
 const table=document.createElement('table'),head=document.createElement('tr');
 for(const key of ['trial','reference','time','angles','selection','prediction','response','match']){const th=document.createElement('th');th.textContent=t(key);head.append(th)}table.append(head);
 records.forEach((r,i)=>{const tr=document.createElement('tr');const vals=[i+1,t(r.task),r.elapsed.toFixed(1)+' s',joints.map(j=>`${t(j)} ${r.pose[j].toFixed(1)}°`).join(' / '),r.active?t(r.active.joint)+' '+name(r.active.joint,r.active.kind):'—',r.assessed.map(j=>t(j)+': '+(r.predictions[j]?pairText(j,r.predictions[j]):'—')).join(' / '),r.response,t(r.match?'yes':'no')];for(const v of vals){const td=document.createElement('td');td.textContent=v;tr.append(td)}table.append(tr)});host.append(table);
}
for(const l of ['zh','en'])$(l).onclick=()=>{lang=l;try{localStorage.setItem('movement-language',l)}catch{}translate()};
$('task').onchange=()=>{
 endHold(false);task=tasks.find(q=>q.id===$('task').value);hint=0;attempted=false;predictionFeedback='';for(const j of joints)predictions[j]='';$('answer').hidden=true;$('explanation').value='';selected=task.joint[0];targetYaw=-25;targetPitch=8;reset(true);referenceKey='';translate();
};
for(const m of ['explore','guided'])$(m).onclick=()=>{endHold(false);playing=false;mode=m;if(m==='guided'){attempted=false;reset(true)}feedback=m==='guided'?'predictFirst':'working';translate()};
$('play').onclick=()=>{if(!motion)return;playing=!playing;update()};
$('step').onclick=step;
$('replay').onclick=()=>{
 if(!lastMotion)return;endHold(false);motion=structuredClone(lastMotion);active={joint:motion.joint,kind:motion.kind};selected=motion.joint;pose={...motion.from};progress=0;playing=true;update();
};
$('reset').onclick=()=>reset(true);$('resetJoint').onclick=()=>reset(false);
$('side').onclick=()=>{yaw=-90;pitch=0;$('yaw').value=yaw;$('pitch').value=pitch;render()};
$('yaw').oninput=()=>{yaw=Number($('yaw').value);render()};$('pitch').oninput=()=>{pitch=Number($('pitch').value);render()};
$('close').onclick=()=>{close=!close;render()};
$('hint').onclick=()=>{hint=Math.min(3,hint+1);update()};
$('attempt').onclick=()=>{
 if(task.joint.some(j=>!predictions[j])){feedback='predictionMissing';update();return}
 attempted=true;predictionFeedback=task.joint.every(j=>predictions[j]===direction(task,j))?'predictionRight':'predictionWrong';feedback='predictionSaved';translate();
};
$('reveal').onclick=()=>{$('answer').hidden=!$('answer').hidden;update()};
$('record').onclick=()=>{records.push(structuredClone({task:task.id,assessed:task.joint,from:task.from,target:task.to,pose,elapsed,active,progress,predictions,response:$('explanation').value,match:matches(pose,task),yaw,pitch}));drawRecords()};
$('csv').onclick=()=>{
 const keys=['trial','reference','time',...joints,'selection','prediction','response','match','start','end','rotate','tilt'];
 const rows=[keys.map(k=>t(k)),...records.map((r,i)=>[i+1,t(r.task),r.elapsed.toFixed(2)+' s',...joints.map(j=>r.pose[j]+'°'),r.active?t(r.active.joint)+' '+name(r.active.joint,r.active.kind):'',r.assessed.map(j=>t(j)+': '+(r.predictions[j]?pairText(j,r.predictions[j]):'—')).join(' / '),r.response,t(r.match?'yes':'no'),joints.map(j=>t(j)+': '+r.from[j]+'°').join(' / '),joints.map(j=>t(j)+': '+r.target[j]+'°').join(' / '),r.yaw+'°',r.pitch+'°'])];
 const escape=v=>{let s=String(v);if(/^[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'};
 const blob=new Blob(['\ufeff'+rows.map(r=>r.map(escape).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=lang==='zh'?'人體運動觀察.csv':'movement-observations.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
};
$('scene').onpointerdown=e=>{
 if(e.button!==0)return;e.preventDefault();$('scene').setPointerCapture(e.pointerId);
 const r=$('scene').getBoundingClientRect(),hit=scene.pick(e.clientX-r.left,e.clientY-r.top);
 if(hit){drag=null;beginHold(hit.joint,hit.kind)}else drag={x:e.clientX,y:e.clientY};
};
$('scene').onpointermove=e=>{
 if(!drag)return;yaw=Math.max(-180,Math.min(180,yaw+(e.clientX-drag.x)*.5));pitch=Math.max(-50,Math.min(50,pitch+(e.clientY-drag.y)*.4));$('yaw').value=yaw;$('pitch').value=pitch;drag={x:e.clientX,y:e.clientY};render();
};
$('scene').onpointerup=()=>{endHold(true);drag=null};$('scene').onpointercancel=()=>{endHold(false);drag=null};$('scene').onlostpointercapture=()=>endHold(false);
$('scene').onkeydown=e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();yaw=Math.max(-180,Math.min(180,yaw+(e.key==='ArrowLeft'?-5:5)));$('yaw').value=yaw;render()}};
window.addEventListener('blur',()=>{endHold(false);playing=false});document.addEventListener('visibilitychange',()=>{if(document.hidden){endHold(false);playing=false}});

function rotateTarget(dx,dy){targetYaw=Math.max(-180,Math.min(180,targetYaw+dx));targetPitch=Math.max(-60,Math.min(60,targetPitch+dy));render()}
$('target').onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();$('target').setPointerCapture(e.pointerId);targetDrag={x:e.clientX,y:e.clientY}};
$('target').onpointermove=e=>{if(!targetDrag)return;rotateTarget((e.clientX-targetDrag.x)*.65,(e.clientY-targetDrag.y)*.5);targetDrag={x:e.clientX,y:e.clientY}};
$('target').onpointerup=$('target').onpointercancel=$('target').onlostpointercapture=()=>{targetDrag=null};
$('target').onkeydown=e=>{const moves={ArrowLeft:[-5,0],ArrowRight:[5,0],ArrowUp:[0,-5],ArrowDown:[0,5]};if(moves[e.key]){e.preventDefault();rotateTarget(...moves[e.key])}};
$('targetReset').onclick=()=>{targetYaw=-25;targetPitch=8;render()};

let last=performance.now();
function frame(now){
 const dt=Math.min(.1,(now-last)/1000);last=now;const speed=Number($('speed').value||1);
 if(holding&&now-holding.began>250){const adjusted=dt*speed;elapsed+=adjusted;moveHeld(adjusted*35);update()}
 else if(playing&&motion){const distance=Math.abs(motion.to[motion.joint]-motion.from[motion.joint]);const duration=matchMedia('(prefers-reduced-motion: reduce)').matches?.15:Math.max(.2,distance/35);elapsed+=dt*speed;progress=Math.min(1,progress+dt*speed/duration);pose=interpolate(motion.from,motion.to,progress);if(progress===1)playing=false;update()}
 requestAnimationFrame(frame);
}
new ResizeObserver(()=>{referenceKey='';render()}).observe($('scene'));translate();requestAnimationFrame(frame);
