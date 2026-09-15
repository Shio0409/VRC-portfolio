export function orbitDirection(x, y) {
  const length = Math.hypot(x,y), angle = Math.min(1,length)*Math.PI/6;
  const factor = length ? Math.sin(angle)/length : 0;
  const ly=y*factor,lz=Math.cos(angle),tilt=Math.PI/6;
  return [x*factor,ly*Math.cos(tilt)+lz*Math.sin(tilt),lz*Math.cos(tilt)-ly*Math.sin(tilt)];
}

export function viewBasis(direction) {
  const [x,y,z]=direction, length=Math.hypot(x,z);
  const right=[z/length,0,-x/length];
  return {right,up:[y*right[2],z*right[0]-x*right[2],-y*right[0]]};
}
const dot=(a,b)=>a.reduce((sum,value,i)=>sum+value*b[i],0);

/** Fit around the face pivot, not the model center. Reserve one stable distance
 * for the entire orbit so pointer movement never pumps the camera zoom. */
export function framingDistance(points, aspect, fov=32) {
  const tanY=Math.tan(fov*Math.PI/360),tanX=tanY*aspect;
  let distance=0;
  for(let ring=0;ring<=4;ring++) for(let step=0;step<64;step++) {
    const angle=step*Math.PI/32;
    const direction=orbitDirection(Math.cos(angle)*ring/4,Math.sin(angle)*ring/4);
    const {right,up}=viewBasis(direction);
    for(const point of points) {
      const depth=dot(point,direction);
      distance=Math.max(distance,depth+Math.abs(dot(point,right))/tanX,depth+Math.abs(dot(point,up))/tanY);
    }
  }
  return distance*1.08;
}
