// src/mesh/GaussianSplatting/gs-depth-fragments.ts
var GS_LINEAR_DEPTH_HELPERS = `fn gsLinearDepth(ndcZ:f32)->f32{let p22=u.projection[2][2];let p32=u.projection[3][2];let viewZ=p32/(ndcZ-p22);let near=p32/(1.0-p22);let far=-p32/p22;return clamp((viewZ-near)/(far-near),0.0,1.0);}`;
/** Force-depth-write variant (BJS `forceDepthWriteTransparentMeshes = true`).
*  Matches BJS's `gaussianSplattingDepth.fragment.fx` default (no `ALPHA_BLENDED_DEPTH`)
*  branch exactly:
*
* ```
*      // base WGSL has `let A = -dot(in.vPos, in.vPos);` and `in.vColor.a = splat.color.a * material.alpha`
*      if (A < -in.vColor.a) { discard; }                  // ↔ if dot(vPos,vPos) > vColor.a
*      finalColor = vec4(linearDepth, linearDepth, linearDepth, 1.0);
* ```
*
*  Per-splat α is used as a *squared-radius* threshold in the splat-local 2D
*  quad coordinate (`vPos ∈ [-1,1]²`), so each splat clips to a disc of
*  radius √α inside its quad. No gaussian falloff in the depth pass —
*  surviving fragments all write `opacity = 1.0` (the EWA core is not
*  used here; that's the `gsAlphaBlendedDepthFragment` regime). */
var gsLinearDepthFragment = {
	id: "gsLinearDepth",
	helperFunctions: GS_LINEAR_DEPTH_HELPERS,
	fragmentSlots: { GS_FRAGMENT_BEFORE_FRAGCOLOR: `if(dot(in.vPos,in.vPos)>in.vColor.a){discard;}let _gsDepth=gsLinearDepth(in.pos.z);finalColor=vec4<f32>(_gsDepth,_gsDepth,_gsDepth,1.0);` }
};
/** Alpha-blended depth variant (BJS `depthRenderer.alphaBlendedDepth = true`).
*  Splat fragments emit `(d, d, d, gaussianAlpha)` so the existing GS pipeline's
*  ALPHA_COMBINE blend accumulates a soft-edged grayscale depth visualisation,
*  matching BJS `V80DRL#19`. */
var gsAlphaBlendedDepthFragment = {
	id: "gsAlphaBlendedDepth",
	helperFunctions: GS_LINEAR_DEPTH_HELPERS,
	fragmentSlots: { GS_FRAGMENT_BEFORE_FRAGCOLOR: `let _gsDepth=gsLinearDepth(in.pos.z);finalColor=vec4<f32>(_gsDepth,_gsDepth,_gsDepth,finalColor.a);` }
};
export { gsAlphaBlendedDepthFragment, gsLinearDepthFragment };

//# sourceMappingURL=gs-depth-fragments.js.map