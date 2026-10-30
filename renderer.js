import {muscleID,muscleNameKey,limits,minimum} from './model.js';
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),len=a=>Math.hypot(...a),norm=a=>mul(a,1/(len(a)||1)),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const palette={bone:[.88,.84,.69],joint:[.65,.71,.66],flex:[.79,.36,.24],extend:[.27,.51,.65],tendon:[.98,.98,.94],ligament:[.66,.55,.27],seat:[.28,.42,.39],skin:[.76,.84,.76,.16],target:[.2,.65,.5,.20],active:[.99,.65,.24]};
export function rig(pose){
 const r={},rad=x=>x*Math.PI/180;
 for(const [side,x] of [['left',.62],['right',-.62]]){
  const sign=Math.sign(x),dance=pose.stance==='dancing',run=pose.stance==='running';
  const upper=norm(dance?[sign*.88,-.48,0]:run?[0,-1,side==='left'?-.35:.35]:[0,-1,0]);
  const n=norm(cross([1,0,0],upper)).map(v=>-v),a=rad(pose[side]),d=add(mul(upper,Math.cos(a)),mul(n,Math.sin(a)));
  const root=[x,.94,0],pivot=add(root,mul(upper,.72)),tip=add(pivot,mul(d,.67));
  r[side]={root,pivot,tip,normal:n,length:.67,type:'elbow'};
  const w=side+'Wrist',wa=rad(pose[w]||0),wn=norm(sub(mul(n,Math.cos(a)),mul(upper,Math.sin(a))));
  const hand=add(tip,mul(add(mul(d,Math.cos(wa)),mul(wn,Math.sin(wa))),.23));
  r[w]={root:pivot,pivot:tip,tip:hand,normal:wn,length:.23,type:'wrist'};
 }
 for(const [j,ankle,x]of [['knee','leftAnkle',.25],['rightKnee','rightAnkle',-.25]]){
  const seated=!pose.stance||pose.stance==='seated',root=[x,-.48,0],pivot=seated?[x,-.58,.73]:[x,-1.16,0],a=rad(pose[j]||0);
  const thigh=norm(sub(pivot,root)),bend=[0,-thigh[2],thigh[1]],d=add(mul(thigh,Math.cos(a)),mul(bend,Math.sin(a))),tip=add(pivot,mul(d,.70));
  r[j]={root,pivot,tip,normal:bend,length:.70,type:'knee'};
  const aa=rad(pose[ankle]||0),n=[0,-d[2],d[1]].map(v=>-v),foot=add(tip,mul(add(mul(n,Math.cos(aa)),mul(d,-Math.sin(aa))),.26));
  r[ankle]={root:pivot,pivot:tip,tip:foot,normal:n,length:.26,type:'ankle'};
 }
 return r;
}
export class Renderer{
 constructor(canvas){this.canvas=canvas;this.picks=[];this.gl=canvas.getContext('webgl',{antialias:true,alpha:true});if(this.gl){let g=this.gl;const shader=(type,src)=>{let s=g.createShader(type);g.shaderSource(s,src);g.compileShader(s);if(!g.getShaderParameter(s,g.COMPILE_STATUS))throw Error(g.getShaderInfoLog(s));return s};this.program=g.createProgram();g.attachShader(this.program,shader(g.VERTEX_SHADER,'attribute vec3 p; attribute vec4 c; varying vec4 col; void main(){gl_Position=vec4(p,1.0);col=c;}'));g.attachShader(this.program,shader(g.FRAGMENT_SHADER,'precision mediump float; varying vec4 col; void main(){gl_FragColor=col;}'));g.linkProgram(this.program);this.buffer=g.createBuffer();}else this.ctx=canvas.getContext('2d');
 // Text and hit targets use an independent overlay; geometry remains actual depth-tested 3D.
 this.overlay=document.createElement('canvas');this.overlay.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';canvas.parentElement.style.position='relative';canvas.parentElement.append(this.overlay);this.text=this.overlay.getContext('2d');
 }
 render(pose,opts={}){const {yaw=-25,pitch=10,layers={},active=null,t=x=>x,joint='left',close=false,target=null,mini=false,sideReference=false}=opts;let w=this.canvas.clientWidth||200,h=this.canvas.clientHeight||300,d=Math.min(devicePixelRatio||1,2);this.canvas.width=w*d;this.canvas.height=h*d;this.overlay.width=w*d;this.overlay.height=h*d;this.text.setTransform(d,0,0,d,0,0);this.text.clearRect(0,0,w,h);this.picks=[];const y=yaw*Math.PI/180,p=pitch*Math.PI/180,focus=close?rig(pose)[joint].pivot:[0,pose.stance==='seated'?.1:-.1,.12];let scale=close?2.1:(pose.stance==='seated'?1:.86);
 const camera=v=>{let q=sub(v,focus),x=q[0]*Math.cos(y)+q[2]*Math.sin(y),z=-q[0]*Math.sin(y)+q[2]*Math.cos(y);return[x,q[1]*Math.cos(p)-z*Math.sin(p),q[1]*Math.sin(p)+z*Math.cos(p)]};if(!close){
 const bounds=Object.values(rig(pose)).flatMap(b=>[b.root,b.pivot,b.tip]).flatMap(v=>[add(v,[.16,.1,0]),add(v,[-.16,-.1,0])]);bounds.push([.25,1.69,.25],[-.25,1.69,-.25]);
 let mx=0,my=0;for(const v of bounds){const q=camera(v),p=5/(5-q[2]);mx=Math.max(mx,Math.abs(q[0]*p*.58/(w/h)));my=Math.max(my,Math.abs(q[1]*p*.58));}
 scale=Math.min(scale,(mini?.86:.65)/(mx||1),.88/(my||1));
 }let profileOffset=0,profileSide=null;const clip=v=>{const q=camera(v),pers=5/(5-q[2]);return[q[0]*scale*pers/(h? w/h:1)*.58+profileOffset,q[1]*scale*pers*.58,-q[2]/10];};const screen=v=>{const q=clip(v);return[(q[0]+1)*w/2,(1-q[1])*h/2]};this.project=screen;let data=[],transparent=[],annotations=[];
 const tri=(a,b,c,color)=>{const n=norm(cross(sub(b,a),sub(c,a))),light=.65+.35*Math.abs(n[0]*.3+n[1]*.7+n[2]*.6),out=(color[3]??1)<1?transparent:data;for(const v of [a,b,c])out.push(...clip(v),...color.slice(0,3).map(v=>v*light),color[3]??1)};
 const tube=(a,b,r,color,r2=r)=>{const axis=norm(sub(b,a)),u=norm(cross(axis,Math.abs(axis[1])<.9?[0,1,0]:[1,0,0])),v=cross(axis,u);const point=(base,rad,k)=>add(base,add(mul(u,rad*Math.cos(k*Math.PI/6)),mul(v,rad*Math.sin(k*Math.PI/6))));for(let i=0;i<12;i++){let p0=point(a,r,i),p1=point(a,r,i+1),p2=point(b,r2,i),p3=point(b,r2,i+1);tri(p0,p2,p1,color);tri(p1,p2,p3,color);tri(a,p1,p0,color);tri(b,p2,p3,color)}};
 const sphere=(center,r,color)=>{for(let i=0;i<8;i++)for(let k=0;k<12;k++){const at=(i,k)=>add(center,[r*Math.sin(i*Math.PI/8)*Math.cos(k*Math.PI/6),r*Math.cos(i*Math.PI/8),r*Math.sin(i*Math.PI/8)*Math.sin(k*Math.PI/6)]);tri(at(i,k),at(i+1,k),at(i,k+1),color);tri(at(i,k+1),at(i+1,k),at(i+1,k+1),color)}};
 const label=(v,s,color='#294c44')=>{const [x,y]=screen(v);this.text.font=`${mini?9:11}px system-ui`;this.text.fillStyle=color;this.text.textAlign='center';this.text.fillText(s,x,y)};
 const body=(pose,ghost=false)=>{let r=rig(pose),base=ghost?palette.target:palette.bone;
 if(layers.skeleton!==false||ghost){tube([0,-.5,0],[0,1.05,0],.17,base,.24);tube([-.59,.94,0],[.59,.94,0],.055,base);sphere([0,1.44,0],.25,base);tube([0,1.04,0],[0,1.24,0],.08,base);tube([-.28,-.48,0],[.28,-.48,0],.09,base);}
 for(const [j,b] of Object.entries(r)){if(profileSide&&(j==='left'||j==='knee'||j.startsWith('left')?'left':'right')!==profileSide)continue;const {root,pivot,tip}=b,arm=b.type==='elbow',distal=b.type==='wrist'||b.type==='ankle';if(layers.skeleton!==false||ghost){if(!distal)tube(root,pivot,.055,base);if(arm){tube(add(pivot,[.035,0,0]),add(tip,[.035,0,0]),.027,base);tube(add(pivot,[-.035,0,0]),add(tip,[-.035,0,0]),.027,base)}else tube(pivot,tip,.045,base);sphere(pivot,.078,ghost?base:palette.joint);sphere(tip,.055,base);if(distal)tube(pivot,tip,.07,base,.04)}
 if(ghost)continue;
 if(layers.ligament!==false){tube(add(pivot,[-.075,.09,0]),add(pivot,[-.075,-.06,.035]),.018,palette.ligament);}
 for(const kind of ['flex','extend']){const sign=kind==='flex'?1:-1,offset=mul(b.normal,(distal?.085:.13)*sign);const origin=add(add(root,mul(sub(pivot,root),.1)),offset);const insertion=add(add(pivot,mul(sub(tip,pivot),distal?.48:arm?(kind==='flex'?.23:.09):.20)),mul(b.normal,sign*.05));const direction=norm(sub(insertion,origin)),bellyEnd=sub(insertion,mul(direction,.14)),mid=mul(add(origin,bellyEnd),.5);const on=active?.joint===j&&active?.kind===kind;const amount=((pose[j]||0)-minimum[j])/(limits[j]-minimum[j]);const bulge=(distal?.04:.064)+(kind==='flex'?amount:1-amount)*(distal?.022:.036); if(layers.muscle!==false){tube(origin,mid,.027,on?palette.active:palette[kind],bulge);tube(mid,bellyEnd,bulge,on?palette.active:palette[kind],.026);this.picks.push({point:screen(mid),joint:j,kind});}if(layers.tendon!==false)tube(bellyEnd,insertion,.017,palette.tendon);
 if(layers.pull&&on){const a=add(insertion,[.13,0,0]),b=add(a,mul(direction,-.25));tube(a,b,.014,palette.active);tube(b,add(b,[.045,-.07,0]),.012,palette.active);tube(b,add(b,[-.045,-.07,0]),.012,palette.active);}
 if(layers.labels&&!mini){
 // Choose an actual vertex on the thickest muscle ring facing the camera.
 const axis=norm(sub(bellyEnd,origin)),u=norm(cross(axis,Math.abs(axis[1])<.9?[0,1,0]:[1,0,0])),v=cross(axis,u);
 const ring=Array.from({length:12},(_,i)=>add(mid,add(mul(u,bulge*Math.cos(i*Math.PI/6)),mul(v,bulge*Math.sin(i*Math.PI/6)))));
 const anchor=ring.reduce((best,p)=>camera(p)[2]>camera(best)[2]?p:best);
 annotations.push({point:screen(anchor),world:anchor,mid,axis,bulge,joint:j,kind,on});

 }

 }
 if(layers.skin){tube(root,pivot,arm?.13:.15,palette.skin);tube(pivot,tip,arm?.105:.12,palette.skin);}
 if(layers.labels||mini){const [x,y]=screen(pivot);this.text.beginPath();this.text.arc(x,y,3,0,Math.PI*2);this.text.fillStyle='#27695d';this.text.fill();if(!distal||sideReference)label(add(pivot,[j==='right'?.17:-.17,.09,0]),`${Math.round(pose[j])}°`);}
 }
 if(!ghost){if(!pose.stance||pose.stance==='seated'){tube([-.48,-.61,-.12],[.48,-.61,-.12],.10,palette.seat);tube([-.48,-.61,-.12],[-.48,-.61,.7],.045,palette.seat);tube([.48,-.61,-.12],[.48,-.61,.7],.045,palette.seat);}if(layers.labels&&!mini){label([.64,1.12,0],t('leftMark'));label([-.64,1.12,0],t('rightMark'));if(close&&(joint==='left'||joint==='right'))label(add(r[joint].root,[0,.2,0]),t('boneNames'));}}
 };
 if(sideReference){scale*=.82;profileSide='left';profileOffset=-.48;body(pose);profileSide='right';profileOffset=.48;body(pose);profileSide=null;profileOffset=0;this.text.font='bold 11px system-ui';this.text.fillStyle='#294c44';this.text.textAlign='center';this.text.fillText(t('leftProfile'),w*.26,19);this.text.fillText(t('rightProfile'),w*.74,19);}
 else body(pose);
 if(target&&layers.overlay)body(target,true);
 // Place letter badges on separate rails outside the model; never move the true anchor.
 this.labelLayout=[];
 for(const side of [-1,1]){
 const rail=annotations.filter(a=>(a.point[0]<w/2?-1:1)===side).sort((a,b)=>a.point[1]-b.point[1]||muscleID(a.joint,a.kind).localeCompare(muscleID(b.joint,b.kind)));
 const gap=Math.min(32,(h-70)/Math.max(1,rail.length-1));
 const ys=rail.map((a,i)=>Math.max(35+i*gap,Math.min(h-35-(rail.length-1-i)*gap,a.point[1])));
 for(let i=1;i<ys.length;i++)ys[i]=Math.max(ys[i],ys[i-1]+gap);
 if(ys.length&&ys.at(-1)>h-35){const shift=ys.at(-1)-(h-35);for(let i=0;i<ys.length;i++)ys[i]-=shift;}
 rail.forEach((a,i)=>{const lx=side<0?22:w-22,ly=ys[i],endX=lx-side*12;
 this.text.strokeStyle='#45675e';this.text.lineWidth=.9;this.text.beginPath();this.text.moveTo(...a.point);this.text.lineTo(endX,ly);this.text.stroke();
 this.text.fillStyle='#fff';this.text.beginPath();this.text.arc(...a.point,3,0,Math.PI*2);this.text.fill();this.text.stroke();
 this.text.fillStyle=a.on?'#b05a18':'#fff';this.text.beginPath();this.text.arc(lx,ly,12,0,Math.PI*2);this.text.fill();this.text.stroke();this.text.font='bold 12px system-ui';this.text.fillStyle=a.on?'#fff':'#254f47';this.text.textAlign='center';this.text.fillText(muscleID(a.joint,a.kind),lx,ly+4);
 this.labelLayout.push({...a,label:[lx,ly]});if(layers.muscle!==false)this.picks.push({point:[lx,ly],joint:a.joint,kind:a.kind,label:true});
 });
 }

 if(this.gl){const g=this.gl;g.viewport(0,0,w*d,h*d);g.clearColor(0,0,0,0);g.clear(g.COLOR_BUFFER_BIT|g.DEPTH_BUFFER_BIT);g.enable(g.DEPTH_TEST);g.useProgram(this.program);g.bindBuffer(g.ARRAY_BUFFER,this.buffer);const draw=a=>{g.bufferData(g.ARRAY_BUFFER,new Float32Array(a),g.DYNAMIC_DRAW);for(const [name,size,offset]of [['p',3,0],['c',4,12]]){let i=g.getAttribLocation(this.program,name);g.enableVertexAttribArray(i);g.vertexAttribPointer(i,size,g.FLOAT,false,28,offset)}g.drawArrays(g.TRIANGLES,0,a.length/7)};g.disable(g.BLEND);g.depthMask(true);draw(data);g.enable(g.BLEND);g.blendFunc(g.SRC_ALPHA,g.ONE_MINUS_SRC_ALPHA);g.depthMask(false);draw(transparent);g.depthMask(true);}else{const c=this.ctx;c.setTransform(d,0,0,d,0,0);c.clearRect(0,0,w,h);for(let i=0;i<data.length;i+=21){c.beginPath();for(let k=0;k<3;k++){let n=i+k*7;const x=(data[n]+1)*w/2,y=(1-data[n+1])*h/2;k?c.lineTo(x,y):c.moveTo(x,y)}c.closePath();c.fillStyle=`rgb(${data.slice(i+3,i+6).map(v=>Math.round(v*255)).join(',')})`;c.fill();}}
 }
 pick(x,y){return this.picks.map(p=>({...p,d:Math.hypot(x-p.point[0],y-p.point[1])})).filter(p=>p.d<(p.label?15:24)).sort((a,b)=>a.d-b.d)[0];}
}
