export const joints=['left','right','knee'];
export const limits={left:135,right:135,knee:110};
export const tasks=[
 {id:'lf',joint:['left'],from:{left:20,right:20,knee:20},to:{left:110,right:20,knee:20}},
 {id:'le',joint:['left'],from:{left:110,right:20,knee:20},to:{left:20,right:20,knee:20}},
 {id:'rf',joint:['right'],from:{left:20,right:20,knee:20},to:{left:20,right:110,knee:20}},
 {id:'op',joint:['left','right'],from:{left:20,right:110,knee:20},to:{left:110,right:20,knee:20}},
 {id:'kf',joint:['knee'],from:{left:20,right:20,knee:10},to:{left:20,right:20,knee:90}},
 {id:'ke',joint:['knee'],from:{left:20,right:20,knee:90},to:{left:20,right:20,knee:10}}
];
export const tolerance=5;
export function advance(pose,joint,kind,degrees){return {...pose,[joint]:Math.max(0,Math.min(limits[joint],pose[joint]+(kind==='flex'?1:-1)*degrees))};}
export function matches(pose,task){return task.joint.every(j=>Math.abs(pose[j]-task.to[j])<=tolerance);}
export function direction(task,j){return task.to[j]>task.from[j]?'flex':'extend';}
export function interpolate(a,b,p){return Object.fromEntries(joints.map(j=>[j,a[j]+(b[j]-a[j])*p]));}
