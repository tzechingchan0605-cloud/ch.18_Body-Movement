export const joints=['left','right','leftWrist','rightWrist','knee','rightKnee','leftAnkle','rightAnkle'];
export const limits={left:135,right:135,leftWrist:65,rightWrist:65,knee:110,rightKnee:110,leftAnkle:30,rightAnkle:30};
export const minimum={left:0,right:0,leftWrist:-60,rightWrist:-60,knee:0,rightKnee:0,leftAnkle:-35,rightAnkle:-35};
export const neutral={left:20,right:20,leftWrist:0,rightWrist:0,knee:90,rightKnee:90,leftAnkle:0,rightAnkle:0,stance:'seated'};
export const muscleID=(j,k)=>String.fromCharCode(65+joints.indexOf(j)*2+(k==='extend'?1:0));
export function muscleNameKey(j,k){return j==='left'||j==='right'?(k==='flex'?'biceps':'triceps'):j.includes('Wrist')?'w'+k:j.includes('Ankle')?'a'+k:'k'+k;}
const makeTask=(id,from,to,stance='seated')=>{const a={...neutral,...from,stance},b={...a,...to};return {id,from:a,to:b,joint:joints.filter(j=>a[j]!==b[j]),supplementary:stance!=='seated'};};
export const tasks=[makeTask('lf',{left:20},{left:110}),makeTask('le',{left:110},{left:20}),makeTask('rf',{right:20},{right:110}),makeTask('op',{left:20,right:110},{left:110,right:20}),makeTask('kf',{knee:10},{knee:90}),makeTask('ke',{knee:90},{knee:10}),makeTask('hands',{left:80,right:80,leftWrist:-20,rightWrist:20},{leftWrist:40,rightWrist:-35}),makeTask('feet',{leftAnkle:-20,rightAnkle:15},{leftAnkle:20,rightAnkle:-25}),makeTask('run',{left:30,right:110,knee:20,rightKnee:80},{left:100,right:35,knee:85,rightKnee:25,leftAnkle:20,rightAnkle:-20},'running'),makeTask('dance',{left:30,right:30,knee:0,rightKnee:0},{left:95,right:65,leftWrist:35,rightWrist:-30,knee:45,rightKnee:20,leftAnkle:15,rightAnkle:-20},'dancing')];
export const tolerance=5;
export function advance(pose,joint,kind,degrees){return {...pose,[joint]:Math.max(minimum[joint],Math.min(limits[joint],pose[joint]+(kind==='flex'?1:-1)*degrees))};}
export function matches(pose,task){return task.joint.every(j=>Math.abs(pose[j]-task.to[j])<=tolerance);}
export function direction(task,j){return task.to[j]>task.from[j]?'flex':'extend';}
export function interpolate(a,b,p){return {...a,...Object.fromEntries(joints.map(j=>[j,a[j]+(b[j]-a[j])*p]))};}
