// src/text/shaders/weight-shader-fragment.ts
/** @internal The font-weight offset fragment. `_id` is the variant field of the pipeline
*  cache key and the suffix of the composed shader modules' labels. */
var WEIGHT_SHADER_FRAGMENT = {
	_id: "w",
	_vertexSlots: {
		VO: `@location(4)@interpolate(flat)wo:f32,`,
		VD: `d.wo=0.0;`,
		VB: `let wo=sy.p.y;let sb=vec4f(md.b.xy-vec2f(wo),md.b.zw+vec2f(wo));`,
		VA: `out.wo=wo;`
	},
	_fragmentSlots: {
		FI: `@location(4)@interpolate(flat)wo:f32,`,
		FH: `fn dot2(v:vec2f)->f32{return dot(v,v);}fn dq(p:vec2f,A:vec2f,B:vec2f,C:vec2f)->f32{let a=B-A;let b=A-2.0*B+C;let c=a*2.0;let d=A-p;let bb=dot(b,b);if(bb<1.0e-7){let ba=C-A;let t=clamp(dot(p-A,ba)/max(dot(ba,ba),1.0e-9),0.0,1.0);return length((A+ba*t)-p);}let kk=1.0/bb;let kx=kk*dot(a,b);let ky=kk*(2.0*dot(a,a)+dot(d,b))/3.0;let kz=kk*dot(d,a);var res:f32;let pp=ky-kx*kx;let pp3=pp*pp*pp;let q=kx*(2.0*kx*kx-3.0*ky)+kz;let h=q*q+4.0*pp3;if(h>=0.0){let hh=sqrt(h);let x=(vec2f(hh,-hh)-q)/2.0;let uv=sign(x)*pow(abs(x),vec2f(1.0/3.0));let t=clamp(uv.x+uv.y-kx,0.0,1.0);res=dot2(d+(c+b*t)*t);}else{let z=sqrt(-pp);let v=acos(q/(pp*z*2.0))/3.0;let m=cos(v);let n=sin(v)*1.732050808;let t=clamp(vec3f(m+m,-n-m,n-m)*z-kx,vec3f(0.0),vec3f(1.0));res=min(dot2(d+(c+b*t.x)*t.x),dot2(d+(c+b*t.y)*t.y));}return sqrt(res);}fn wdst(rc:vec2f,gp:vec2i,bm:vec2i,bn:vec4f,rad:f32)->f32{let y0=clamp(i32((rc.y-rad)*bn.y+bn.w),0,bm.y);let y1=clamp(i32((rc.y+rad)*bn.y+bn.w),0,bm.y);let xl=rc.x-rad;var md=1.0e9;for(var b:i32=y0;b<=y1;b=b+1){let hr=textureLoad(bt,vec2i(gp.x+b,gp.y),0);let hn=i32(hr.x);let hl=bloc(gp,i32(hr.y));for(var i:i32=0;i<hn;i=i+1){let lr=textureLoad(bt,bloc(hl,i),0);let cv=vec2i(lr.xy);let q12=textureLoad(ct,cv,0);let q3=textureLoad(ct,vec2i(cv.x+1,cv.y),0).xy;if(max(max(q12.x,q12.z),q3.x)<xl){break;}md=min(md,dq(rc,q12.xy,q12.zw,q3));}}return md;}`,
		CO: `if(in.wo!=0.0){let aas=max(max(pe.x,pe.y),1.0e-8);let d=wdst(rc,gp,bm,in.bn,in.wo+1.0/aas);let wc=clamp((in.wo-d)*aas+0.5,0.0,1.0);cov=max(cov,wc);}`
	}
};
export { WEIGHT_SHADER_FRAGMENT };

//# sourceMappingURL=weight-shader-fragment.js.map