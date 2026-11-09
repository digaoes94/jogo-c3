import { BU } from "../engine/gpu-flags.js";
import { addFramePostSubmitHook } from "../engine/frame-post-submit.js";
import { retireGpuResources, runGpuResourceCallbacks } from "../engine/gpu-resource-retirement.js";
import { enableDrawBatchCollection } from "../render/draw-update-batches.js";
import { createMeshLoDError } from "../mesh-lod/mesh-lod-errors.js";
import { meshLoDClusterDebugAttr, meshLoDConeDebugAttr, meshLoDPageRequestCode, meshLoDPageResidencyCode } from "../material/pbr/pbr-mesh-lod-debug.js";
import { _ as queueMeshLoDFrame, g as publishMeshLoDGpuReadback, h as holdMeshLoDPages } from "./mesh-lod-scene-BSlMu8U3.js";
import { addMeshLoDPageBenefit, conservativeWorldScale, extractFrustumPlanes, isSimilarityTransform, meshLoDConeCullMargin, meshLoDPageBenefit, perspectivePixelScale, projectSphere, sphereOutsidePlanes } from "../mesh-lod/mesh-lod-selection-math.js";
// src/mesh-lod/mesh-lod-selection.wgsl?raw
var mesh_lod_selection_default = "// MeshLoD GPU selection + demand compute (architecture §12.3). Mirrors the\n// deterministic `runMeshLoDGpuSelection` TS model statement-for-statement over the\n// same packed buffers, so the CPU oracle, the Node GPU model, and this shader make\n// identical float32 decisions. Reset is done with clearBuffer on the host; this\n// module provides the ordered dispatches: traverse -> evaluateGroups ->\n// selectClusters -> computeDemand -> (Task 5.3) expandClusters. Workgroup size 64.\n//\n// One immutable \"metaBuf\" buffer concatenates nodes ++ groups ++ clusters ++ pageRefs\n// (word offsets in params) to stay within the 8-storage-buffer limit; a single u32\n// per (group,instance) \"groupState\" carries visible/fine/resident/demanded bits, and\n// one \"control\" buffer holds the indirect dispatch count, diagnostics, and per-page\n// demand accumulators.\n\nstruct Params {\n  frustum: array<vec4<f32>, 6>,\n  cameraPos: vec4<f32>,        // xyz, w = near\n  targetInfo: vec4<f32>,       // targetWidth, targetHeight, pixelScale, orthographicHeight\n  thresholds: vec4<f32>,       // default screenSpaceError, refineMultiplier, coarsenMultiplier, planeCount\n  counts: vec4<u32>,           // instanceCount, groupCount, clusterCount, nodeCount\n  layout0: vec4<u32>,          // wordsPerInstance, selectedCapacity, pageCount, levelCount\n  offsets: vec4<u32>,          // nodeWordOffset, groupWordOffset, clusterWordOffset, pageRefWordOffset\n  control: vec4<u32>,          // diagWordOffset, pageDemandWordOffset, drawCapacity, coneCull\n  execution: vec4<u32>,        // debug mode, max workgroups/dimension, page-use offset, page-demand bitset offset\n};\n\n@group(0) @binding(0) var<uniform> params: Params;\n@group(0) @binding(1) var<storage, read> metaBuf: array<u32>;\n@group(0) @binding(2) var<storage, read> pageState: array<u32>;\n@group(0) @binding(3) var<storage, read> instances: array<f32>;\n@group(0) @binding(4) var<storage, read_write> priorState: array<atomic<u32>>;\n@group(0) @binding(5) var<storage, read_write> groupState: array<atomic<u32>>;\n@group(0) @binding(6) var<storage, read_write> selectedList: array<u32>;\n@group(0) @binding(7) var<storage, read_write> control: array<atomic<u32>>;\n\nconst INSTANCE_WORDS: u32 = 32u;\nconst NODE_WORDS: u32 = 8u;\nconst GROUP_WORDS: u32 = 16u;\nconst CLUSTER_WORDS: u32 = 16u;\nconst PAGE_STATE_WORDS: u32 = 8u;\n\nconst GS_VISIBLE: u32 = 0x1u;\nconst GS_FINE: u32 = 0x2u;\nconst GS_RESIDENT: u32 = 0x4u;\nconst GS_DEMANDED: u32 = 0x8u;\n\nconst PAGE_FLAG_RESIDENT: u32 = 0x1u;\nconst MAX_PAGE_BENEFIT: f32 = 3.4028234663852886e38;\n\nfn metaF32(i: u32) -> f32 { return bitcast<f32>(metaBuf[i]); }\n\nfn accumulatePageBenefit(index: u32, benefit: f32) {\n  var previous = atomicLoad(&control[index]);\n  loop {\n    let current = bitcast<f32>(previous);\n    var next = MAX_PAGE_BENEFIT;\n    if (benefit < MAX_PAGE_BENEFIT - current) {\n      next = current + benefit;\n    }\n    let result = atomicCompareExchangeWeak(&control[index], previous, bitcast<u32>(next));\n    if (result.exchanged) { break; }\n    previous = result.old_value;\n  }\n}\n\nfn groupStateIndex(inst: u32, group: u32) -> u32 { return inst * params.counts.y + group; }\nfn priorIndex(inst: u32, group: u32) -> u32 { return inst * params.layout0.x + (group >> 5u); }\n\nfn instMat(iBase: u32, col: u32, row: u32) -> f32 { return instances[iBase + col * 4u + row]; }\n\n// Project a primitive-local sphere by the instance world matrix + camera. Mirrors\n// `projectSphere` in mesh-lod-selection-math.ts (perspective + orthographic).\nstruct Projected { worldCenter: vec3<f32>, worldRadius: f32, errorPx: f32, projectedRadiusPx: f32 };\nfn projectSphere(iBase: u32, worldScale: f32, center: vec3<f32>, radius: f32, error: f32) -> Projected {\n  let m0 = vec3<f32>(instMat(iBase, 0u, 0u), instMat(iBase, 0u, 1u), instMat(iBase, 0u, 2u));\n  let m1 = vec3<f32>(instMat(iBase, 1u, 0u), instMat(iBase, 1u, 1u), instMat(iBase, 1u, 2u));\n  let m2 = vec3<f32>(instMat(iBase, 2u, 0u), instMat(iBase, 2u, 1u), instMat(iBase, 2u, 2u));\n  let t = vec3<f32>(instMat(iBase, 3u, 0u), instMat(iBase, 3u, 1u), instMat(iBase, 3u, 2u));\n  let world = m0 * center.x + m1 * center.y + m2 * center.z + t;\n  let worldRadius = radius * worldScale;\n  let worldError = error * worldScale;\n  let d = params.cameraPos.xyz - world;\n  let distance = sqrt(dot(d, d));\n  let surfaceDistance = max(distance - worldRadius, params.cameraPos.w);\n  let orthoHeight = params.targetInfo.w;\n  var errorPx: f32;\n  var projectedRadiusPx: f32;\n  if (orthoHeight > 0.0) {\n    let scale = params.targetInfo.y / orthoHeight;\n    errorPx = worldError * scale;\n    projectedRadiusPx = worldRadius * scale;\n  } else {\n    let pixelScale = params.targetInfo.z;\n    errorPx = worldError * pixelScale / surfaceDistance;\n    projectedRadiusPx = worldRadius * pixelScale / surfaceDistance;\n  }\n  return Projected(world, worldRadius, errorPx, projectedRadiusPx);\n}\n\nfn sphereOutside(center: vec3<f32>, radius: f32) -> bool {\n  let planeCount = u32(params.thresholds.w);\n  for (var i = 0u; i < planeCount; i = i + 1u) {\n    let p = params.frustum[i];\n    if (dot(p.xyz, center) + p.w < -radius) { return true; }\n  }\n  return false;\n}\n\nfn pageResident(pageId: u32) -> bool {\n  return (pageState[pageId * PAGE_STATE_WORDS] & PAGE_FLAG_RESIDENT) != 0u;\n}\n\nfn groupPagesResident(firstPageRef: u32, pageRefCount: u32) -> bool {\n  let refBase = params.offsets.w;\n  for (var i = 0u; i < pageRefCount; i = i + 1u) {\n    if (!pageResident(metaBuf[refBase + firstPageRef + i])) { return false; }\n  }\n  return true;\n}\n\nfn unpackSnorm8(packed: u32, shift: u32) -> f32 {\n  let byte = i32((packed >> shift) & 0xffu);\n  return f32(select(byte, byte - 256, byte >= 128)) / 127.0;\n}\n\n// Positive means potentially visible; <= 0 satisfies meshoptimizer's conservative\n// perspective backface test. Disabled for double-sided materials, orthographic\n// projection, non-similarity transforms, and clusters without a useful cone.\nfn coneCullMargin(iBase: u32, cBase: u32) -> f32 {\n  if (params.control.w == 0u || params.targetInfo.w > 0.0 ||\n      bitcast<u32>(instances[iBase + 31u]) == 0u || metaBuf[cBase + 15u] == 0u) {\n    return 1.0;\n  }\n  let packed = metaBuf[cBase + 13u];\n  let localAxis = vec3<f32>(unpackSnorm8(packed, 0u), unpackSnorm8(packed, 8u), unpackSnorm8(packed, 16u));\n  let n0 = vec3<f32>(instances[iBase + 16u], instances[iBase + 17u], instances[iBase + 18u]);\n  let n1 = vec3<f32>(instances[iBase + 20u], instances[iBase + 21u], instances[iBase + 22u]);\n  let n2 = vec3<f32>(instances[iBase + 24u], instances[iBase + 25u], instances[iBase + 26u]);\n  let axis = normalize(n0 * localAxis.x + n1 * localAxis.y + n2 * localAxis.z);\n  let center = vec3<f32>(metaF32(cBase), metaF32(cBase + 1u), metaF32(cBase + 2u));\n  let p = projectSphere(iBase, instances[iBase + 28u], center, metaF32(cBase + 3u), 0.0);\n  let view = p.worldCenter - params.cameraPos.xyz;\n  let distance = length(view);\n  let threshold = metaF32(cBase + 14u) * distance + p.worldRadius;\n  return (threshold - dot(view, axis)) / max(distance, 1.0e-20);\n}\n\nfn invocationIndex(gid: vec3<u32>, dimensions: vec3<u32>) -> u32 {\n  return gid.x + (gid.y + gid.z * dimensions.y) * dimensions.x * 64u;\n}\n\n// ── 1. Hierarchy visibility: one invocation per (node, instance). Under conservative\n//    bounds a not-outside leaf's ancestors are all not-outside, so the per-leaf test\n//    equals the root-down traversal the CPU oracle performs. ──\n@compute @workgroup_size(64)\nfn traverse(@builtin(global_invocation_id) gid: vec3<u32>, @builtin(num_workgroups) dimensions: vec3<u32>) {\n  let invocation = invocationIndex(gid, dimensions);\n  let total = params.counts.w * params.counts.x; // nodeCount * instanceCount\n  if (invocation >= total) { return; }\n  let node = invocation % params.counts.w;\n  let inst = invocation / params.counts.w;\n  let iBase = inst * INSTANCE_WORDS;\n  if (bitcast<u32>(instances[iBase + 29u]) == 0u) { return; } // invisible\n  let nBase = params.offsets.x + node * NODE_WORDS;\n  let groupId = i32(metaBuf[nBase + 5u]);\n  if (groupId < 0) { return; } // internal node\n  let center = vec3<f32>(metaF32(nBase), metaF32(nBase + 1u), metaF32(nBase + 2u));\n  let worldScale = instances[iBase + 28u];\n  let p = projectSphere(iBase, worldScale, center, metaF32(nBase + 3u), metaF32(nBase + 4u));\n  if (!sphereOutside(p.worldCenter, p.worldRadius)) {\n    atomicOr(&groupState[groupStateIndex(inst, u32(groupId))], GS_VISIBLE);\n  }\n}\n\n// ── 2. Group evaluation: one invocation per (group, instance). Residency, hysteretic\n//    fine-required decision (asymmetric equality), prior-state persist, diagnostics. ──\n@compute @workgroup_size(64)\nfn evaluateGroups(@builtin(global_invocation_id) gid: vec3<u32>, @builtin(num_workgroups) dimensions: vec3<u32>) {\n  let invocation = invocationIndex(gid, dimensions);\n  let total = params.counts.y * params.counts.x; // groupCount * instanceCount\n  if (invocation >= total) { return; }\n  let group = invocation % params.counts.y;\n  let inst = invocation / params.counts.y;\n  let iBase = inst * INSTANCE_WORDS;\n  if (bitcast<u32>(instances[iBase + 29u]) == 0u) { return; }\n  let sse = select(params.thresholds.x, instances[iBase + 19u], instances[iBase + 19u] > 0.0);\n  let gBase = params.offsets.y + group * GROUP_WORDS;\n  let gsIdx = groupStateIndex(inst, group);\n\n  let resident = groupPagesResident(metaBuf[gBase + 8u], metaBuf[gBase + 9u]);\n  if (resident) { atomicOr(&groupState[gsIdx], GS_RESIDENT); }\n\n  let terminal = (metaBuf[gBase + 10u] & 0x1u) != 0u;\n  let simplifiedError = metaF32(gBase + 4u);\n  var fine: bool;\n  let pIdx = priorIndex(inst, group);\n  let mask = 1u << (group & 31u);\n  if (terminal || !(simplifiedError == simplifiedError) || simplifiedError > 3.0e38) {\n    fine = true;\n  } else {\n    let center = vec3<f32>(metaF32(gBase), metaF32(gBase + 1u), metaF32(gBase + 2u));\n    let worldScale = instances[iBase + 28u];\n    let errorPx = projectSphere(iBase, worldScale, center, metaF32(gBase + 3u), simplifiedError).errorPx;\n    let wasFine = (atomicLoad(&priorState[pIdx]) & mask) != 0u;\n    if (wasFine) { fine = errorPx >= sse * params.thresholds.z; }\n    else { fine = errorPx > sse * params.thresholds.y; }\n  }\n  if (fine) {\n    atomicOr(&groupState[gsIdx], GS_FINE);\n    atomicOr(&priorState[pIdx], mask);\n  } else {\n    atomicAnd(&priorState[pIdx], ~mask);\n  }\n  if ((atomicLoad(&groupState[gsIdx]) & GS_VISIBLE) != 0u) {\n    atomicAdd(&control[params.control.x], 1u); // visibleGroupCount diag\n  }\n}\n\n// ── 3. Cluster selection: one invocation per (cluster, instance). Preserve the\n//    hierarchy-visible group as an atomic crack-free cut, then append\n//    (cluster, instance). A second cluster-sphere cull can disagree with the\n//    conservative group bounds and punch view-dependent holes. ──\n@compute @workgroup_size(64)\nfn selectClusters(@builtin(global_invocation_id) gid: vec3<u32>, @builtin(num_workgroups) dimensions: vec3<u32>) {\n  let invocation = invocationIndex(gid, dimensions);\n  let total = params.counts.z * params.counts.x; // clusterCount * instanceCount\n  if (invocation >= total) { return; }\n  let cluster = invocation % params.counts.z;\n  let inst = invocation / params.counts.z;\n  let iBase = inst * INSTANCE_WORDS;\n  if (bitcast<u32>(instances[iBase + 29u]) == 0u) { return; }\n  let cBase = params.offsets.z + cluster * CLUSTER_WORDS;\n  let g = metaBuf[cBase + 5u];\n  let gs = atomicLoad(&groupState[groupStateIndex(inst, g)]);\n  if ((gs & GS_VISIBLE) == 0u || (gs & GS_RESIDENT) == 0u || (gs & GS_FINE) == 0u) { return; }\n  let r = i32(metaBuf[cBase + 6u]);\n  if (r >= 0) {\n    let rs = atomicLoad(&groupState[groupStateIndex(inst, u32(r))]);\n    if ((rs & GS_FINE) != 0u && (rs & GS_RESIDENT) != 0u) { return; } // finer group draws instead\n  }\n  if (coneCullMargin(iBase, cBase) <= 0.0) { return; }\n  let idx = atomicAdd(&control[0], 1u); // reserve; control[0] doubles as indirect X\n  if (idx < params.layout0.y) {\n    selectedList[1u + idx * 2u] = cluster;\n    selectedList[2u + idx * 2u] = inst;\n    let pageId = metaBuf[cBase + 7u];\n    atomicOr(&control[params.execution.z + (pageId >> 5u)], 1u << (pageId & 31u));\n    let triangles = metaBuf[cBase + 11u];\n    let previous = atomicAdd(&control[params.control.x + 1u], triangles);\n    let triangleCap = params.control.z / 3u;\n    if (triangles > triangleCap || previous > triangleCap - min(triangles, triangleCap)) {\n      atomicOr(&control[params.control.x + 2u], 2u); // selected cut exceeds the draw buffer\n    }\n    let gBase = params.offsets.y + g * GROUP_WORDS;\n    let simplifiedError = metaF32(gBase + 4u);\n    if (simplifiedError >= 0.0 && simplifiedError <= 3.0e38) {\n      let center = vec3<f32>(metaF32(gBase), metaF32(gBase + 1u), metaF32(gBase + 2u));\n      let errorPx = projectSphere(iBase, instances[iBase + 28u], center, metaF32(gBase + 3u), simplifiedError).errorPx;\n      if (errorPx >= 0.0 && errorPx <= 3.0e38) {\n        atomicMax(&control[params.control.x + 4u], bitcast<u32>(errorPx)); // selected SSE maximum\n      }\n    }\n  } else {\n    atomicOr(&control[params.control.x + 2u], 1u); // overflow flag\n  }\n  // Mark a wanted-but-missing finer group so computeDemand accumulates its priority.\n  if (r >= 0) {\n    let rs = atomicLoad(&groupState[groupStateIndex(inst, u32(r))]);\n    if ((rs & GS_FINE) != 0u && (rs & GS_RESIDENT) == 0u) {\n      atomicOr(&groupState[groupStateIndex(inst, u32(r))], GS_DEMANDED);\n    }\n  }\n}\n\n// ── 4. Page demand: one invocation per (group, instance). Visible demanded groups\n//    accumulate per-page benefit/cost priority for streaming readback (§11.1). ──\n@compute @workgroup_size(64)\nfn computeDemand(@builtin(global_invocation_id) gid: vec3<u32>, @builtin(num_workgroups) dimensions: vec3<u32>) {\n  let invocation = invocationIndex(gid, dimensions);\n  let total = params.counts.y * params.counts.x;\n  if (invocation >= total) { return; }\n  let group = invocation % params.counts.y;\n  let inst = invocation / params.counts.y;\n  let iBase = inst * INSTANCE_WORDS;\n  if (bitcast<u32>(instances[iBase + 29u]) == 0u) { return; }\n  let gsIdx = groupStateIndex(inst, group);\n  if ((atomicLoad(&groupState[gsIdx]) & GS_DEMANDED) == 0u) { return; }\n  let gBase = params.offsets.y + group * GROUP_WORDS;\n  let firstPageRef = metaBuf[gBase + 8u];\n  let pageRefCount = metaBuf[gBase + 9u];\n  var missing = 0u;\n  for (var i = 0u; i < pageRefCount; i = i + 1u) {\n    if (!pageResident(metaBuf[params.offsets.w + firstPageRef + i])) { missing = missing + 1u; }\n  }\n  if (missing == 0u) { return; }\n  let center = vec3<f32>(metaF32(gBase), metaF32(gBase + 1u), metaF32(gBase + 2u));\n  let worldScale = instances[iBase + 28u];\n  let p = projectSphere(iBase, worldScale, center, metaF32(gBase + 3u), metaF32(gBase + 4u));\n  let areaCap = params.targetInfo.x * params.targetInfo.y;\n  let projectedAreaPx = min(3.14159265358979323846 * p.projectedRadiusPx * p.projectedRadiusPx, areaCap);\n  let sse = select(params.thresholds.x, instances[iBase + 19u], instances[iBase + 19u] > 0.0);\n  let qualityPressure = max(0.0, p.errorPx / sse - 1.0);\n  let groupBenefit = projectedAreaPx * qualityPressure;\n  let pageShare = groupBenefit / f32(missing);\n  let demandBase = params.control.y;\n  for (var i = 0u; i < pageRefCount; i = i + 1u) {\n    let pageId = metaBuf[params.offsets.w + firstPageRef + i];\n    if (!pageResident(pageId)) {\n      atomicOr(&control[params.execution.w + (pageId >> 5u)], 1u << (pageId & 31u));\n      accumulatePageBenefit(demandBase + pageId, pageShare);\n    }\n  }\n  atomicAdd(&control[params.control.x + 3u], 1u); // fallbackGroupCount diag\n  if (p.errorPx >= 0.0) {\n    atomicMax(&control[params.control.x + 5u], bitcast<u32>(p.errorPx)); // unmet SSE maximum\n  }\n}\n\n// ── Task 5.3 clamp — 1 invocation. Runs at the end of the SELECTION pass so the\n//    expansion dispatch (a separate pass) skips the entire cut on overflow.\n//    Splitting the passes is required: a buffer cannot be writable storage and an\n//    indirect-dispatch source in the same synchronization scope. ──\n@compute @workgroup_size(1)\nfn clampSelectedCount() {\n  let c = atomicLoad(&control[0]);\n  let cap = params.layout0.y;\n  if (c > cap) {\n    atomicOr(&control[params.control.x + 2u], 1u); // selection overflow diag\n  }\n  if (atomicLoad(&control[params.control.x + 2u]) != 0u) {\n    atomicStore(&control[0], 0u); // never expand a partial cut\n  }\n  let count = atomicLoad(&control[0]);\n  selectedList[0] = count;\n  let x = min(count, params.execution.y);\n  let rows = (count + max(x, 1u) - 1u) / max(x, 1u);\n  let y = max(min(rows, params.execution.y), 1u);\n  let z = max((rows + y - 1u) / y, 1u);\n  atomicStore(&control[1], x);\n  atomicStore(&control[2], y);\n  atomicStore(&control[3], z);\n}\n\n// ── Task 5.3 expansion — its own bind-group layout {0,1,2,6,8,9,10} (no `control`,\n//    which is the indirect-dispatch source in this pass). One workgroup per selected\n//    cluster (the dispatch launches only when the entire cut fits, so every\n//    workgroup is active) reserves triangleCount*3 draw vertices atomically, then all\n//    lanes decode packed u16 local indices in the geometry arena into absolute vertex-\n//    word offsets and 16-byte draw-vertex records. No vertex/index buffer is bound. ──\n@group(0) @binding(8) var<storage, read> arena: array<u32>;\n@group(0) @binding(9) var<storage, read_write> drawVertices: array<u32>;\n@group(0) @binding(10) var<storage, read_write> drawArgs: array<atomic<u32>>;\n\nconst VERTEX_WORDS: u32 = 6u; // 24-byte packed vertex / 4\n\nvar<workgroup> wgBase: u32;\n\nfn readLocalIndex(byteOffset: u32) -> u32 {\n  let word = arena[byteOffset >> 2u];\n  let shift = (byteOffset & 2u) * 8u;\n  return (word >> shift) & 0xffffu;\n}\n\n@compute @workgroup_size(64)\nfn expandClusters(@builtin(workgroup_id) wid: vec3<u32>, @builtin(local_invocation_id) lid: vec3<u32>, @builtin(num_workgroups) dimensions: vec3<u32>) {\n  let selected = wid.x + (wid.y + wid.z * dimensions.y) * dimensions.x;\n  let pair = min(selected, selectedList[0] - 1u);\n  let clusterId = selectedList[1u + pair * 2u];\n  let slot = selectedList[2u + pair * 2u];\n  let cBase = params.offsets.z + clusterId * CLUSTER_WORDS;\n  let pageId = metaBuf[cBase + 7u];\n  let clusterIndexOffset = metaBuf[cBase + 9u]; // first local index (u16 elements)\n  let indexCount = select(0u, metaBuf[cBase + 11u] * 3u, selected < selectedList[0]);\n  let psBase = pageId * PAGE_STATE_WORDS;\n  let arenaVertexWord = pageState[psBase + 2u] >> 2u; // absolute vertex byte -> word\n  let arenaIndexByte = pageState[psBase + 3u];\n  // RH/CCW source triangles need swapping for positive determinants in Lite's LH view.\n  let reverseWinding = instances[slot * INSTANCE_WORDS + 23u] > 0.0;\n  let drawCapacity = params.control.z;\n  let groupId = metaBuf[cBase + 5u];\n  let gBase = params.offsets.y + groupId * GROUP_WORDS;\n  var debug = 0u;\n  switch params.execution.x {\n    case 2u: { debug = metaBuf[gBase + 5u]; }\n    case 3u: { debug = groupId; }\n    case 4u: {\n      let flags = pageState[psBase];\n      debug = select(select(0u, 1u, (flags & 1u) != 0u), 2u, (flags & 2u) != 0u);\n      debug = select(debug, 3u, (flags & 4u) != 0u);\n    }\n    case 5u: { debug = pageState[psBase + 7u]; }\n    case 6u: { debug = bitcast<u32>(coneCullMargin(slot * INSTANCE_WORDS, cBase)); }\n    default: {}\n  }\n  if (lid.x == 0u) { wgBase = atomicAdd(&drawArgs[0], indexCount); }\n  workgroupBarrier();\n  let base = wgBase;\n  for (var k = lid.x; k < indexCount; k = k + 64u) {\n    let dst = base + k;\n    if (dst >= drawCapacity) { continue; } // capacity guard: never write OOB\n    let corner = k % 3u;\n    let sourceIndex = select(k, k + 3u - 2u * corner, reverseWinding && corner != 0u);\n    let localVertex = readLocalIndex(arenaIndexByte + (clusterIndexOffset + sourceIndex) * 2u);\n    let o = dst * 4u;\n    drawVertices[o] = arenaVertexWord + localVertex * VERTEX_WORDS;\n    drawVertices[o + 1u] = clusterId;\n    drawVertices[o + 2u] = slot;\n    drawVertices[o + 3u] = debug; // observational; never affects selection or residency\n  }\n}\n\n// Finalize the indirect draw: suppress the entire cut if expansion somehow exceeds\n// capacity (flagged in drawArgs word 4, not control, which is indirect-only here).\n@compute @workgroup_size(1)\nfn finalizeDraw() {\n  let cap = params.control.z;\n  let v = atomicLoad(&drawArgs[0]);\n  if (v > cap) {\n    atomicStore(&drawArgs[0], 0u);\n    atomicStore(&drawArgs[4], 1u); // expansion overflow diag\n  }\n  atomicStore(&drawArgs[1], 1u); // instanceCount\n}\n";
// src/mesh-lod/mesh-lod-selection-gpu.ts
/** MeshLoD GPU selection buffers — persistent packed metadata and per-batch state.
*
*  Phase 5 moves selection/expansion to compute. This module owns the CPU→GPU data
*  contract only (architecture §12.1): it packs the parsed immutable hierarchy into
*  the exact `Uint32Array` word layouts the selection WGSL reads, allocates the
*  device-limit-checked persistent storage buffers, keeps the mutable page-state and
*  per-instance/prior-state buffers in sync, and grows the transient-capacity buffers
*  make-before-break. It never parses WGSL strings and never exposes a raw GPU handle
*  outside the internal runtime/material records.
*
*  Buffer ownership mirrors the sharing model:
*  - immutable node/group/cluster/page-ref buffers and the mutable page-state buffer
*    are per **asset** (`MeshLoDGpuAssetBuffers`), so every scene batch and instance
*    that shares one hierarchy reuses them;
*  - the instance transform buffer and per-instance/group prior-hysteresis bitset are
*    per **batch** (`MeshLoDGpuInstanceState`), so instance state stays independent. */
/** 8 × u32 words per 32-byte hierarchy node. */
var NODE_WORDS = 8;
/** 16 × u32 words per 64-byte group. */
var GROUP_WORDS = 16;
/** 16 × u32 words per 64-byte cluster. */
var CLUSTER_WORDS = 16;
/** 8 × u32 words per 32-byte page-state record. */
var PAGE_STATE_WORDS = 8;
/** 128-byte / 32-word instance record. */
var INSTANCE_BYTES = 128;
var INSTANCE_WORDS = 32;
/** 24-byte packed vertex (position f32x3, oct-normal, half-UV, reserved) → 6 words. */
var VERTEX_WORDS = 6;
/** Page-state flag bits (word 0). */
var PAGE_FLAG_RESIDENT = 1;
var PAGE_FLAG_PINNED = 2;
var PAGE_FLAG_FAILED = 4;
var PAGE_FLAG_UPLOADING = 8;
var F32_SCRATCH = /* @__PURE__ */ new Float32Array(1);
var U32_SCRATCH = new Uint32Array(F32_SCRATCH.buffer);
/** Reinterpret a float32 as its u32 bit pattern (the WGSL `bitcast<u32>` a shader
*  reverses with `bitcast<f32>`). */
function f32Bits(value) {
	F32_SCRATCH[0] = value;
	return U32_SCRATCH[0];
}
/** Reinterpret a u32 bit pattern back to float32 (mirrors the WGSL `bitcast<f32>`). */
function u32ToF32(bits) {
	U32_SCRATCH[0] = bits;
	return F32_SCRATCH[0];
}
/** Pack the 8-wide hierarchy nodes into `NODE_WORDS` words each: center xyz + radius
*  + error as float bits, then `groupId` (i32, `-1` internal), child offset, child
*  count. */
function packHierarchyNodes(nodes) {
	const out = new Uint32Array(Math.max(nodes.length, 1) * 8);
	for (let i = 0; i < nodes.length; i++) {
		const n = nodes[i];
		const b = i * 8;
		out[b] = f32Bits(n.center[0]);
		out[b + 1] = f32Bits(n.center[1]);
		out[b + 2] = f32Bits(n.center[2]);
		out[b + 3] = f32Bits(n.radius);
		out[b + 4] = f32Bits(n.error);
		out[b + 5] = n.groupId | 0;
		out[b + 6] = n.childOffset;
		out[b + 7] = n.childCount;
	}
	return out;
}
/** Pack groups into `GROUP_WORDS` words: center/radius/simplifiedError float bits,
*  depth, cluster range, page-ref range, terminal/pinned flags, and triangle counts. */
function packGroups(groups) {
	const out = new Uint32Array(Math.max(groups.length, 1) * 16);
	for (let i = 0; i < groups.length; i++) {
		const g = groups[i];
		const b = i * 16;
		out[b] = f32Bits(g.center[0]);
		out[b + 1] = f32Bits(g.center[1]);
		out[b + 2] = f32Bits(g.center[2]);
		out[b + 3] = f32Bits(g.radius);
		out[b + 4] = f32Bits(g.simplifiedError);
		out[b + 5] = g.depth;
		out[b + 6] = g.firstCluster;
		out[b + 7] = g.clusterCount;
		out[b + 8] = g.firstPageRef;
		out[b + 9] = g.pageRefCount;
		out[b + 10] = (g.terminal ? 1 : 0) | (g.pinned ? 2 : 0);
		out[b + 11] = g.sourceTriangleCount;
		out[b + 12] = g.outputTriangleCount;
	}
	return out;
}
/** Pack clusters into `CLUSTER_WORDS` words: center/radius/error float bits, group
*  id, `refinedGroupId` (i32, `-1` finest), page id, vertex/index offsets, vertex and
*  triangle counts. */
function packClusters(clusters) {
	const out = new Uint32Array(Math.max(clusters.length, 1) * 16);
	for (let i = 0; i < clusters.length; i++) {
		const c = clusters[i];
		const b = i * 16;
		out[b] = f32Bits(c.center[0]);
		out[b + 1] = f32Bits(c.center[1]);
		out[b + 2] = f32Bits(c.center[2]);
		out[b + 3] = f32Bits(c.radius);
		out[b + 4] = f32Bits(c.error);
		out[b + 5] = c.groupId;
		out[b + 6] = c.refinedGroupId | 0;
		out[b + 7] = c.pageId;
		out[b + 8] = c.vertexOffset;
		out[b + 9] = c.indexOffset;
		out[b + 10] = c.vertexCount;
		out[b + 11] = c.triangleCount;
		out[b + 12] = c.sourceTriangleCount;
		if (c.normalCone) {
			const packSnorm8 = (value) => Math.round(Math.max(-1, Math.min(1, value)) * 127) & 255;
			out[b + 13] = packSnorm8(c.normalCone[0]) | packSnorm8(c.normalCone[1]) << 8 | packSnorm8(c.normalCone[2]) << 16;
			out[b + 14] = f32Bits(c.normalCone[3]);
			out[b + 15] = 1;
		}
	}
	return out;
}
/** Pack the flat group→page-ref table as raw `u32` page IDs. */
function packGroupPageRefs(refs) {
	return refs.length > 0 ? Uint32Array.from(refs) : /* @__PURE__ */ new Uint32Array(1);
}
/** Write one page-state record (`PAGE_STATE_WORDS` words) from a runtime page and its
*  immutable record. Vertex/index byte offsets are absolute within the arena so the
*  expansion kernel can index the raw geometry directly; they read as zero until the
*  page is resident. */
function writePageStateRecord(out, wordBase, page, record, generation) {
	const resident = page.state === "gpu-resident" && page.arenaOffset >= 0;
	const base = resident ? page.arenaOffset : 0;
	out[wordBase] = (resident ? 1 : 0) | (record.pinned ? 2 : 0) | (page.state === "terminal-failed" ? 4 : 0);
	out[wordBase + 1] = base;
	out[wordBase + 2] = resident ? base + record.vertexByteOffset : 0;
	out[wordBase + 3] = resident ? base + record.indexByteOffset : 0;
	out[wordBase + 4] = record.vertexCount;
	out[wordBase + 5] = record.localIndexCount;
	out[wordBase + 6] = resident ? generation : 0;
	out[wordBase + 7] = meshLoDPageRequestCode(record.pinned, page.state);
}
/** Build the full page-state array from the current runtime residency. */
function buildPageStateData(pages, records, generation) {
	const out = new Uint32Array(Math.max(pages.length, 1) * 8);
	for (let i = 0; i < pages.length; i++) writePageStateRecord(out, i * 8, pages[i], records[i], generation);
	return out;
}
/** Write one 128-byte instance record: world matrix, cofactor normal matrix as three
*  padded `vec4` rows, conservative world scale, visibility flag, and stable instance ID.
*  The cofactor matrix `(c1×c2, c2×c0, c0×c1)` is the inverse-transpose up to
*  determinant sign — correct after the shader's `normalize()`. Singular or
*  non-finite transforms reject instead of emitting undefined shading normals. */
function packInstanceRecord(f32, u32, wordBase, world, visible, instanceId, screenSpaceError) {
	for (let i = 0; i < 16; i++) f32[wordBase + i] = world[i];
	const c0x = world[0], c0y = world[1], c0z = world[2];
	const c1x = world[4], c1y = world[5], c1z = world[6];
	const c2x = world[8], c2y = world[9], c2z = world[10];
	const determinant = c0x * (c1y * c2z - c1z * c2y) + c0y * (c1z * c2x - c1x * c2z) + c0z * (c1x * c2y - c1y * c2x);
	if (!Number.isFinite(determinant) || determinant === 0 || Array.from(world).some((value) => !Number.isFinite(value))) throw createMeshLoDError("MLOD_INVALID_OPTION", "MeshLoD world matrix must be finite and nonsingular", { actual: determinant });
	const sign = determinant < 0 ? -1 : 1;
	f32[wordBase + 16] = sign * (c1y * c2z - c1z * c2y);
	f32[wordBase + 17] = sign * (c1z * c2x - c1x * c2z);
	f32[wordBase + 18] = sign * (c1x * c2y - c1y * c2x);
	f32[wordBase + 19] = screenSpaceError ?? 0;
	f32[wordBase + 20] = sign * (c2y * c0z - c2z * c0y);
	f32[wordBase + 21] = sign * (c2z * c0x - c2x * c0z);
	f32[wordBase + 22] = sign * (c2x * c0y - c2y * c0x);
	f32[wordBase + 23] = sign;
	f32[wordBase + 24] = sign * (c0y * c1z - c0z * c1y);
	f32[wordBase + 25] = sign * (c0z * c1x - c0x * c1z);
	f32[wordBase + 26] = sign * (c0x * c1y - c0y * c1x);
	f32[wordBase + 27] = 0;
	f32[wordBase + 28] = conservativeWorldScale(world);
	u32[wordBase + 29] = visible ? 1 : 0;
	u32[wordBase + 30] = instanceId >>> 0;
	u32[wordBase + 31] = isSimilarityTransform(world) ? 1 : 0;
}
function priorBit(prior, slot, wordsPerInstance, group) {
	return (prior[slot * wordsPerInstance + (group >>> 5)] & 1 << (group & 31)) !== 0;
}
function setPriorBit(prior, slot, wordsPerInstance, group, value) {
	const idx = slot * wordsPerInstance + (group >>> 5);
	const mask = 1 << (group & 31);
	prior[idx] = value ? prior[idx] | mask : prior[idx] & ~mask;
}
function nodeCenter(nodes, base) {
	return [
		u32ToF32(nodes[base]),
		u32ToF32(nodes[base + 1]),
		u32ToF32(nodes[base + 2])
	];
}
function pageResident(pageState, pageId) {
	return (pageState[pageId * 8] & 1) !== 0;
}
function groupPagesResident(input, firstPageRef, pageRefCount) {
	for (let i = 0; i < pageRefCount; i++) if (!pageResident(input.pageState, input.groupPageRefs[firstPageRef + i])) return false;
	return true;
}
/** Run the deterministic GPU selection model over the packed buffers. It reproduces
*  the selection WGSL exactly (shared float32 math, per-instance dispatch, per-leaf
*  frustum visibility, crack-free residency cut, atomic-append ordering, and the
*  benefit/cost page demand) so Node fixtures can compare GPU selection to the CPU
*  oracle without a real device. Returns selected (cluster, instance) pairs in
*  append order (ascending instance, then ascending cluster). */
function runMeshLoDGpuSelection(input) {
	const { params, groupCount, clusterCount, nodeCount, wordsPerInstance } = input;
	const pixelScale = Math.fround(params.perspectivePixelScale ?? perspectivePixelScale(params.targetHeight, params.verticalFov));
	const refineMultiplier = Math.fround(1 + params.lodHysteresis);
	const coarsenMultiplier = Math.fround(1 - params.lodHysteresis);
	const maxSelected = input.maxSelected ?? Number.POSITIVE_INFINITY;
	const selected = [];
	const demandShare = /* @__PURE__ */ new Map();
	let visibleGroupCount = 0;
	let fallbackGroupCount = 0;
	let renderedTriangleCount = 0;
	let selectedMeshletCount = 0;
	let maximumSelectedErrorPixels = 0;
	let maximumUnmetErrorPixels = 0;
	let overflow = false;
	const world = /* @__PURE__ */ new Float32Array(16);
	const groupErrorPx = new Float64Array(groupCount);
	const fineRequired = new Uint8Array(groupCount);
	const resident = new Uint8Array(groupCount);
	const visible = new Uint8Array(groupCount);
	for (let s = 0; s < input.instanceCount; s++) {
		const iBase = s * 32;
		if (input.instancesU32[iBase + 29] === 0) continue;
		for (let i = 0; i < 16; i++) world[i] = input.instances[iBase + i];
		const worldScale = input.instances[iBase + 28];
		const threshold = input.instances[iBase + 19] > 0 ? input.instances[iBase + 19] : params.screenSpaceError;
		const refineBoundary = Math.fround(threshold * refineMultiplier);
		const coarsenBoundary = Math.fround(threshold * coarsenMultiplier);
		for (let g = 0; g < groupCount; g++) {
			const gBase = g * 16;
			resident[g] = groupPagesResident(input, input.groups[gBase + 8], input.groups[gBase + 9]) ? 1 : 0;
			const simplifiedError = u32ToF32(input.groups[gBase + 4]);
			if ((input.groups[gBase + 10] & 1) !== 0 || !Number.isFinite(simplifiedError)) {
				fineRequired[g] = 1;
				groupErrorPx[g] = Number.POSITIVE_INFINITY;
				setPriorBit(input.priorState, s, wordsPerInstance, g, true);
				continue;
			}
			const center = [
				u32ToF32(input.groups[gBase]),
				u32ToF32(input.groups[gBase + 1]),
				u32ToF32(input.groups[gBase + 2])
			];
			const radius = u32ToF32(input.groups[gBase + 3]);
			const errorPx = projectSphere(world, params.cameraPos, params.near, params.orthographicHeight, params.targetHeight, worldScale, pixelScale, center, radius, simplifiedError).errorPx;
			groupErrorPx[g] = errorPx;
			const fine = priorBit(input.priorState, s, wordsPerInstance, g) ? errorPx >= coarsenBoundary : errorPx > refineBoundary;
			fineRequired[g] = fine ? 1 : 0;
			setPriorBit(input.priorState, s, wordsPerInstance, g, fine);
		}
		visible.fill(0);
		for (let n = 0; n < nodeCount; n++) {
			const nBase = n * 8;
			const gid = input.nodes[nBase + 5] | 0;
			if (gid === -1) continue;
			const p = projectSphere(world, params.cameraPos, params.near, params.orthographicHeight, params.targetHeight, worldScale, pixelScale, nodeCenter(input.nodes, nBase), u32ToF32(input.nodes[nBase + 3]), u32ToF32(input.nodes[nBase + 4]));
			if (!sphereOutsidePlanes(params.frustumPlanes, p.worldCenter, p.worldRadius)) visible[gid] = 1;
		}
		for (let g = 0; g < groupCount; g++) visibleGroupCount += visible[g];
		const demandedGroups = /* @__PURE__ */ new Set();
		for (let c = 0; c < clusterCount; c++) {
			const cBase = c * 16;
			const g = input.clusters[cBase + 5];
			if (!visible[g] || !resident[g] || !fineRequired[g]) continue;
			const r = input.clusters[cBase + 6] | 0;
			if (r !== -1 && fineRequired[r] === 1 && resident[r] === 1) continue;
			if (params.coneCull !== false && !(params.orthographicHeight !== void 0 && params.orthographicHeight > 0) && input.instancesU32[iBase + 31] !== 0 && input.clusters[cBase + 15] !== 0) {
				const packed = input.clusters[cBase + 13];
				const snorm8 = (shift) => {
					const byte = packed >>> shift & 255;
					return (byte >= 128 ? byte - 256 : byte) / 127;
				};
				const normalCone = [
					snorm8(0),
					snorm8(8),
					snorm8(16),
					u32ToF32(input.clusters[cBase + 14])
				];
				const center = [
					u32ToF32(input.clusters[cBase]),
					u32ToF32(input.clusters[cBase + 1]),
					u32ToF32(input.clusters[cBase + 2])
				];
				if (meshLoDConeCullMargin(world, params.cameraPos, center, u32ToF32(input.clusters[cBase + 3]), normalCone) <= 0) continue;
			}
			if (selected.length >= maxSelected) {
				overflow = true;
				break;
			}
			selected.push({
				clusterId: c,
				instanceId: s
			});
			selectedMeshletCount++;
			renderedTriangleCount += input.clusters[cBase + 11];
			const err = groupErrorPx[g];
			if (Number.isFinite(err) && err > maximumSelectedErrorPixels) maximumSelectedErrorPixels = err;
			if (r !== -1 && fineRequired[r] === 1 && resident[r] === 0) demandedGroups.add(r);
		}
		for (const r of demandedGroups) {
			const gBase = r * 16;
			const firstPageRef = input.groups[gBase + 8];
			const pageRefCount = input.groups[gBase + 9];
			const missing = [];
			for (let i = 0; i < pageRefCount; i++) {
				const pageId = input.groupPageRefs[firstPageRef + i];
				if (!pageResident(input.pageState, pageId)) missing.push(pageId);
			}
			if (missing.length === 0) continue;
			fallbackGroupCount++;
			const center = [
				u32ToF32(input.groups[gBase]),
				u32ToF32(input.groups[gBase + 1]),
				u32ToF32(input.groups[gBase + 2])
			];
			const p = projectSphere(world, params.cameraPos, params.near, params.orthographicHeight, params.targetHeight, worldScale, pixelScale, center, u32ToF32(input.groups[gBase + 3]), u32ToF32(input.groups[gBase + 4]));
			if (p.errorPx > maximumUnmetErrorPixels) maximumUnmetErrorPixels = p.errorPx;
			const pageShare = meshLoDPageBenefit(p, threshold, params.targetWidth, params.targetHeight, missing.length);
			for (const pageId of missing) demandShare.set(pageId, addMeshLoDPageBenefit(demandShare.get(pageId) ?? 0, pageShare));
		}
	}
	const desiredPages = [];
	for (const [pageId, share] of demandShare) {
		const stored = input.pageStoredBytes[pageId] ?? 1;
		desiredPages.push({
			pageId,
			priority: share / stored
		});
	}
	desiredPages.sort((a, b) => b.priority !== a.priority ? b.priority - a.priority : a.pageId - b.pageId);
	return {
		selected,
		desiredPages,
		visibleGroupCount,
		fallbackGroupCount,
		renderedTriangleCount,
		selectedMeshletCount,
		maximumSelectedErrorPixels,
		maximumUnmetErrorPixels,
		overflow
	};
}
function readArenaU16(arena, byteOffset) {
	return arena[byteOffset >>> 2] >>> (byteOffset & 2) * 8 & 65535;
}
/** MLOD v1 preserves glTF RH/CCW triangles: positive determinants need a corner
*  swap for the shared CCW pipeline in Lite's LH camera convention. */
function meshLoDTriangleIndex(index, handedness) {
	const corner = index % 3;
	return handedness > 0 && corner !== 0 ? index + 3 - 2 * corner : index;
}
/** Run the deterministic GPU expansion model — the exact TS mirror of the WGSL
*  `expandClusters` kernel over the same packed buffers. An oversized cut is not
*  drawable: returning a partial prefix would leave holes. */
function runMeshLoDGpuExpansion(input) {
	const cwo = input.clusterWordOffset ?? 0;
	const cap = input.drawVertexCapacity;
	const draw = new Uint32Array(Math.max(cap, 0) * 4);
	let vertexCount = 0;
	let overflow = false;
	for (const { clusterId, instanceId } of input.selected) {
		const cBase = cwo + clusterId * 16;
		const pageId = input.clusters[cBase + 7];
		const clusterIndexOffset = input.clusters[cBase + 9];
		const indexCount = input.clusters[cBase + 11] * 3;
		const psBase = pageId * 8;
		const arenaVertexWord = input.pageState[psBase + 2] >>> 2;
		const arenaIndexByte = input.pageState[psBase + 3];
		const groupId = input.clusters[cBase + 5];
		const pageFlags = input.pageState[psBase];
		const mode = input.debugMode ?? 0;
		const handedness = input.instances[instanceId * 32 + 23];
		let debug = meshLoDClusterDebugAttr(mode, groupId, input.groups?.[groupId * 16 + 5] ?? 0, meshLoDPageResidencyCode((pageFlags & 2) !== 0, (pageFlags & 4) !== 0 ? "terminal-failed" : pageFlags & 1 ? "gpu-resident" : "unrequested"), input.pageState[psBase + 7] ?? 0);
		if (mode === 6) {
			const packed = input.clusters[cBase + 13];
			const snorm = (shift) => (packed << 24 - shift >> 24) / 127;
			const margin = input.cameraPos && input.coneCull !== false ? meshLoDConeCullMargin(input.instances.subarray(instanceId * 32, instanceId * 32 + 16), input.cameraPos, [
				u32ToF32(input.clusters[cBase]),
				u32ToF32(input.clusters[cBase + 1]),
				u32ToF32(input.clusters[cBase + 2])
			], u32ToF32(input.clusters[cBase + 3]), input.clusters[cBase + 15] ? [
				snorm(0),
				snorm(8),
				snorm(16),
				u32ToF32(input.clusters[cBase + 14])
			] : void 0) : 1;
			debug = meshLoDConeDebugAttr(Number.isFinite(margin) ? margin : 1);
		}
		const base = vertexCount;
		for (let k = 0; k < indexCount; k++) {
			const dst = base + k;
			if (dst >= cap) {
				overflow = true;
				continue;
			}
			const localVertex = readArenaU16(input.arena, arenaIndexByte + (clusterIndexOffset + meshLoDTriangleIndex(k, handedness)) * 2);
			const o = dst * 4;
			draw[o] = arenaVertexWord + localVertex * 6;
			draw[o + 1] = clusterId;
			draw[o + 2] = instanceId;
			draw[o + 3] = debug;
		}
		vertexCount += indexCount;
	}
	return {
		drawVertices: draw,
		vertexCount: overflow ? 0 : vertexCount,
		overflow
	};
}
function checkedStorageSize(engine, byteLength, label) {
	const size = Math.max(byteLength, 4);
	const limits = engine._device.limits;
	const cap = Math.min(limits?.maxStorageBufferBindingSize ?? size, limits?.maxBufferSize ?? size);
	if (size > cap) throw createMeshLoDError("MLOD_DEVICE_LIMIT", `MeshLoD ${label} exceeds the device storage-buffer limit`, {
		expected: cap,
		actual: size
	});
	return size;
}
function checkedStorageBuffer(engine, byteLength, label, extraUsage = 0) {
	return engine._device.createBuffer({
		label,
		size: checkedStorageSize(engine, byteLength, label),
		usage: BU.STORAGE | BU.COPY_DST | extraUsage
	});
}
/** Cheap content-sensitive signature over (generation, per-page residency + arena
*  offset). It changes whenever which pages are resident or where they live changes,
*  so the page-state upload can be skipped when nothing moved — including the
*  evict-A/load-B case where the resident count is unchanged. */
function residencySignature(runtime) {
	let sig = Math.imul(runtime.generation + 1, 2654435761) >>> 0;
	const pages = runtime.gpu.pages;
	for (let i = 0; i < pages.length; i++) {
		const p = pages[i];
		const resident = p.state === "gpu-resident" && p.arenaOffset >= 0;
		const failed = p.state === "terminal-failed" ? 1073741824 : 0;
		sig = (sig ^ ((resident ? p.arenaOffset + 1 : 0) | failed)) >>> 0;
		sig ^= meshLoDPageRequestCode(runtime.pageRecords[i].pinned, p.state) << 28;
		sig = Math.imul(sig ^ i, 2246822519) >>> 0;
	}
	return sig;
}
/** Build (once) and return the shared per-asset GPU buffers, caching them on the
*  runtime. Recreated after a device change so caches auto-invalidate. */
function getMeshLoDGpuAssetBuffers(engine, runtime) {
	const existing = runtime.gpuSelection;
	if (existing && existing.device === engine._device) return existing;
	if (existing) disposeMeshLoDGpuAssetBuffers(existing);
	const nodes = packHierarchyNodes(runtime.hierarchyNodes);
	const groups = packGroups(runtime.groups);
	const clusters = packClusters(runtime.clusters);
	const refs = packGroupPageRefs(runtime.groupPageRefs);
	const pageState = buildPageStateData(runtime.gpu.pages, runtime.pageRecords, runtime.generation);
	const nodeWordOffset = 0;
	const groupWordOffset = nodeWordOffset + nodes.length;
	const clusterWordOffset = groupWordOffset + groups.length;
	const pageRefWordOffset = clusterWordOffset + clusters.length;
	const meta = new Uint32Array(pageRefWordOffset + refs.length);
	meta.set(nodes, nodeWordOffset);
	meta.set(groups, groupWordOffset);
	meta.set(clusters, clusterWordOffset);
	meta.set(refs, pageRefWordOffset);
	const metaBuffer = checkedStorageBuffer(engine, meta.byteLength, "mesh-lod-meta");
	const pageStateBuffer = checkedStorageBuffer(engine, pageState.byteLength, "mesh-lod-page-state");
	const q = engine._device.queue;
	q.writeBuffer(metaBuffer, 0, meta.buffer, meta.byteOffset, meta.byteLength);
	q.writeBuffer(pageStateBuffer, 0, pageState.buffer, pageState.byteOffset, pageState.byteLength);
	const buffers = {
		device: engine._device,
		metaBuffer,
		pageStateBuffer,
		pageStateData: pageState,
		nodeWordOffset,
		groupWordOffset,
		clusterWordOffset,
		pageRefWordOffset,
		nodeCount: runtime.hierarchyNodes.length,
		groupCount: runtime.groups.length,
		clusterCount: runtime.clusters.length,
		pageCount: runtime.gpu.pages.length,
		residencyEpoch: residencySignature(runtime),
		byteLength: meta.byteLength + pageState.byteLength
	};
	runtime.gpuSelection = buffers;
	return buffers;
}
/** Re-derive and re-upload the mutable page-state buffer from current residency.
*  A monotonically bumped `residencyEpoch` skips the upload when nothing changed. */
function syncMeshLoDPageState(engine, buffers, runtime, force = false) {
	const signature = residencySignature(runtime);
	if (!force && buffers.residencyEpoch === signature) return;
	const data = buffers.pageStateData;
	for (let i = 0; i < runtime.gpu.pages.length; i++) writePageStateRecord(data, i * 8, runtime.gpu.pages[i], runtime.pageRecords[i], runtime.generation);
	engine._device.queue.writeBuffer(buffers.pageStateBuffer, 0, data.buffer, data.byteOffset, data.byteLength);
	buffers.residencyEpoch = signature;
}
/** Destroy all buffers owned by a per-asset record. Idempotent-safe. */
function disposeMeshLoDGpuAssetBuffers(buffers) {
	buffers.metaBuffer.destroy();
	buffers.pageStateBuffer.destroy();
}
/** Create empty per-batch instance state for a hierarchy with `groupCount` groups. */
function createMeshLoDGpuInstanceState(groupCount) {
	return {
		groupCount,
		wordsPerInstance: Math.max(Math.ceil(groupCount / 32), 1),
		capacity: 0,
		instanceCount: 0,
		device: null,
		instanceBuffer: null,
		priorStateBuffer: null,
		scratchF32: /* @__PURE__ */ new Float32Array(0),
		scratchU32: /* @__PURE__ */ new Uint32Array(0),
		slotVersion: /* @__PURE__ */ new Int32Array(0),
		slotId: /* @__PURE__ */ new Int32Array(0),
		slotSelectionVersion: /* @__PURE__ */ new Uint32Array(0),
		slotVisible: /* @__PURE__ */ new Uint8Array(0),
		slotThreshold: /* @__PURE__ */ new Float32Array(0)
	};
}
/** Grow (never shrink) the instance and prior-state buffers to hold `count` slots,
*  bounding their shared reservation by the transient unpacked group-state rows too,
*  following make-before-break: allocate the replacements, copy the retained
*  prior-state bits, switch the state to the new buffers, and retire the old ones
*  after the next frame drains. All slot version tracking resets so the next upload
*  fully repopulates the new instance buffer. */
function ensureMeshLoDInstanceCapacity(engine, state, count) {
	const device = engine._device;
	const sameDevice = state.device === device;
	const stride = Math.max(128, state.wordsPerInstance * 4, state.groupCount * 4);
	const maximum = Math.floor(Math.min(device.limits.maxStorageBufferBindingSize, device.limits.maxBufferSize) / stride);
	if (count > maximum) throw createMeshLoDError("MLOD_DEVICE_LIMIT", "MeshLoD instance/prior/group-state records exceed the device storage-buffer limit", {
		expected: maximum * stride,
		actual: count * stride
	});
	if (sameDevice && count <= state.capacity && state.instanceBuffer && state.priorStateBuffer) return;
	let capacity = Math.max(sameDevice ? state.capacity : 0, 1);
	while (capacity < count) capacity = Math.min(capacity * 2, maximum);
	const oldInstance = state.instanceBuffer;
	const oldPrior = state.priorStateBuffer;
	const oldCapacity = sameDevice ? state.capacity : 0;
	const scratchF32 = new Float32Array(capacity * 32);
	const scratchU32 = new Uint32Array(scratchF32.buffer);
	const slotVersion = new Int32Array(capacity).fill(-1);
	const slotId = new Int32Array(capacity).fill(-1);
	const slotSelectionVersion = new Uint32Array(capacity);
	const slotVisible = new Uint8Array(capacity);
	const slotThreshold = new Float32Array(capacity);
	if (sameDevice) {
		slotId.set(state.slotId);
		slotSelectionVersion.set(state.slotSelectionVersion);
	}
	const newInstance = device.createBuffer({
		label: "mesh-lod-instances",
		size: capacity * 128,
		usage: BU.STORAGE | BU.COPY_DST
	});
	let newPrior = null;
	try {
		newPrior = device.createBuffer({
			label: "mesh-lod-prior-state",
			size: capacity * state.wordsPerInstance * 4,
			usage: BU.STORAGE | BU.COPY_DST | BU.COPY_SRC
		});
		if (oldPrior && oldCapacity > 0) engine._currentEncoder.copyBufferToBuffer(oldPrior, 0, newPrior, 0, oldCapacity * state.wordsPerInstance * 4);
	} catch (error) {
		newInstance.destroy();
		newPrior?.destroy();
		throw error;
	}
	state.device = device;
	if (!sameDevice) state.instanceCount = 0;
	state.instanceBuffer = newInstance;
	state.priorStateBuffer = newPrior;
	state.capacity = capacity;
	state.scratchF32 = scratchF32;
	state.scratchU32 = scratchU32;
	state.slotVersion = slotVersion;
	state.slotId = slotId;
	state.slotSelectionVersion = slotSelectionVersion;
	state.slotVisible = slotVisible;
	state.slotThreshold = slotThreshold;
	if (oldInstance || oldPrior) retireGpuResources(engine, () => {
		oldInstance?.destroy();
		oldPrior?.destroy();
	});
}
/** Version-gate and upload changed instance records. Each instance occupies a stable
*  slot equal to its index; a slot is re-packed only when its transform version,
*  stable ID, or visibility changed since the last upload. Contiguous dirty slots are
*  coalesced into one `writeBuffer`. Returns the active instance count. */
function uploadMeshLoDInstances(engine, state, instances) {
	ensureMeshLoDInstanceCapacity(engine, state, Math.max(instances.length, 1));
	if ((state.instanceCount !== instances.length || instances.some((instance, slot) => state.slotId[slot] !== instance._instanceId || state.slotSelectionVersion[slot] !== (instance._selectionVersion ?? 0))) && state.instanceCount > 0) {
		const oldPrior = state.priorStateBuffer;
		const prior = checkedStorageBuffer(engine, state.capacity * state.wordsPerInstance * 4, "mesh-lod-prior-state", BU.COPY_SRC);
		const oldSlots = /* @__PURE__ */ new Map();
		for (let slot = 0; slot < state.instanceCount; slot++) oldSlots.set(state.slotId[slot], slot);
		const rowBytes = state.wordsPerInstance * 4;
		for (let slot = 0; slot < instances.length; slot++) {
			const instance = instances[slot];
			const oldSlot = oldSlots.get(instance._instanceId);
			if (oldSlot !== void 0 && state.slotSelectionVersion[oldSlot] === (instance._selectionVersion ?? 0)) engine._currentEncoder.copyBufferToBuffer(oldPrior, oldSlot * rowBytes, prior, slot * rowBytes, rowBytes);
		}
		state.priorStateBuffer = prior;
		retireGpuResources(engine, () => oldPrior.destroy());
	}
	const f32 = state.scratchF32;
	const u32 = state.scratchU32;
	let runStart = -1;
	const flush = (endExclusive) => {
		if (runStart < 0) return;
		engine._device.queue.writeBuffer(state.instanceBuffer, runStart * 128, f32.buffer, f32.byteOffset + runStart * 128, (endExclusive - runStart) * 128);
		runStart = -1;
	};
	for (let i = 0; i < instances.length; i++) {
		const inst = instances[i];
		const visible = inst.visible ? 1 : 0;
		const threshold = Math.fround(inst.screenSpaceError ?? 0);
		if (state.slotVersion[i] !== inst.worldMatrixVersion || state.slotId[i] !== inst._instanceId || state.slotVisible[i] !== visible || state.slotThreshold[i] !== threshold) {
			packInstanceRecord(f32, u32, i * 32, inst.worldMatrix, inst.visible, inst._instanceId, inst.screenSpaceError);
			state.slotVersion[i] = inst.worldMatrixVersion;
			state.slotId[i] = inst._instanceId;
			state.slotVisible[i] = visible;
			state.slotThreshold[i] = threshold;
			if (runStart < 0) runStart = i;
		} else flush(i);
		state.slotSelectionVersion[i] = inst._selectionVersion ?? 0;
	}
	flush(instances.length);
	state.slotId.fill(-1, instances.length);
	state.instanceCount = instances.length;
	return instances.length;
}
/** Destroy the per-batch instance/prior-state buffers. Idempotent-safe. */
function disposeMeshLoDGpuInstanceState(state) {
	state.instanceBuffer?.destroy();
	state.priorStateBuffer?.destroy();
	state.instanceBuffer = null;
	state.priorStateBuffer = null;
	state.capacity = 0;
	state.instanceCount = 0;
}
/** Params UBO byte size (14 × vec4, architecture §12; allocated at 256 for margin). */
var PARAMS_BYTES = 224;
var PARAMS_ALLOC = 256;
/** control[0] = selected count; control[1..3] = indirect dispatch XYZ. */
var CONTROL_DIAG_OFFSET = 4;
/** First control word of the per-page demand region (one benefit accumulator per page). */
var CONTROL_PAGE_DEMAND_OFFSET = 10;
function meshLoDPageUseOffset(pageCount) {
	return 10 + Math.max(pageCount, 1);
}
function meshLoDPageDemandBitsOffset(pageCount) {
	return meshLoDPageUseOffset(pageCount) + Math.ceil(pageCount / 32);
}
var SELECTION_WORKGROUP = 64;
/** Diagnostics word indices within the control buffer (relative to its base). */
var CONTROL_COUNT_WORD = 0;
var CONTROL_DRAW_VERTEX_WORD = 3;
var CONTROL_VISIBLE_GROUP_WORD = CONTROL_DIAG_OFFSET;
var CONTROL_TRIANGLE_WORD = 5;
var CONTROL_OVERFLOW_WORD = 6;
var CONTROL_FALLBACK_WORD = 7;
var CONTROL_SELECTED_ERROR_WORD = 8;
var CONTROL_UNMET_ERROR_WORD = 9;
/** Decode a copied selection control buffer into streaming demand + diagnostics.
*  A separate bitset records demand presence even when benefit is zero. Each
*  per-page word holds the u32 bit pattern of a nonnegative float32 benefit sum;
*  dividing by the page's stored bytes reproduces the CPU oracle's benefit/cost priority
*  (§11.1). Pure over the control words + a stored-bytes accessor so Node fixtures can
*  compare it against the deterministic selection model. */
function decodeMeshLoDGpuReadback(control, pageCount, storedBytesOf) {
	const demand = [];
	const demandBitsOffset = meshLoDPageDemandBitsOffset(pageCount);
	for (let pageId = 0; pageId < pageCount; pageId++) if (((control[demandBitsOffset + (pageId >>> 5)] ?? 0) & 1 << (pageId & 31)) !== 0) {
		const benefit = u32ToF32(control[10 + pageId] ?? 0);
		const stored = storedBytesOf(pageId) || 1;
		demand.push({
			pageId,
			priority: benefit / stored
		});
	}
	demand.sort((a, b) => b.priority !== a.priority ? b.priority - a.priority : a.pageId - b.pageId);
	return {
		demand,
		selectedClusterCount: control[0] ?? 0,
		renderedTriangleCount: control[5] ?? 0,
		visibleGroupCount: control[4] ?? 0,
		fallbackGroupCount: control[7] ?? 0,
		maximumSelectedErrorPixels: u32ToF32(control[8] ?? 0),
		maximumUnmetErrorPixels: u32ToF32(control[9] ?? 0),
		overflow: (control[6] ?? 0) !== 0
	};
}
var _pipelines = null;
/** Build (once per device) the selection + expansion compute pipelines. The five
*  selection-pass kernels share one explicit bind-group layout (bindings 0-7);
*  expansion uses its own layout (bindings 0,1,2,6,8,9,10 — no `control`, the indirect-
*  dispatch source) so each stage stays within the 8-storage-buffer limit and no buffer
*  is both writable storage and indirect in one synchronization scope. */
function getMeshLoDSelectionPipelines(engine) {
	if (_pipelines && _pipelines.device === engine._device) return _pipelines;
	const device = engine._device;
	const C = 4;
	const buf = (binding, type) => ({
		binding,
		visibility: C,
		buffer: { type }
	});
	const layout = device.createBindGroupLayout({
		label: "mesh-lod-selection",
		entries: [
			buf(0, "uniform"),
			buf(1, "read-only-storage"),
			buf(2, "read-only-storage"),
			buf(3, "read-only-storage"),
			buf(4, "storage"),
			buf(5, "storage"),
			buf(6, "storage"),
			buf(7, "storage")
		]
	});
	const expandLayout = device.createBindGroupLayout({
		label: "mesh-lod-expand",
		entries: [
			buf(0, "uniform"),
			buf(1, "read-only-storage"),
			buf(2, "read-only-storage"),
			buf(3, "read-only-storage"),
			buf(6, "storage"),
			buf(8, "read-only-storage"),
			buf(9, "storage"),
			buf(10, "storage")
		]
	});
	const pipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [layout] });
	const expandPipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [expandLayout] });
	const module = device.createShaderModule({
		label: "mesh-lod-selection",
		code: mesh_lod_selection_default
	});
	const pipe = (pl, entryPoint) => device.createComputePipeline({
		label: `mesh-lod-${entryPoint}`,
		layout: pl,
		compute: {
			module,
			entryPoint
		}
	});
	_pipelines = {
		device,
		layout,
		pipelineLayout,
		module,
		traverse: pipe(pipelineLayout, "traverse"),
		evaluate: pipe(pipelineLayout, "evaluateGroups"),
		select: pipe(pipelineLayout, "selectClusters"),
		demand: pipe(pipelineLayout, "computeDemand"),
		clamp: pipe(pipelineLayout, "clampSelectedCount"),
		expandLayout,
		expand: pipe(expandPipelineLayout, "expandClusters"),
		finalize: pipe(expandPipelineLayout, "finalizeDraw")
	};
	return _pipelines;
}
/** Create empty per-batch transient selection state. */
function createMeshLoDGpuBatchState() {
	const paramsBytes = /* @__PURE__ */ new ArrayBuffer(PARAMS_ALLOC);
	return {
		device: null,
		groupStateBuffer: null,
		selectedBuffer: null,
		controlBuffer: null,
		paramsBuffer: null,
		bindGroup: null,
		instanceCapacity: 0,
		selectedCapacity: 0,
		controlWords: 0,
		groupCount: 0,
		clusterCount: 0,
		nodeCount: 0,
		pageCount: 0,
		paramsBytes,
		paramsF32: new Float32Array(paramsBytes),
		paramsU32: new Uint32Array(paramsBytes),
		boundMeta: null,
		boundPageState: null,
		boundInstances: null,
		boundPrior: null,
		drawVertexBuffer: null,
		drawArgsBuffer: null,
		expandBindGroup: null,
		drawVertexCapacity: 0,
		boundArena: null,
		readbackSlots: [],
		residentDrawVertexBound: 0,
		residentDrawEpoch: -1,
		pendingError: null
	};
}
/** Size transient selection buffers for allocated instance slots and the draw buffer
*  for a total batch vertex capacity. Growth retires old buffers after the frame drains. */
function ensureMeshLoDBatchBuffers(engine, state, instanceCapacity, drawVertexCapacity, assetBuffers) {
	const device = engine._device;
	const capacity = Math.max(state.device === device ? state.instanceCapacity : 0, instanceCapacity, 1);
	const storageLimit = Math.min(device.limits.maxStorageBufferBindingSize, device.limits.maxBufferSize);
	const selectedCapacity = Math.max(1, Math.min(assetBuffers.clusterCount * capacity, Math.floor((storageLimit - 4) / 8)));
	checkedStorageSize(engine, Math.max(capacity * assetBuffers.groupCount, 1) * 4, "mesh-lod-group-state");
	checkedStorageSize(engine, (selectedCapacity * 2 + 1) * 4, "mesh-lod-selected");
	checkedStorageSize(engine, drawVertexCapacity * 16, "mesh-lod-draw-vertices");
	if (state.device !== device) {
		state.groupStateBuffer = state.selectedBuffer = state.controlBuffer = state.paramsBuffer = null;
		state.drawVertexBuffer = state.drawArgsBuffer = null;
		state.bindGroup = state.expandBindGroup = null;
		state.instanceCapacity = 0;
		state.drawVertexCapacity = 0;
		for (const slot of state.readbackSlots) slot.buffer.destroy();
		state.readbackSlots = [];
		state.residentDrawVertexBound = 0;
		state.residentDrawEpoch = -1;
		state.pendingError = null;
		state.device = device;
	}
	state.groupCount = assetBuffers.groupCount;
	state.clusterCount = assetBuffers.clusterCount;
	state.nodeCount = assetBuffers.nodeCount;
	state.pageCount = assetBuffers.pageCount;
	const controlWords = meshLoDPageDemandBitsOffset(assetBuffers.pageCount) + Math.ceil(assetBuffers.pageCount / 32);
	if (!state.controlBuffer) {
		state.controlBuffer = device.createBuffer({
			label: "mesh-lod-control",
			size: controlWords * 4,
			usage: BU.STORAGE | BU.INDIRECT | BU.COPY_DST | BU.COPY_SRC
		});
		state.controlWords = controlWords;
		state.bindGroup = null;
	}
	if (!state.drawArgsBuffer) {
		state.drawArgsBuffer = device.createBuffer({
			label: "mesh-lod-draw-args",
			size: 20,
			usage: BU.INDIRECT | BU.STORAGE | BU.COPY_DST
		});
		device.queue.writeBuffer(state.drawArgsBuffer, 8, Uint32Array.from([
			0,
			0,
			0
		]).buffer);
		state.expandBindGroup = null;
	}
	if (!state.paramsBuffer) {
		state.paramsBuffer = device.createBuffer({
			label: "mesh-lod-params",
			size: PARAMS_ALLOC,
			usage: BU.UNIFORM | BU.COPY_DST
		});
		state.bindGroup = state.expandBindGroup = null;
	}
	const growInstances = instanceCapacity > state.instanceCapacity || !state.groupStateBuffer || !state.selectedBuffer;
	const growDraw = drawVertexCapacity > state.drawVertexCapacity || !state.drawVertexBuffer;
	if (!growInstances && !growDraw) return;
	const oldGroupState = state.groupStateBuffer;
	const oldSelected = state.selectedBuffer;
	const oldDrawVertex = state.drawVertexBuffer;
	let groupState = null;
	let selected = null;
	let drawVertex = null;
	try {
		if (growInstances) {
			groupState = checkedStorageBuffer(engine, Math.max(capacity * assetBuffers.groupCount, 1) * 4, "mesh-lod-group-state");
			selected = checkedStorageBuffer(engine, (selectedCapacity * 2 + 1) * 4, "mesh-lod-selected");
		}
		if (growDraw) drawVertex = checkedStorageBuffer(engine, drawVertexCapacity * 16, "mesh-lod-draw-vertices");
	} catch (error) {
		groupState?.destroy();
		selected?.destroy();
		drawVertex?.destroy();
		throw error;
	}
	if (growInstances) {
		state.groupStateBuffer = groupState;
		state.selectedBuffer = selected;
		state.instanceCapacity = capacity;
		state.selectedCapacity = selectedCapacity;
		state.bindGroup = null;
		state.expandBindGroup = null;
	}
	if (growDraw) {
		state.drawVertexBuffer = drawVertex;
		state.drawVertexCapacity = drawVertexCapacity;
		state.expandBindGroup = null;
	}
	if (oldGroupState || oldSelected || oldDrawVertex) retireGpuResources(engine, () => {
		if (growInstances) {
			oldGroupState?.destroy();
			oldSelected?.destroy();
		}
		if (growDraw) oldDrawVertex?.destroy();
	});
}
function ensureMeshLoDBindGroup(engine, state, pipelines, assetBuffers, instanceState, arena) {
	const instances = instanceState.instanceBuffer;
	const prior = instanceState.priorStateBuffer;
	if (state.bindGroup && state.expandBindGroup && state.boundMeta === assetBuffers.metaBuffer && state.boundPageState === assetBuffers.pageStateBuffer && state.boundInstances === instances && state.boundPrior === prior && state.boundArena === arena) return;
	state.bindGroup = engine._device.createBindGroup({
		label: "mesh-lod-selection",
		layout: pipelines.layout,
		entries: [
			{
				binding: 0,
				resource: { buffer: state.paramsBuffer }
			},
			{
				binding: 1,
				resource: { buffer: assetBuffers.metaBuffer }
			},
			{
				binding: 2,
				resource: { buffer: assetBuffers.pageStateBuffer }
			},
			{
				binding: 3,
				resource: { buffer: instances }
			},
			{
				binding: 4,
				resource: { buffer: prior }
			},
			{
				binding: 5,
				resource: { buffer: state.groupStateBuffer }
			},
			{
				binding: 6,
				resource: { buffer: state.selectedBuffer }
			},
			{
				binding: 7,
				resource: { buffer: state.controlBuffer }
			}
		]
	});
	state.expandBindGroup = engine._device.createBindGroup({
		label: "mesh-lod-expand",
		layout: pipelines.expandLayout,
		entries: [
			{
				binding: 0,
				resource: { buffer: state.paramsBuffer }
			},
			{
				binding: 1,
				resource: { buffer: assetBuffers.metaBuffer }
			},
			{
				binding: 2,
				resource: { buffer: assetBuffers.pageStateBuffer }
			},
			{
				binding: 3,
				resource: { buffer: instances }
			},
			{
				binding: 6,
				resource: { buffer: state.selectedBuffer }
			},
			{
				binding: 8,
				resource: { buffer: arena }
			},
			{
				binding: 9,
				resource: { buffer: state.drawVertexBuffer }
			},
			{
				binding: 10,
				resource: { buffer: state.drawArgsBuffer }
			}
		]
	});
	state.boundMeta = assetBuffers.metaBuffer;
	state.boundPageState = assetBuffers.pageStateBuffer;
	state.boundInstances = instances;
	state.boundPrior = prior;
	state.boundArena = arena;
}
/** Destroy the per-batch transient selection buffers. Idempotent-safe. */
function disposeMeshLoDGpuBatchState(state) {
	state.groupStateBuffer?.destroy();
	state.selectedBuffer?.destroy();
	state.controlBuffer?.destroy();
	state.paramsBuffer?.destroy();
	state.drawVertexBuffer?.destroy();
	state.drawArgsBuffer?.destroy();
	for (const slot of state.readbackSlots) slot.buffer.destroy();
	state.readbackSlots = [];
	state.residentDrawVertexBound = 0;
	state.residentDrawEpoch = -1;
	state.pendingError = null;
	state.groupStateBuffer = state.selectedBuffer = state.controlBuffer = state.paramsBuffer = null;
	state.drawVertexBuffer = state.drawArgsBuffer = null;
	state.bindGroup = state.expandBindGroup = null;
	state.instanceCapacity = 0;
	state.drawVertexCapacity = 0;
}
var READBACK_RING = 3;
/** Reserve a free MAP_READ staging slot from the batch's small ring (growing it up to
*  {@link READBACK_RING}); returns `null` when every slot still has a map in flight, so
*  the frame skips the readback rather than stall. */
function acquireMeshLoDReadbackSlot(engine, state, bytes) {
	for (const slot of state.readbackSlots) if (!slot.busy) {
		if (slot.buffer.size < bytes) {
			slot.buffer.destroy();
			slot.buffer = engine._device.createBuffer({
				label: "mesh-lod-readback",
				size: bytes,
				usage: BU.MAP_READ | BU.COPY_DST
			});
		}
		slot.busy = true;
		return slot;
	}
	if (state.readbackSlots.length >= READBACK_RING) return null;
	const slot = {
		buffer: engine._device.createBuffer({
			label: "mesh-lod-readback",
			size: bytes,
			usage: BU.MAP_READ | BU.COPY_DST
		}),
		busy: true
	};
	state.readbackSlots.push(slot);
	return slot;
}
/** Map the staging copy only after the owning frame has actually submitted. */
async function pumpMeshLoDReadback(job) {
	const { slot } = job;
	try {
		await slot.buffer.mapAsync(GPUMapMode.READ, 0, job.bytes);
		try {
			job.apply(new Uint32Array(slot.buffer.getMappedRange(0, job.bytes)));
		} finally {
			slot.buffer.unmap();
		}
	} catch {} finally {
		slot.busy = false;
	}
}
/** Apply one frame's async GPU selection readback: decode per-page demand + diagnostics
*  from the control buffer and drive the shared streaming engine (demand + resident
*  frame references + diagnostics). A selected cut that cannot fit the device is
*  reported on the next synchronous update. A stale readback (disposed asset, or a
*  generation bump from disposal/device recovery) is dropped. Exported as the internal
*  test seam that stands in for the real mapAsync resolution. */
function applyMeshLoDGpuReadback(runtime, state, control, pageCount, generation, sourceFrame = runtime.frameIndex, selectionEpoch = runtime._selectionEpoch) {
	const snapshot = runtime._frameSnapshots.get(state);
	if (runtime.disposed || runtime.generation !== generation || state.device !== runtime.engine._device || runtime.selectionMode !== "gpu" || selectionEpoch !== runtime._selectionEpoch || snapshot?.mode !== "gpu" || sourceFrame > snapshot.frame || sourceFrame < snapshot.lastReadbackFrame) return;
	const records = runtime.pageRecords;
	const decoded = decodeMeshLoDGpuReadback(control, pageCount, (pageId) => records[pageId]?.storedBytes ?? 1);
	if (decoded.overflow) {
		state.pendingError ??= createMeshLoDError("MLOD_DEVICE_LIMIT", "MeshLoD selected cut exceeds the GPU batch capacity", { expected: state.drawVertexCapacity });
		return;
	}
	const used = /* @__PURE__ */ new Set();
	const useOffset = meshLoDPageUseOffset(pageCount);
	for (let pageId = 0; pageId < pageCount; pageId++) if (((control[useOffset + (pageId >>> 5)] ?? 0) & 1 << (pageId & 31)) !== 0) used.add(pageId);
	const stats = {
		visibleGroupCount: decoded.visibleGroupCount,
		fallbackGroupCount: decoded.fallbackGroupCount,
		maximumSelectedErrorPixels: decoded.maximumSelectedErrorPixels,
		maximumUnmetErrorPixels: decoded.maximumUnmetErrorPixels
	};
	if (publishMeshLoDGpuReadback(runtime, state, sourceFrame, decoded.demand, stats, [...used])) {
		const diag = runtime.diagnostics;
		diag.renderedTriangleCount = decoded.renderedTriangleCount;
		diag.selectedMeshletCount = decoded.selectedClusterCount;
	}
}
function writeSelectionParams(state, assetBuffers, instanceCount, wordsPerInstance, frame) {
	const f = state.paramsF32;
	const u = state.paramsU32;
	const planes = frame.frustumCull ? extractFrustumPlanes(frame.viewProjection) : [];
	for (let i = 0; i < 6; i++) {
		const p = planes[i] ?? [
			0,
			0,
			0,
			1
		];
		f[i * 4] = p[0];
		f[i * 4 + 1] = p[1];
		f[i * 4 + 2] = p[2];
		f[i * 4 + 3] = p[3];
	}
	f[24] = frame.cameraPos[0];
	f[25] = frame.cameraPos[1];
	f[26] = frame.cameraPos[2];
	f[27] = frame.near;
	f[28] = frame.targetWidth;
	f[29] = frame.targetHeight;
	f[30] = frame.perspectivePixelScale ?? perspectivePixelScale(frame.targetHeight, frame.verticalFov);
	f[31] = frame.orthographicHeight ?? 0;
	f[32] = frame.screenSpaceError;
	f[33] = Math.fround(1 + frame.lodHysteresis);
	f[34] = Math.fround(1 - frame.lodHysteresis);
	f[35] = planes.length;
	u[36] = instanceCount;
	u[37] = assetBuffers.groupCount;
	u[38] = assetBuffers.clusterCount;
	u[39] = assetBuffers.nodeCount;
	u[40] = wordsPerInstance;
	u[41] = state.selectedCapacity;
	u[42] = assetBuffers.pageCount;
	u[43] = frame.levelCount;
	u[44] = assetBuffers.nodeWordOffset;
	u[45] = assetBuffers.groupWordOffset;
	u[46] = assetBuffers.clusterWordOffset;
	u[47] = assetBuffers.pageRefWordOffset;
	u[48] = CONTROL_DIAG_OFFSET;
	u[49] = 10;
	u[50] = state.drawVertexCapacity;
	u[51] = frame.coneCull !== false ? 1 : 0;
	u[52] = frame.debugMode ?? 0;
	u[53] = state.device.limits.maxComputeWorkgroupsPerDimension;
	u[54] = meshLoDPageUseOffset(assetBuffers.pageCount);
	u[55] = meshLoDPageDemandBitsOffset(assetBuffers.pageCount);
}
/** Bounded XYZ dispatch without dropping invocations. Padded workgroups are guarded in WGSL. */
function meshLoDDispatchSize(count, limit) {
	if (!Number.isSafeInteger(count) || count < 0 || !Number.isInteger(limit) || limit < 1 || count > limit ** 3) throw createMeshLoDError("MLOD_DEVICE_LIMIT", "MeshLoD compute dispatch exceeds device dimensions", {
		expected: limit ** 3,
		actual: count
	});
	const x = Math.min(count, limit);
	const rows = Math.ceil(count / Math.max(x, 1));
	const y = Math.max(Math.min(rows, limit), 1);
	return [
		x,
		y,
		Math.max(Math.ceil(rows / y), 1)
	];
}
function replaySteps(pass, steps) {
	let lastPipeline = null;
	for (const step of steps) {
		if (step.pipeline !== lastPipeline) {
			pass.setPipeline(step.pipeline);
			lastPipeline = step.pipeline;
		}
		pass.setBindGroup(0, step.bindGroup);
		if (step.indirectBuffer) pass.dispatchWorkgroupsIndirect(step.indirectBuffer, step.indirectOffset ?? 0);
		else pass.dispatchWorkgroups(...step.workgroups ?? [
			0,
			1,
			1
		]);
	}
}
var _updateBatches = null;
/** Return the task-local MeshLoD update batch for one render-target signature. */
function getMeshLoDUpdateBatch(signature) {
	enableDrawBatchCollection(signature);
	_updateBatches ??= /* @__PURE__ */ new WeakMap();
	const existing = _updateBatches.get(signature);
	if (existing && !existing._retired) return existing;
	const jobs = [];
	const disposers = /* @__PURE__ */ new Set();
	let count = 0;
	const batch = {
		_retired: false,
		reset() {
			for (let i = 0; i < count; i++) {
				const readback = jobs[i].readback;
				if (readback && !readback.copied) readback.cancel?.();
			}
			jobs.length = 0;
			count = 0;
		},
		flush(engine) {
			if (count === 0) return;
			const encoder = engine._currentEncoder;
			for (let i = 0; i < count; i++) for (const clear of jobs[i].clears) encoder.clearBuffer(clear.buffer, clear.offset, clear.size);
			const selectionPass = encoder.beginComputePass();
			for (let i = 0; i < count; i++) replaySteps(selectionPass, jobs[i].pass1Steps);
			selectionPass.end();
			const expandPass = encoder.beginComputePass();
			for (let i = 0; i < count; i++) replaySteps(expandPass, jobs[i].pass2Steps);
			expandPass.end();
			for (let i = 0; i < count; i++) {
				const rb = jobs[i].readback;
				if (rb) {
					encoder.copyBufferToBuffer(rb.control, 0, rb.slot.buffer, 0, rb.bytes);
					rb.copied = true;
				}
			}
			jobs.length = 0;
			count = 0;
		},
		destroy() {
			batch.reset();
			batch._retired = true;
			if (_updateBatches?.get(signature) === batch) _updateBatches.delete(signature);
			runGpuResourceCallbacks([...disposers]);
			disposers.clear();
		},
		addDisposer(dispose) {
			disposers.add(dispose);
			return () => disposers.delete(dispose);
		},
		queue(job) {
			jobs[count++] = job;
		}
	};
	_updateBatches.set(signature, batch);
	return batch;
}
/** Prepare and queue one batch's GPU selection + expansion into the shared compute
*  pass: sync page state, version-gate instance uploads, size transient buffers, write
*  params, reset transient counters, and append traverse→evaluate→select→demand then
*  the indirect expandClusters + finalizeDraw. Returns the buffers the indirect draw
*  consumes, or `null` for an empty batch. */
function queueMeshLoDGpuSelection(engine, updateBatch, runtime, instanceState, batchState, instances, frame) {
	if (batchState.pendingError && batchState.device === engine._device) throw batchState.pendingError;
	if (instances.length === 0) {
		uploadMeshLoDInstances(engine, instanceState, instances);
		return null;
	}
	const pipelines = getMeshLoDSelectionPipelines(engine);
	const assetBuffers = getMeshLoDGpuAssetBuffers(engine, runtime);
	const sourceFrame = queueMeshLoDFrame(runtime, batchState, "gpu", null);
	const advertised = runtime.gpu.pages.filter((page) => page.state === "gpu-resident").map((page) => page.id);
	holdMeshLoDPages(runtime, advertised, sourceFrame, false);
	const instanceCount = uploadMeshLoDInstances(engine, instanceState, instances);
	syncMeshLoDPageState(engine, assetBuffers, runtime);
	if (batchState.device !== engine._device || batchState.residentDrawEpoch !== assetBuffers.residencyEpoch) {
		let residentVertices = 0;
		for (const cluster of runtime.clusters) {
			const page = runtime.gpu.pages[cluster.pageId];
			if (page?.state === "gpu-resident" && page.arenaOffset >= 0) residentVertices += cluster.triangleCount * 3;
		}
		batchState.residentDrawVertexBound = residentVertices;
		batchState.residentDrawEpoch = assetBuffers.residencyEpoch;
	}
	const visibleCount = instances.reduce((count, instance) => count + (instance.visible ? 1 : 0), 0);
	const limits = engine._device.limits;
	const maxVertices = Math.min(Math.floor(Math.min(limits.maxStorageBufferBindingSize, limits.maxBufferSize) / 48) * 3, 1073741823);
	const drawVertexCapacity = Math.max(3, Math.min(batchState.residentDrawVertexBound * visibleCount, maxVertices));
	ensureMeshLoDBatchBuffers(engine, batchState, instanceState.capacity, drawVertexCapacity, assetBuffers);
	meshLoDDispatchSize(batchState.selectedCapacity, limits.maxComputeWorkgroupsPerDimension);
	ensureMeshLoDBindGroup(engine, batchState, pipelines, assetBuffers, instanceState, runtime.gpu.arena.buffer);
	writeSelectionParams(batchState, assetBuffers, instanceCount, instanceState.wordsPerInstance, frame);
	engine._device.queue.writeBuffer(batchState.paramsBuffer, 0, batchState.paramsBytes, 0, PARAMS_BYTES);
	const bindGroup = batchState.bindGroup;
	const expandBindGroup = batchState.expandBindGroup;
	const groupInvocations = Math.ceil(batchState.groupCount * instanceCount / SELECTION_WORKGROUP);
	const nodeInvocations = Math.ceil(batchState.nodeCount * instanceCount / SELECTION_WORKGROUP);
	const clusterInvocations = Math.ceil(batchState.clusterCount * instanceCount / SELECTION_WORKGROUP);
	const nodeWorkgroups = meshLoDDispatchSize(nodeInvocations, limits.maxComputeWorkgroupsPerDimension);
	const groupWorkgroups = meshLoDDispatchSize(groupInvocations, limits.maxComputeWorkgroupsPerDimension);
	const clusterWorkgroups = meshLoDDispatchSize(clusterInvocations, limits.maxComputeWorkgroupsPerDimension);
	const readbackBytes = batchState.controlWords * 4;
	const readbackSlot = acquireMeshLoDReadbackSlot(engine, batchState, readbackBytes);
	const generation = runtime.generation;
	const selectionEpoch = runtime._selectionEpoch;
	const pageCount = assetBuffers.pageCount;
	const readback = readbackSlot ? {
		control: batchState.controlBuffer,
		slot: readbackSlot,
		bytes: readbackBytes,
		copied: false,
		apply: (control) => applyMeshLoDGpuReadback(runtime, batchState, control, pageCount, generation, sourceFrame, selectionEpoch)
	} : void 0;
	const job = {
		clears: [
			{
				buffer: batchState.controlBuffer,
				offset: 0,
				size: 4
			},
			{
				buffer: batchState.controlBuffer,
				offset: 16,
				size: (batchState.controlWords - CONTROL_DIAG_OFFSET) * 4
			},
			{
				buffer: batchState.groupStateBuffer,
				offset: 0,
				size: Math.max(batchState.groupCount * instanceCount, 1) * 4
			},
			{
				buffer: batchState.drawArgsBuffer,
				offset: 0,
				size: 4
			},
			{
				buffer: batchState.drawArgsBuffer,
				offset: 16,
				size: 4
			}
		],
		pass1Steps: [
			{
				pipeline: pipelines.traverse,
				bindGroup,
				workgroups: nodeWorkgroups
			},
			{
				pipeline: pipelines.evaluate,
				bindGroup,
				workgroups: groupWorkgroups
			},
			{
				pipeline: pipelines.select,
				bindGroup,
				workgroups: clusterWorkgroups
			},
			{
				pipeline: pipelines.demand,
				bindGroup,
				workgroups: groupWorkgroups
			},
			{
				pipeline: pipelines.clamp,
				bindGroup,
				workgroups: [
					1,
					1,
					1
				]
			}
		],
		pass2Steps: [{
			pipeline: pipelines.expand,
			bindGroup: expandBindGroup,
			indirectBuffer: batchState.controlBuffer,
			indirectOffset: 4
		}, {
			pipeline: pipelines.finalize,
			bindGroup: expandBindGroup,
			workgroups: [
				1,
				1,
				1
			]
		}],
		readback
	};
	if (readback) {
		const release = () => {
			readback.slot.busy = false;
		};
		const unregister = addFramePostSubmitHook(engine, "frame", () => {
			if (readback.copied) pumpMeshLoDReadback(readback);
			else release();
		}, release);
		readback.cancel = () => {
			unregister();
			release();
		};
	}
	updateBatch.queue(job);
	return {
		controlBuffer: batchState.controlBuffer,
		selectedBuffer: batchState.selectedBuffer,
		drawVertexBuffer: batchState.drawVertexBuffer,
		drawArgsBuffer: batchState.drawArgsBuffer,
		instanceBuffer: instanceState.instanceBuffer,
		selectedCapacity: batchState.selectedCapacity,
		instanceCount
	};
}
export { getMeshLoDGpuAssetBuffers as A, packHierarchyNodes as B, createMeshLoDGpuBatchState as C, disposeMeshLoDGpuBatchState as D, disposeMeshLoDGpuAssetBuffers as E, meshLoDPageUseOffset as F, syncMeshLoDPageState as G, queueMeshLoDGpuSelection as H, meshLoDTriangleIndex as I, uploadMeshLoDInstances as K, packClusters as L, getMeshLoDUpdateBatch as M, meshLoDDispatchSize as N, disposeMeshLoDGpuInstanceState as O, meshLoDPageDemandBitsOffset as P, packGroupPageRefs as R, buildPageStateData as S, decodeMeshLoDGpuReadback as T, runMeshLoDGpuExpansion as U, packInstanceRecord as V, runMeshLoDGpuSelection as W, PAGE_FLAG_RESIDENT as _, CONTROL_OVERFLOW_WORD as a, VERTEX_WORDS as b, CONTROL_TRIANGLE_WORD as c, GROUP_WORDS as d, INSTANCE_BYTES as f, PAGE_FLAG_PINNED as g, PAGE_FLAG_FAILED as h, CONTROL_FALLBACK_WORD as i, getMeshLoDSelectionPipelines as j, ensureMeshLoDInstanceCapacity as k, CONTROL_UNMET_ERROR_WORD as l, NODE_WORDS as m, CONTROL_COUNT_WORD as n, CONTROL_PAGE_DEMAND_OFFSET as o, INSTANCE_WORDS as p, writePageStateRecord as q, CONTROL_DRAW_VERTEX_WORD as r, CONTROL_SELECTED_ERROR_WORD as s, CLUSTER_WORDS as t, CONTROL_VISIBLE_GROUP_WORD as u, PAGE_FLAG_UPLOADING as v, createMeshLoDGpuInstanceState as w, applyMeshLoDGpuReadback as x, PAGE_STATE_WORDS as y, packGroups as z };

//# sourceMappingURL=mesh-lod-selection-gpu-gfLqNUNL.js.map