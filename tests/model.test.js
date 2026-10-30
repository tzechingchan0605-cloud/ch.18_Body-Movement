import test from 'node:test';
import assert from 'node:assert/strict';
import {advance,tasks,matches,direction,interpolate,joints,limits,minimum,neutral,muscleID} from '../model.js';
import {dictionary} from '../i18n.js';
import {rig} from '../renderer.js';
const distance=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
const vector=(a,b)=>b.map((x,i)=>x-a[i]);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const angle=(a,b)=>Math.acos(Math.max(-1,Math.min(1,dot(a,b)/(Math.hypot(...a)*Math.hypot(...b)))))*180/Math.PI;
test('eight independent opposing pairs move in both directions, with sixteen unique labels',()=>{
 assert.equal(joints.length,8);const ids=[];
 for(const j of joints){const p={...neutral,[j]:(minimum[j]+limits[j])/2};
 for(const [kind,change]of [['flex',10],['extend',-10]]){const q=advance(p,j,kind,10);assert.equal(q[j],p[j]+change);for(const k of joints.filter(k=>k!==j))assert.equal(q[k],p[k]);ids.push(muscleID(j,kind));}}
 assert.deepEqual(ids,[...'ABCDEFGHIJKLMNOP']);
});
test('all ten explicit transitions are reachable in either joint order',()=>{
 assert.equal(tasks.length,10);
 for(const task of tasks){assert.ok(!matches(task.from,task));
 for(const order of [task.joint,[...task.joint].reverse()]){let p={...task.from};for(const j of order)p=advance(p,j,direction(task,j),Math.abs(task.to[j]-task.from[j]));assert.ok(matches(p,task));}}
});
test('all eight hinges enforce individual limits; every segment has a constant length',()=>{
 for(const j of joints){assert.equal(advance(neutral,j,'extend',900)[j],minimum[j]);assert.equal(advance(neutral,j,'flex',900)[j],limits[j]);}
 for(const task of tasks)for(const p of [0,.25,.5,.75,1]){const pose=interpolate(task.from,task.to,p),r=rig(pose);assert.equal(pose.stance,task.from.stance);
 for(const j of joints){const b=r[j];assert.ok(Math.abs(distance(b.tip,b.pivot)-b.length)<1e-10);}
 assert.deepEqual(r.leftWrist.pivot,r.left.tip);assert.deepEqual(r.rightWrist.pivot,r.right.tip);assert.deepEqual(r.leftAnkle.pivot,r.knee.tip);assert.deepEqual(r.rightAnkle.pivot,r.rightKnee.tip);
 }
});
test('knee flexion is measured from thigh–shin alignment, with no seated upward over-rotation',()=>{
 for(const stance of ['seated','running','dancing'])for(const j of ['knee','rightKnee'])for(const a of [0,10,20,45,90,110]){
 const r=rig({...neutral,stance,[j]:a}),b=r[j],thigh=vector(b.root,b.pivot),shin=vector(b.pivot,b.tip);
 assert.ok(Math.abs(angle(thigh,shin)-a)<1e-5,`${stance} ${j} ${a}`);
 // The seated knee must bend down/back; it must never swing its shin above the knee.
 if(stance==='seated')assert.ok(b.tip[1]<=b.pivot[1]+1e-10);
 // The heel stays below the hip, even at maximal standing flexion.
 if(stance!=='seated')assert.ok(b.tip[1]<b.root[1]);
 }
});
test('elbow and wrist angles are relative to their parent limb, including dance references',()=>{
 for(const stance of ['seated','running','dancing'])for(const side of ['left','right'])for(const a of [0,45,90,135]){
 const r=rig({...neutral,stance,[side]:a,[side+'Wrist']:35}),b=r[side],w=r[side+'Wrist'];
 assert.ok(Math.abs(angle(vector(b.root,b.pivot),vector(b.pivot,b.tip))-a)<1e-6);
 assert.ok(Math.abs(angle(vector(b.pivot,b.tip),vector(w.pivot,w.tip))-35)<1e-6);
 }
});
test('ankle dorsiflexion raises the foot relative to the shin; plantarflexion lowers it',()=>{
 for(const stance of ['seated','running','dancing'])for(const [k,a]of [['knee','leftAnkle'],['rightKnee','rightAnkle']])for(const knee of [0,45,90,110])for(const ankle of [-35,0,30]){
 const r=rig({...neutral,stance,[k]:knee,[a]:ankle});const shin=vector(r[k].pivot,r[k].tip),foot=vector(r[a].pivot,r[a].tip);
 assert.ok(Math.abs(angle(shin,foot)-(90+ankle))<1e-6);
 }
});
test('scores use ±5° tolerance independently of camera and do not drift',()=>{
 const task=tasks[0];assert.ok(matches({...task.to,left:105,yaw:179},task));assert.ok(!matches({...task.to,left:104.9},task));
 const snapshot=structuredClone(task.to);advance(task.to,'left','extend',30);assert.deepEqual(task.to,snapshot);
});
test('stable bilingual dictionary is complete',()=>assert.deepEqual(Object.keys(dictionary.zh).sort(),Object.keys(dictionary.en).sort()));
