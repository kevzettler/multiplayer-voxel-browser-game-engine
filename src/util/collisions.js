import createBox from 'geo-3d-box';
import { vec3,mat4 } from 'gl-matrix';
import assert from 'assert';


// TODO: Don't like the duality of returning a null or float, probably doesn't optimize nicely
export function getLowestRoot(a, b, c, maxR) {
  var det = b*b - 4.0*a*c;
  if(det < 0) {
    return null;
  }

  var sqrtDet = Math.sqrt(det);
  var r1 = (-b - sqrtDet) / (2.0*a);
  var r2 = (-b + sqrtDet) / (2.0*a);

  if(r1 > r2) {
    var tmp = r2;
    r2 = r1;
    r1 = tmp;
  }

  if(r1 > 0 && r1 < maxR) {
    return r1;
  }

  if(r2 > 0 && r2 < maxR) {
    return r2;
  }

  return null;
}

// TODO: Look into a faster method.
const pt0 = [];
const pt1 = [];
const pt2 = [];
export function pointInTriangle(p, t0, t1, t2) {
  // TODO hoist for memory pooling
  vec3.subtract(pt0, t0, p);
  vec3.subtract(pt1, t1, p);
  vec3.subtract(pt2, t2, p);

  vec3.normalize(pt0, pt0);
  vec3.normalize(pt1, pt1);
  vec3.normalize(pt2, pt2);

  var a = vec3.dot(pt0, pt1);
  var b = vec3.dot(pt1, pt2);
  var c = vec3.dot(pt2, pt0);

  var angle = Math.acos(a) + Math.acos(b) + Math.acos(c);

  // If the point is on the triangle all the interior angles should add up to 360 deg.
  var collision = Math.abs(angle - (2*Math.PI)) < 0.01;
  return collision;
}
// KZ assertions prove its working correctly to some degre
// check a Y axis triangle
assert(pointInTriangle(
  [0,0,0],


  [100, 0, 0],
  [-100, 0, 0],
  [0,0, 100],
))

assert(pointInTriangle(
  [0,0,0],

  [0, 100, 0],
  [0, 0, 100],
  [0, 0, -100],
));


const vertOut = vec3.create();
export function testVertex(p, t, trace) {
  const v = vertOut;

  vec3.subtract(v, trace.ePosition, p);
  var b = 2.0*vec3.dot(trace.eVelocity, v);
  var c = vec3.squaredLength(v) - 1.0;
  var newT = getLowestRoot(trace.eVelSquaredLen, b, c, t);
  if(newT !== null) {
    trace.setCollision(newT, p);
    return newT;
  }
  return t;
}


const edge = vec3.create();
const baseToVertex = vec3.create();
export function testEdge(pa, pb, t, trace) {
  vec3.subtract(edge, pb, pa);
  vec3.subtract(baseToVertex, pa, trace.ePosition);

  var edgeSqrLen = vec3.squaredLength(edge);
  var edgeDotVel = vec3.dot(edge, trace.eVelocity);
  var edgeDotSphereVert = vec3.dot(edge, baseToVertex);

  var a = edgeSqrLen*-trace.eVelSquaredLen + edgeDotVel*edgeDotVel;
  var b = edgeSqrLen*(2.0*vec3.dot(trace.eVelocity, baseToVertex))-2.0*edgeDotVel*edgeDotSphereVert;
  var c = edgeSqrLen*(1.0-vec3.squaredLength(baseToVertex))+edgeDotSphereVert*edgeDotSphereVert;

  // Check for intersection against infinite line
  var newT = getLowestRoot(a, b, c, t);
  if (newT !== null && newT < trace.t) {
    // Check if intersection against the line segment:
    var f = (edgeDotVel*newT-edgeDotSphereVert)/edgeSqrLen;
    if (f >= 0.0 && f <= 1.0) {
      vec3.scale(baseToVertex, edge, f);
      vec3.add(baseToVertex, pa, baseToVertex);
      trace.setCollision(newT, baseToVertex, true);
      return newT;
    }
  }
  return t;
}

const normalCrossOut = [];
const edge1 = [];
const edge2 = [];
export function getNormalForTriPoints(p1,p2,p3){
  const normal = vec3.cross(
    normalCrossOut,
    vec3.sub(edge1, p2, p1),
    vec3.sub(edge2, p3, p1)
  );

  return vec3.normalize([], normal);
}

/* function getTriangleCenterPoint(p1,p2,p3){
 *   return [
 *     (p1[0] + p2[0] + p3[0]) / 3,
 *     (p1[1] + p2[1] + p3[1]) / 3,
 *     (p1[2] + p2[2] + p3[2]) / 3,
 *   ];
 * } */

/* function sortVertsClockwise(p1,p2,p3){
 *   const C = getTriangleCenterPoint(p1,p2,p3);
 *   const N = getNormalForTriPoints(p1,p2,p3); //1
 *
 *   const AC = [];
 *   const BC = [];
 *   const cross = [];
 *   return [p1,p2,p3].sort((A, B) => {
 *     vec3.sub(AC, A, C);
 *     vec3.sub(BC, B, C);
 *     vec3.cross(cross, AC, BC);
 *     return vec3.dot(N, cross);
 *   });
 * } */

export function isPointInsideAABB(point, box) {
  return (point[0] >= box[0][0] && point[0] <= box[1][0]) &&
         (point[1] >= box[0][1] && point[1] <= box[1][1]) &&
         (point[2] >= box[0][2] && point[2] <= box[1][2]);
}

export function AABBintersectAABB(a, b) {
  return (a[0][0] < b[1][0] && a[1][0] > b[0][0]) &&
         (a[0][1] < b[1][1] && a[1][1] > b[0][1]) &&
         (a[0][2] < b[1][2] && a[1][2] > b[0][2]);
}

export function vertsFromAABB(aabb){
  const min = aabb[0];
  const max = aabb[1];

  return [
     min,
    [max[0],min[1],min[2]],
    [max[0],min[1],max[2]],
    [min[1],min[1],max[2]],

    // max Y axis verts
    max,
    [min[0],max[1],max[2]],
    [min[0],max[1],min[0]],
    [max[0],max[1],min[0]]
  ];
}

export function cellsFromAABBVerts(aabbVerts){
  return [
    [ 0, 1, 2 ],
    [ 0, 2, 3 ],
    [ 6, 5, 4 ],
    [ 6, 4, 7 ],
    [ 1, 7, 4 ],
    [ 1, 4, 2 ],
    [ 0, 3, 5 ],
    [ 0, 5, 6 ],
    [ 0, 6, 7 ],
    [ 0, 7, 1 ],
    [ 2, 4, 5 ],
    [ 2, 5, 3 ]
  ];
}

/*
*
* aabb = [min[3], max[3]]
* returns {positions, cells}
*/
export function structFromAABB(aabb){
  const positions = vertsFromAABB(aabb);
  return {
    positions,
    cells: cellsFromAABBVerts(positions),
    model: mat4.identity([]),
    count: positions.length,
  }
}


/*
*
* line1 [vec3, vec3]
* line2 [vec3, vec3]
* returns distance float
*/
export function nearestDistanceBetweenLineSegments(segment1, segment2){
  const u = vec3.sub([], segment1[1], segment1[0])
  const v = vec3.sub([], segment2[1], segment2[0])
  const w = vec3.sub([], segment1[0], segment2[0])

  const a = vec3.dot(u, u);
  const b = vec3.dot(u,v);
  const c = vec3.dot(v,v);
  const d = vec3.dot(u,w);
  const e = vec3.dot(v,w);

  const D = a*c - b*b; //double
  var sc, sN, sD = D; //double
  var tc, tN, tD = D; //double

  if (D < 0.01){
            sN = 0;
            sD = 1;
            tN = e;
            tD = c;
  }else {
    sN = (b * e - c * d);
    tN = (a * e - b * d);
    if (sN < 0){
      sN = 0;
      tN = e;
      tD = c;
    } else if (sN > sD) {
      sN = sD;
      tN = e + b;
      tD = c;
    }
  }


  if (tN < 0){
    tN = 0;
    if (-d < 0){
      sN = 0;
    }else if (-d > a){
      sN = sD;
    } else{
      sN = -d;
      sD = a;
    }
  }else if (tN > tD){
    tN = tD;
    if ((-d + b) < 0){
      sN = 0;
    }else if ((-d + b) > a){
      sN = sD;
    }else{
      sN = (-d + b);
      sD = a;
    }
  }

  if (Math.abs(sN) < 0.01){
    sc = 0;
  }else{
    sc = sN / sD;
  }if (Math.abs(tN) < 0.01){
    tc = 0;
  }else{
    tc = tN / tD;
  }

  const dP = vec3.add([], w, (vec3.sub([],
                                       vec3.scale([], u, sc),
                                       vec3.scale([], v, tc)
                                      )
                             )
                     );
  const distance1 = Math.sqrt(vec3.dot(dP, dP));
  return distance1;
}
