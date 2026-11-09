import { invertMat4 } from "../math/invert-mat4.js";
import { createTransformNode } from "../scene/transform-node.js";
import { PhysicsMotionType, PhysicsShapeType, createPhysicsBody, createPhysicsShape, removePhysicsBody, setPhysicsBodyPreStep, setPhysicsBodyShape, worldStepSeconds } from "./havok.js";
import { setPhysicsBodyMassProperties } from "./havok-body-mass-properties.js";
// src/physics/character-controller.ts
/** Contact state of the character against the geometry beneath it. */
var CharacterSupportedState = {
	/** No surface within reach. */
	UNSUPPORTED: 0,
	/** Touching a surface too steep to stand on; the character slides. */
	SLIDING: 1,
	/** Standing on a walkable surface. */
	SUPPORTED: 2
};
/**
* Minimal single-event observable used by {@link PhysicsCharacterController} for collision
* callbacks. Kept local to the physics module (no dependency on gizmo/observable code) so the
* character-controller graph stays self-contained and tree-shakeable.
*/
var CharacterCollisionObservable = class {
	_subs = [];
	/**
	* Subscribe to collision events.
	* @param cb - Callback invoked for each dynamic-body contact during a step.
	* @returns A disposer that removes the subscription when called.
	*/
	add(cb) {
		this._subs.push(cb);
		return () => {
			const i = this._subs.indexOf(cb);
			if (i >= 0) this._subs.splice(i, 1);
		};
	}
	/**
	* Notify all subscribers of a collision event.
	* @param event - The collision event payload.
	*/
	notify(event) {
		for (const s of this._subs) s(event);
	}
};
function v(x = 0, y = 0, z = 0) {
	return {
		x,
		y,
		z
	};
}
function vclone(a) {
	return {
		x: a.x,
		y: a.y,
		z: a.z
	};
}
function vcopy(d, s) {
	d.x = s.x;
	d.y = s.y;
	d.z = s.z;
}
function vset(d, x, y, z) {
	d.x = x;
	d.y = y;
	d.z = z;
}
function vadd(a, b) {
	return {
		x: a.x + b.x,
		y: a.y + b.y,
		z: a.z + b.z
	};
}
function vsub(a, b) {
	return {
		x: a.x - b.x,
		y: a.y - b.y,
		z: a.z - b.z
	};
}
function vscale(a, s) {
	return {
		x: a.x * s,
		y: a.y * s,
		z: a.z * s
	};
}
function vaddIn(d, a) {
	d.x += a.x;
	d.y += a.y;
	d.z += a.z;
}
function vsubIn(d, a) {
	d.x -= a.x;
	d.y -= a.y;
	d.z -= a.z;
}
function vscaleIn(d, s) {
	d.x *= s;
	d.y *= s;
	d.z *= s;
}
function vdot(a, b) {
	return a.x * b.x + a.y * b.y + a.z * b.z;
}
function vcross(a, b) {
	return {
		x: a.y * b.z - a.z * b.y,
		y: a.z * b.x - a.x * b.z,
		z: a.x * b.y - a.y * b.x
	};
}
function vlenSq(a) {
	return a.x * a.x + a.y * a.y + a.z * a.z;
}
function vlen(a) {
	return Math.sqrt(vlenSq(a));
}
function vnormIn(a) {
	const l = vlen(a);
	if (l > 1e-12) {
		const inv = 1 / l;
		a.x *= inv;
		a.y *= inv;
		a.z *= inv;
	}
}
function vequalsEps(a, b, eps) {
	return Math.abs(a.x - b.x) <= eps && Math.abs(a.y - b.y) <= eps && Math.abs(a.z - b.z) <= eps;
}
function clamp(value, lo, hi) {
	return Math.min(Math.max(value, lo), hi);
}
/** Transform a position by a column-major 4×4 matrix (with translation). */
function transformCoord(m, p) {
	return {
		x: p.x * m[0] + p.y * m[4] + p.z * m[8] + m[12],
		y: p.x * m[1] + p.y * m[5] + p.z * m[9] + m[13],
		z: p.x * m[2] + p.y * m[6] + p.z * m[10] + m[14]
	};
}
/**
* A physics-driven character controller. Create one with
* {@link createPhysicsCharacterController}; drive it each physics step with
* {@link PhysicsCharacterController.moveWithCollisions} and read back the resolved position
* with {@link PhysicsCharacterController.getPosition}.
*/
var PhysicsCharacterController = class {
	/** Minimum separation kept from surfaces, in metres. Default `0.05`. */
	keepDistance = .05;
	/** Extra distance over which a contact is still tracked. Default `0.1`. */
	keepContactTolerance = .1;
	/** Maximum number of cast iterations per integration step. Default `10`. */
	maxCastIterations = 10;
	/** Speed at which penetrations are pushed out. Default `1.0`. */
	penetrationRecoverySpeed = 1;
	/** Static-friction coefficient against surfaces. Default `0`. */
	staticFriction = 0;
	/** Dynamic-friction coefficient against surfaces. Default `1`. */
	dynamicFriction = 1;
	/** Cosine of the steepest slope the character can stand on. Default `0.5` (60°). */
	maxSlopeCosine = .5;
	/** Upper bound on per-solve character speed. Default `10`. */
	maxCharacterSpeedForSolver = 10;
	/** World up vector. Default `(0, 1, 0)`. */
	up = {
		x: 0,
		y: 1,
		z: 0
	};
	/** Push strength applied to dynamic bodies the character contacts. Default `1e38`. */
	characterStrength = 1e38;
	/** Acceleration factor used by {@link calculateMovement}. Default `0.05`. */
	acceleration = .05;
	/** Maximum world-space acceleration used by {@link calculateMovement}. Default `50`. */
	maxAcceleration = 50;
	/** Character mass used when reacting to gravity against dynamic bodies. Default `0`. */
	characterMass = 0;
	/**
	* Fires once per dynamic body the character pushes during a step, just before the reactive
	* impulse is applied. Mirrors Babylon.js' `onTriggerCollisionObservable`. Subscribe with
	* `.add(cb)`; the returned disposer removes the subscription.
	*/
	onTriggerCollisionObservable = new CharacterCollisionObservable();
	_world;
	_shape;
	_shapeOptions;
	_node;
	_body;
	_startCollector;
	_castCollector;
	_position;
	_velocity = v();
	_lastVelocity = v();
	_lastDisplacement = v();
	_orientation = {
		x: 0,
		y: 0,
		z: 0,
		w: 1
	};
	_manifold = [];
	_lastInvDeltaTime = 60;
	_frameId = 0;
	_contactAngleSensitivity = 10;
	_displacementEps = 1e-4;
	_bodyTracking = /* @__PURE__ */ new WeakMap();
	/** Construct a controller. Prefer the {@link createPhysicsCharacterController} factory. */
	constructor(world, position, options) {
		this._world = world;
		this._position = vclone(position);
		const r = options.capsuleRadius ?? .6;
		const h = options.capsuleHeight ?? 1.8;
		this._shapeOptions = options;
		this._shape = createPhysicsShape(world, {
			type: PhysicsShapeType.CAPSULE,
			parameters: {
				pointA: {
					x: 0,
					y: h * .5 - r,
					z: 0
				},
				pointB: {
					x: 0,
					y: -h * .5 + r,
					z: 0
				},
				radius: r
			}
		});
		this._node = createTransformNode("CCTransformNode", position.x, position.y, position.z);
		this._body = createPhysicsBody(world, this._node, PhysicsMotionType.ANIMATED);
		setPhysicsBodyShape(world, this._body, this._shape);
		setPhysicsBodyMassProperties(world, this._body, { inertia: {
			x: 0,
			y: 0,
			z: 0
		} });
		setPhysicsBodyPreStep(this._body, true);
		const hknp = world._hknp;
		this._startCollector = hknp.HP_QueryCollector_Create(16)[1];
		this._castCollector = hknp.HP_QueryCollector_Create(16)[1];
	}
	/** Release the controller's body, shape, and query collectors. */
	dispose() {
		const hknp = this._world._hknp;
		removePhysicsBody(this._world, this._body);
		hknp.HP_Shape_Release(this._shape._hkShape);
		hknp.HP_QueryCollector_Release(this._startCollector);
		hknp.HP_QueryCollector_Release(this._castCollector);
		this._bodyTracking = /* @__PURE__ */ new WeakMap();
		this._manifold.length = 0;
	}
	/** Get the current character position (world space). The returned vector is owned by the controller. */
	getPosition() {
		return this._position;
	}
	/** Get the Havok body backing this character controller. */
	getBody() {
		return this._body;
	}
	/** Teleport the character to a new position, clearing any swept motion. */
	setPosition(position) {
		vcopy(this._position, position);
		this._node.position.set(position.x, position.y, position.z);
	}
	/**
	* The shape options used to build the collision capsule. Reflects the values passed at
	* construction or the last call to {@link setShapeOptions}.
	*/
	get shapeOptions() {
		return this._shapeOptions;
	}
	/**
	* Set new shape options and rebuild the collision capsule accordingly.
	*
	* This is the supported way to change the capsule for common character features such as
	* crouching, standing, crawling or sliding without recreating the controller (which would lose
	* its position, velocity, support state and event subscriptions). The old Havok shape is
	* released and replaced with a new one built from `options.capsuleHeight` / `options.capsuleRadius`.
	*
	* @param options - New capsule dimensions.
	* @param preserveFootPosition - When `true` (default), the controller position is adapted so the
	* world-space foot position (center - up * height/2) is kept fixed as the height changes; when
	* `false`, the position is left unchanged.
	*/
	setShapeOptions(options, preserveFootPosition = true) {
		const r = options.capsuleRadius ?? .6;
		const h = options.capsuleHeight ?? 1.8;
		if (preserveFootPosition) {
			const delta = (h - (this._shapeOptions.capsuleHeight ?? 1.8)) * .5;
			vaddIn(this._position, vscale(this.up, delta));
			this._node.position.set(this._position.x, this._position.y, this._position.z);
		}
		this._shapeOptions = options;
		const newShape = createPhysicsShape(this._world, {
			type: PhysicsShapeType.CAPSULE,
			parameters: {
				pointA: {
					x: 0,
					y: h * .5 - r,
					z: 0
				},
				pointB: {
					x: 0,
					y: -h * .5 + r,
					z: 0
				},
				radius: r
			}
		});
		const oldShape = this._shape;
		setPhysicsBodyShape(this._world, this._body, newShape);
		this._world._hknp.HP_Shape_Release(oldShape._hkShape);
		this._shape = newShape;
	}
	/** Get the current character velocity (world space). The returned vector is owned by the controller. */
	getVelocity() {
		return this._velocity;
	}
	/** Set the character velocity (world space). */
	setVelocity(velocity) {
		vcopy(this._velocity, velocity);
	}
	/**
	* Move the character by a displacement this physics step, sliding along any geometry it meets.
	* @param displacement - Requested world-space displacement for this step.
	*/
	moveWithCollisions(displacement) {
		const deltaTime = worldStepSeconds(this._world);
		if (!deltaTime || deltaTime <= 0) return;
		const invDeltaTime = 1 / deltaTime;
		this._frameId++;
		vcopy(this._velocity, vscale(displacement, invDeltaTime));
		vcopy(this._lastDisplacement, displacement);
		vcopy(this._lastVelocity, this._velocity);
		this._lastInvDeltaTime = invDeltaTime;
		this._integrateManifolds(deltaTime, ZERO);
	}
	/**
	* Advance the controller using a velocity already chosen for this step (instead of a raw
	* displacement). Mirrors Babylon.js' `integrate`: it picks a cast direction from the current
	* velocity and surface info, then runs the collide-and-slide.
	* @param deltaTime - Step duration in seconds.
	* @param surfaceInfo - Surface info from a prior {@link checkSupport} call.
	* @param gravity - Gravity applied to the character this step.
	*/
	integrate(deltaTime, surfaceInfo, gravity) {
		const invDeltaTime = 1 / deltaTime;
		const tolerance = this._displacementEps * invDeltaTime;
		if (vequalsEps(this._velocity, this._lastVelocity, tolerance)) vscaleIn(this._lastDisplacement, deltaTime * this._lastInvDeltaTime);
		else {
			const displacementVelocity = vclone(this._velocity);
			if (surfaceInfo.supportedState === CharacterSupportedState.SUPPORTED) {
				const relative = vsub(this._velocity, surfaceInfo.averageSurfaceVelocity);
				const normalDotVelocity = vdot(surfaceInfo.averageSurfaceNormal, relative);
				if (normalDotVelocity < 0) {
					vsubIn(relative, vscale(surfaceInfo.averageSurfaceNormal, normalDotVelocity));
					vcopy(displacementVelocity, relative);
					vaddIn(displacementVelocity, surfaceInfo.averageSurfaceVelocity);
				}
			}
			vcopy(this._lastDisplacement, vscale(displacementVelocity, deltaTime));
		}
		vcopy(this._lastVelocity, this._velocity);
		this._lastInvDeltaTime = invDeltaTime;
		this._frameId++;
		this._integrateManifolds(deltaTime, gravity);
	}
	/**
	* Probe the surface under the character along a direction (usually gravity) to classify support.
	* @param deltaTime - Step duration in seconds.
	* @param direction - Direction to probe, usually the gravity direction.
	* @returns Support classification and averaged surface motion/normal.
	*/
	checkSupport(deltaTime, direction) {
		const eps = 1e-4;
		const info = {
			isSurfaceDynamic: false,
			supportedState: CharacterSupportedState.UNSUPPORTED,
			averageSurfaceNormal: v(),
			averageSurfaceVelocity: v(),
			averageAngularSurfaceVelocity: v()
		};
		this._validateManifold();
		const constraints = this._createConstraintsFromManifold(deltaTime, 0);
		const storedVelocities = [];
		for (const c of constraints) {
			storedVelocities.push(vclone(c.velocity));
			vset(c.velocity, 0, 0, 0);
		}
		const maxSurfaceVelocity = v(this.maxCharacterSpeedForSolver, this.maxCharacterSpeedForSolver, this.maxCharacterSpeedForSolver);
		const output = this._simplexSolverSolve(constraints, direction, deltaTime, deltaTime, maxSurfaceVelocity);
		if (vequalsEps(output.velocity, direction, eps)) {
			info.supportedState = CharacterSupportedState.UNSUPPORTED;
			return info;
		}
		if (vlenSq(output.velocity) < eps) info.supportedState = CharacterSupportedState.SUPPORTED;
		else {
			vnormIn(output.velocity);
			const angleSin = vdot(output.velocity, direction);
			info.supportedState = 1 - angleSin * angleSin < this.maxSlopeCosine * this.maxSlopeCosine ? CharacterSupportedState.SLIDING : CharacterSupportedState.SUPPORTED;
		}
		let numTouching = 0;
		for (let i = 0; i < constraints.length; i++) if (output.planeInteractions[i].touched && vdot(constraints[i].planeNormal, direction) < -.08) {
			vaddIn(info.averageSurfaceNormal, constraints[i].planeNormal);
			vaddIn(info.averageSurfaceVelocity, storedVelocities[i]);
			vaddIn(info.averageAngularSurfaceVelocity, constraints[i].angularVelocity);
			numTouching++;
		}
		if (numTouching > 0) {
			vnormIn(info.averageSurfaceNormal);
			vscaleIn(info.averageSurfaceVelocity, 1 / numTouching);
			vscaleIn(info.averageAngularSurfaceVelocity, 1 / numTouching);
		}
		if (info.supportedState === CharacterSupportedState.SUPPORTED) {
			for (const m of this._manifold) if (vdot(m.normal, direction) < -.08 && m.body?.motionType === PhysicsMotionType.DYNAMIC) {
				info.isSurfaceDynamic = true;
				break;
			}
		}
		return info;
	}
	/**
	* Compute a target velocity from the current state, a desired velocity, and surface info — a
	* helper for steering input into surface-aware motion.
	* @param deltaTime - Step duration in seconds.
	* @param forwardWorld - Character forward direction (world space).
	* @param surfaceNormal - Supporting surface normal.
	* @param currentVelocity - Current character velocity.
	* @param surfaceVelocity - Velocity induced by the surface.
	* @param desiredVelocity - Desired character velocity.
	* @param upWorld - Up vector (world space).
	* @returns The new velocity vector.
	*/
	calculateMovement(deltaTime, forwardWorld, surfaceNormal, currentVelocity, surfaceVelocity, desiredVelocity, upWorld) {
		const eps = 1e-5;
		let binorm = vcross(forwardWorld, upWorld);
		if (vlenSq(binorm) < eps) return v();
		vnormIn(binorm);
		const tangent = vcross(binorm, surfaceNormal);
		vnormIn(tangent);
		binorm = vcross(tangent, surfaceNormal);
		vnormIn(binorm);
		const rel = vsub(currentVelocity, surfaceVelocity);
		const relative = {
			x: vdot(rel, tangent),
			y: vdot(rel, binorm),
			z: vdot(rel, surfaceNormal)
		};
		const sideVec = vcross(upWorld, forwardWorld);
		const fwd = vdot(desiredVelocity, forwardWorld);
		const side = vdot(desiredVelocity, sideVec);
		const len = vlen(desiredVelocity);
		const desiredSF = v(-fwd, side, 0);
		vnormIn(desiredSF);
		vscaleIn(desiredSF, len);
		const diff = vsub(desiredSF, relative);
		const lenSq = vlenSq(diff);
		const maxVelocityDelta = this.maxAcceleration * deltaTime;
		vscaleIn(diff, lenSq * this.acceleration * this.acceleration > maxVelocityDelta * maxVelocityDelta ? maxVelocityDelta / Math.sqrt(lenSq) : this.acceleration);
		vaddIn(relative, diff);
		const result = {
			x: relative.x * tangent.x + relative.y * binorm.x + relative.z * surfaceNormal.x,
			y: relative.x * tangent.y + relative.y * binorm.y + relative.z * surfaceNormal.y,
			z: relative.x * tangent.z + relative.y * binorm.z + relative.z * surfaceNormal.z
		};
		vaddIn(result, surfaceVelocity);
		return result;
	}
	_integrateManifolds(deltaTime, gravity) {
		const epsSqrd = 1e-8;
		let newVelocity = v();
		let remainingTime = deltaTime;
		this._validateManifold();
		for (let iter = 0; iter < this.maxCastIterations && remainingTime > 1e-5; iter++) {
			this._castWithCollectors(this._position, vadd(this._position, this._lastDisplacement));
			const updateResult = this._updateManifold(this._lastDisplacement);
			const constraints = this._createConstraintsFromManifold(deltaTime, deltaTime - remainingTime);
			const maxSurfaceVelocity = v(this.maxCharacterSpeedForSolver, this.maxCharacterSpeedForSolver, this.maxCharacterSpeedForSolver);
			const minDeltaTime = vlenSq(this._velocity) === 0 ? 0 : .5 * this.keepDistance / vlen(this._velocity);
			const solveResults = this._simplexSolverSolve(constraints, this._velocity, remainingTime, minDeltaTime, maxSurfaceVelocity);
			const newDisplacement = solveResults.position;
			const solverDeltaTime = solveResults.deltaTime;
			newVelocity = solveResults.velocity;
			this._resolveContacts(deltaTime, gravity);
			let newContactIndex = -1;
			if (updateResult !== 0 || vlenSq(newDisplacement) > epsSqrd && !vequalsEps(this._lastDisplacement, newDisplacement, this._displacementEps)) {
				this._castWithCollectors(this._position, vadd(this._position, newDisplacement), true);
				const hknp = this._world._hknp;
				const numCastHits = hknp.HP_QueryCollector_GetNumHits(this._castCollector)[1];
				for (let i = 0; i < numCastHits; i++) {
					const [fraction, , hitWorld] = hknp.HP_QueryCollector_GetShapeCastResult(this._castCollector, i)[1];
					const newContact = this._contactFromCast(hitWorld, newDisplacement, fraction);
					if (this._findContact(newContact, this._manifold, .1) === -1) {
						newContactIndex = this._manifold.length;
						this._manifold.push(newContact);
						break;
					}
				}
			}
			if (newContactIndex >= 0) {
				const newContact = this._manifold[newContactIndex];
				const displacementLengthInv = 1 / vlen(newDisplacement);
				const angleBetween = vdot(newDisplacement, newContact.normal) * displacementLengthInv;
				const keepDistanceAlongMovement = this.keepDistance / -angleBetween;
				let fraction = newContact.fraction - keepDistanceAlongMovement * displacementLengthInv;
				fraction = clamp(fraction, 0, 1);
				vaddIn(this._position, vscale(newDisplacement, fraction));
				remainingTime -= solverDeltaTime * fraction;
			} else {
				vaddIn(this._position, newDisplacement);
				remainingTime -= solverDeltaTime;
			}
			vcopy(this._lastDisplacement, newDisplacement);
		}
		vcopy(this._velocity, newVelocity);
		this._node.position.set(this._position.x, this._position.y, this._position.z);
	}
	_castWithCollectors(startPos, endPos, castOnly = false) {
		const hknp = this._world._hknp;
		const hkWorld = this._world._hkWorld;
		const shapeHandle = this._shape._hkShape;
		const startNative = [
			startPos.x,
			startPos.y,
			startPos.z
		];
		const orientation = [
			this._orientation.x,
			this._orientation.y,
			this._orientation.z,
			this._orientation.w
		];
		const ignoreSelf = [this._body._hkBody[0]];
		if (!castOnly) {
			const proxQuery = [
				shapeHandle,
				startNative,
				orientation,
				this.keepDistance + this.keepContactTolerance,
				false,
				ignoreSelf
			];
			hknp.HP_World_ShapeProximityWithCollector(hkWorld, this._startCollector, proxQuery);
		}
		const castQuery = [
			shapeHandle,
			orientation,
			startNative,
			[
				endPos.x,
				endPos.y,
				endPos.z
			],
			false,
			ignoreSelf
		];
		hknp.HP_World_ShapeCastWithCollector(hkWorld, this._castCollector, castQuery);
	}
	_findBody(id, contact) {
		const thin = this._world._thin?.resolve(id);
		if (thin) {
			contact.nativeBody = thin[1];
			contact.instanceIndex = thin[2];
			return thin[0];
		}
		const bodies = this._world._bodies;
		for (let i = 0; i < bodies.length; i++) {
			const body = bodies[i];
			if (body._hkBody[0] === id) return body;
		}
		return null;
	}
	_contactFromCast(cp, castPath, hitFraction) {
		const normal = v(cp[4][0], cp[4][1], cp[4][2]);
		const dist = -hitFraction * vdot(castPath, normal);
		const contact = {
			position: v(cp[3][0], cp[3][1], cp[3][2]),
			normal,
			distance: dist,
			fraction: hitFraction,
			body: null,
			nativeBody: null,
			instanceIndex: 0,
			allowedPenetration: clamp(this.keepDistance - dist, 0, this.keepDistance)
		};
		contact.body = this._findBody(cp[0][0], contact);
		return contact;
	}
	_validateManifold() {
		this._manifold = this._manifold.filter((c) => c.body === null || this._world._bodies.indexOf(c.body) !== -1);
	}
	_updateManifold(castPath) {
		const hknp = this._world._hknp;
		const numProximityHits = hknp.HP_QueryCollector_GetNumHits(this._startCollector)[1];
		if (numProximityHits > 0) {
			const newContacts = [];
			let minDistance = 1e38;
			for (let i = 0; i < numProximityHits; i++) {
				const [distance, , contactWorld] = hknp.HP_QueryCollector_GetShapeProximityResult(this._startCollector, i)[1];
				minDistance = Math.min(minDistance, distance);
				const contact = {
					position: v(contactWorld[3][0], contactWorld[3][1], contactWorld[3][2]),
					normal: v(contactWorld[4][0], contactWorld[4][1], contactWorld[4][2]),
					distance,
					fraction: 0,
					body: null,
					nativeBody: null,
					instanceIndex: 0,
					allowedPenetration: clamp(this.keepDistance - distance, 0, this.keepDistance)
				};
				contact.body = this._findBody(contactWorld[0][0], contact);
				newContacts.push(contact);
			}
			for (let i = this._manifold.length - 1; i >= 0; i--) {
				const bestMatch = this._findContact(this._manifold[i], newContacts, 1.1);
				if (bestMatch >= 0) {
					const newAllowed = Math.min(clamp(this.keepDistance - newContacts[bestMatch].distance, 0, this.keepDistance), this._manifold[i].allowedPenetration);
					this._manifold[i] = newContacts[bestMatch];
					this._manifold[i].allowedPenetration = newAllowed;
					newContacts.splice(bestMatch, 1);
				} else this._manifold.splice(i, 1);
			}
			const closestContactIndex = newContacts.findIndex((c) => c.distance === minDistance);
			if (closestContactIndex >= 0) {
				const closest = newContacts[closestContactIndex];
				const bestMatch = this._findContact(closest, this._manifold, .1);
				if (bestMatch >= 0) {
					const newAllowed = Math.min(clamp(this.keepDistance - closest.distance, 0, this.keepDistance), this._manifold[bestMatch].allowedPenetration);
					this._manifold[bestMatch] = closest;
					this._manifold[bestMatch].allowedPenetration = newAllowed;
				} else this._manifold.push(closest);
			}
		} else this._manifold.length = 0;
		let numHitBodies = 0;
		const numCastHits = hknp.HP_QueryCollector_GetNumHits(this._castCollector)[1];
		if (numCastHits > 0) {
			let closestHitBodyId = null;
			for (let i = 0; i < numCastHits; i++) {
				const [fraction, , hitWorld] = hknp.HP_QueryCollector_GetShapeCastResult(this._castCollector, i)[1];
				if (closestHitBodyId === null) {
					const contact = this._contactFromCast(hitWorld, castPath, fraction);
					closestHitBodyId = hitWorld[0][0];
					if (this._findContact(contact, this._manifold, .1) === -1) this._manifold.push(contact);
					if (contact.body?.motionType === PhysicsMotionType.STATIC || contact.body === null) break;
				} else if (hitWorld[0][0] !== closestHitBodyId) {
					numHitBodies++;
					break;
				}
			}
		}
		return numHitBodies;
	}
	_compareContacts(a, b) {
		const angSquared = (1 - vdot(a.normal, b.normal)) * this._contactAngleSensitivity * this._contactAngleSensitivity;
		const planeDistSquared = (a.distance - b.distance) * (a.distance * b.distance);
		const velocityDiffSquared = vlenSq(vsub(this._getPointVelocity(a.body, a.position, a.nativeBody), this._getPointVelocity(b.body, b.position, b.nativeBody)));
		return angSquared * 10 + velocityDiffSquared * .1 + planeDistSquared;
	}
	_findContact(reference, list, threshold) {
		let bestIdx = -1;
		let bestFitness = threshold;
		for (let i = 0; i < list.length; i++) {
			const fitness = this._compareContacts(reference, list[i]);
			if (fitness < bestFitness) {
				bestFitness = fitness;
				bestIdx = i;
			}
		}
		return bestIdx;
	}
	_getMassProperties(body, nativeBody = body._hkBody) {
		return this._world._hknp.HP_Body_GetMassProperties(nativeBody)[1];
	}
	_getComWorld(body, nativeBody = body._hkBody) {
		const com = this._getMassProperties(body, nativeBody)[0];
		const thinCom = this._world._thin?.com(body, nativeBody, com);
		if (thinCom) return thinCom;
		return transformCoord(body.node.worldMatrix, v(com[0], com[1], com[2]));
	}
	_getBodyWorldMatrix(body, nativeBody) {
		return this._world._thin?.matrix(body, nativeBody);
	}
	_getPointVelocity(body, pointWorld, nativeBody) {
		if (!body) return v();
		nativeBody ??= body._hkBody;
		const hknp = this._world._hknp;
		const relPos = vsub(pointWorld, this._getComWorld(body, nativeBody));
		const avArr = hknp.HP_Body_GetAngularVelocity(nativeBody)[1];
		const av = v(avArr[0], avArr[1], avArr[2]);
		const lvArr = hknp.HP_Body_GetLinearVelocity(nativeBody)[1];
		return vadd(vcross(av, relPos), v(lvArr[0], lvArr[1], lvArr[2]));
	}
	_getInvMass(body, nativeBody = body._hkBody) {
		const mass = this._getMassProperties(body, nativeBody)[1];
		return mass > 0 ? 1 / mass : 0;
	}
	_createSurfaceConstraint(dt, contact, timeTravelled) {
		const constraint = {
			planeNormal: vclone(contact.normal),
			planeDistance: contact.distance,
			staticFriction: this.staticFriction,
			dynamicFriction: this.dynamicFriction,
			extraUpStaticFriction: 0,
			extraDownStaticFriction: 0,
			velocity: v(),
			angularVelocity: v(),
			priority: 0
		};
		const maxSlopeCosine = Math.max(this.maxSlopeCosine, .1);
		if (vdot(contact.normal, this.up) > maxSlopeCosine) {
			const com = this._position;
			const contactArm = vsub(contact.position, com);
			const scale = vdot(contact.normal, contactArm);
			contact.position.x = com.x + this.up.x * scale;
			contact.position.y = com.y + this.up.y * scale;
			contact.position.z = com.z + this.up.z * scale;
		}
		const motionType = contact.body?.motionType ?? PhysicsMotionType.STATIC;
		const shift = vdot(constraint.velocity, constraint.planeNormal) * timeTravelled;
		constraint.planeDistance -= shift;
		if (motionType === PhysicsMotionType.STATIC) constraint.priority = 2;
		else if (motionType === PhysicsMotionType.ANIMATED && contact.body) {
			const body = contact.body;
			const nativeBody = contact.nativeBody ?? body._hkBody;
			const thinWorld = this._getBodyWorldMatrix(body, nativeBody);
			const currentWorld = thinWorld ?? body.node.worldMatrix;
			const trackingKey = thinWorld ? nativeBody : body;
			const tracking = this._bodyTracking.get(trackingKey);
			if (!tracking) this._bodyTracking.set(trackingKey, {
				prev: matToArray(currentWorld),
				frameId: this._frameId
			});
			else {
				if (tracking.frameId + 1 === this._frameId) {
					const inv = invertMat4(currentWorld);
					if (inv) {
						const characterLocal = transformCoord(inv, this._position);
						const characterWorld = transformCoord(tracking.prev, characterLocal);
						const playerDelta = vsub(this._position, characterWorld);
						vcopy(constraint.velocity, playerDelta);
						vscaleIn(constraint.velocity, 1 / dt);
						constraint.priority = 1;
					}
				}
				tracking.prev = matToArray(currentWorld);
				tracking.frameId = this._frameId;
			}
		}
		return constraint;
	}
	_addMaxSlopePlane(maxSlopeCos, index, constraints, allowedPenetration) {
		const src = constraints[index];
		const verticalComponent = vdot(src.planeNormal, this.up);
		if (verticalComponent > .01 && verticalComponent < maxSlopeCos) {
			const newConstraint = {
				planeNormal: vclone(src.planeNormal),
				planeDistance: src.planeDistance,
				velocity: vclone(src.velocity),
				angularVelocity: vclone(src.angularVelocity),
				priority: src.priority,
				dynamicFriction: src.dynamicFriction,
				staticFriction: src.staticFriction,
				extraDownStaticFriction: src.extraDownStaticFriction,
				extraUpStaticFriction: src.extraUpStaticFriction
			};
			const distance = newConstraint.planeDistance;
			vsubIn(newConstraint.planeNormal, vscale(this.up, verticalComponent));
			vnormIn(newConstraint.planeNormal);
			if (distance >= 0) newConstraint.planeDistance = distance * vdot(newConstraint.planeNormal, src.planeNormal);
			else {
				newConstraint.planeDistance = Math.min(0, distance + allowedPenetration) / vdot(newConstraint.planeNormal, src.planeNormal);
				src.planeDistance = 0;
				this._resolveConstraintPenetration(newConstraint);
			}
			constraints.push(newConstraint);
		}
	}
	_resolveConstraintPenetration(constraint) {
		if (constraint.planeDistance < -1e-6) vsubIn(constraint.velocity, vscale(constraint.planeNormal, constraint.planeDistance * this.penetrationRecoverySpeed));
	}
	_createConstraintsFromManifold(dt, timeTravelled) {
		const constraints = [];
		for (let i = 0; i < this._manifold.length; i++) {
			const surfaceConstraint = this._createSurfaceConstraint(dt, this._manifold[i], timeTravelled);
			constraints.push(surfaceConstraint);
			this._addMaxSlopePlane(this.maxSlopeCosine, i, constraints, this._manifold[i].allowedPenetration);
			this._resolveConstraintPenetration(surfaceConstraint);
		}
		return constraints;
	}
	_resolveContacts(deltaTime, gravity) {
		const hknp = this._world._hknp;
		for (const contact of this._manifold) {
			const body = contact.body;
			if (!body || body.motionType !== PhysicsMotionType.DYNAMIC) continue;
			const nativeBody = contact.nativeBody ?? body._hkBody;
			const pointRelVel = this._getPointVelocity(body, contact.position, nativeBody);
			vsubIn(pointRelVel, this._velocity);
			const inputProjectedVelocity = vdot(pointRelVel, contact.normal);
			let deltaVelocity = -inputProjectedVelocity * .9;
			if (contact.distance < 0) deltaVelocity += contact.distance * .4 / deltaTime;
			let outputImpulse = v();
			if (deltaVelocity < 0) {
				const comWorld = this._getComWorld(body, nativeBody);
				const inputObjectMassInv = vlenSq(vcross(vsub(contact.position, comWorld), contact.normal)) * this._getInvMass(body, nativeBody) + this._getInvMass(body, nativeBody);
				let impulseMag = inputObjectMassInv > 0 ? deltaVelocity / inputObjectMassInv : 0;
				const maxPushImpulse = -this.characterStrength * deltaTime;
				if (impulseMag < maxPushImpulse) impulseMag = maxPushImpulse;
				outputImpulse = vscale(contact.normal, impulseMag);
			}
			let relVelN = vdot(contact.normal, vscale(gravity, deltaTime));
			if (inputProjectedVelocity < 0) relVelN -= inputProjectedVelocity;
			if (relVelN < -1e-12) vaddIn(outputImpulse, vscale(contact.normal, this.characterMass * relVelN));
			this.onTriggerCollisionObservable.notify({
				collider: body,
				colliderIndex: contact.instanceIndex,
				impulse: outputImpulse,
				impulsePosition: contact.position
			});
			hknp.HP_Body_ApplyImpulse(nativeBody, [
				contact.position.x,
				contact.position.y,
				contact.position.z
			], [
				outputImpulse.x,
				outputImpulse.y,
				outputImpulse.z
			]);
		}
	}
	_getOutput(info, constraint) {
		return info.outputInteractions[info.inputConstraints.indexOf(constraint)];
	}
	_sortInfo(info) {
		for (let i = 0; i < info.numSupportPlanes - 1; i++) for (let j = i + 1; j < info.numSupportPlanes; j++) {
			const p0 = info.supportPlanes[i];
			const p1 = info.supportPlanes[j];
			if (p0.constraint.priority < p1.constraint.priority) continue;
			if (p0.constraint.priority === p1.constraint.priority && vlenSq(p0.constraint.velocity) < vlenSq(p1.constraint.velocity)) continue;
			info.supportPlanes[i] = p1;
			info.supportPlanes[j] = p0;
		}
	}
	_solve1d(sci, velocityIn, velocityOut) {
		const eps = 1e-5;
		const groundVelocity = sci.velocity;
		const relativeVelocity = vsub(velocityIn, groundVelocity);
		const planeVel = vdot(relativeVelocity, sci.planeNormal);
		const origVelocity2 = vlenSq(relativeVelocity);
		vsubIn(relativeVelocity, vscale(sci.planeNormal, planeVel));
		const vp2 = planeVel * planeVel;
		const extraStaticFriction = vdot(relativeVelocity, this.up) > 0 ? sci.extraUpStaticFriction : sci.extraDownStaticFriction;
		if (extraStaticFriction > 0) {
			const horizontal = vcross(this.up, sci.planeNormal);
			const hor2 = vlenSq(horizontal);
			let horVel = 0;
			if (hor2 > eps) {
				vscaleIn(horizontal, 1 / Math.sqrt(hor2));
				horVel = vdot(relativeVelocity, horizontal);
				const horVel2 = horVel * horVel;
				if (vp2 * (sci.staticFriction * sci.staticFriction) >= horVel2) {
					vsubIn(relativeVelocity, vscale(horizontal, horVel));
					horVel = 0;
				}
			}
			const vertVel2 = origVelocity2 - horVel * horVel - vp2;
			if (vp2 * ((sci.staticFriction + extraStaticFriction) * (sci.staticFriction + extraStaticFriction)) >= vertVel2 && horVel === 0) {
				vcopy(velocityOut, groundVelocity);
				return;
			}
		} else if (vp2 * (1 + sci.staticFriction * sci.staticFriction) >= origVelocity2) {
			vcopy(velocityOut, groundVelocity);
			return;
		}
		if (sci.dynamicFriction < 1) {
			const velOut2 = vlenSq(relativeVelocity);
			if (velOut2 >= eps && velOut2 > 1e-4 * origVelocity2) {
				let f = Math.sqrt(origVelocity2 / velOut2);
				f = sci.dynamicFriction + (1 - sci.dynamicFriction) * f;
				vscaleIn(relativeVelocity, f);
				const p = vdot(sci.planeNormal, relativeVelocity);
				vsubIn(relativeVelocity, vscale(sci.planeNormal, p));
			}
		}
		vcopy(velocityOut, relativeVelocity);
		vaddIn(velocityOut, groundVelocity);
	}
	_solveTest1d(sci, velocityIn) {
		return vdot(vsub(velocityIn, sci.velocity), sci.planeNormal) < -.001;
	}
	_solve2d(info, maxSurfaceVelocity, sci0, sci1, velocityIn, velocityOut) {
		const eps = 1e-5;
		const axis = vcross(sci0.planeNormal, sci1.planeNormal);
		const axisLen2 = vlenSq(axis);
		let solveSequentially = false;
		let axisVel = v();
		while (true) {
			if (axisLen2 <= eps || solveSequentially) {
				this._getOutput(info, sci0).status = 2;
				this._getOutput(info, sci1).status = 2;
				if (sci0.priority > sci1.priority) {
					this._solve1d(sci1, velocityIn, velocityOut);
					this._solve1d(sci0, velocityIn, velocityOut);
				} else {
					this._solve1d(sci0, velocityIn, velocityOut);
					this._solve1d(sci1, velocityIn, velocityOut);
				}
				return;
			}
			const invAxisLen = 1 / Math.sqrt(axisLen2);
			vscaleIn(axis, invAxisLen);
			const r0 = vcross(sci0.planeNormal, sci1.planeNormal);
			const r1 = vcross(sci1.planeNormal, axis);
			const r2 = vcross(axis, sci0.planeNormal);
			const t = v(.5 * vdot(axis, vadd(sci0.velocity, sci1.velocity)), vdot(sci0.planeNormal, sci0.velocity), vdot(sci1.planeNormal, sci1.velocity));
			axisVel = v(vdot(t, r0), vdot(t, r1), vdot(t, r2));
			vscaleIn(axisVel, invAxisLen);
			if (Math.abs(axisVel.x) > maxSurfaceVelocity.x || Math.abs(axisVel.y) > maxSurfaceVelocity.y || Math.abs(axisVel.z) > maxSurfaceVelocity.z) solveSequentially = true;
			else break;
		}
		const groundVelocity = axisVel;
		const relativeVelocity = vsub(velocityIn, groundVelocity);
		const vel2 = vlenSq(relativeVelocity);
		const axisVert = vdot(this.up, axis);
		let axisProjVelocity = vdot(relativeVelocity, axis);
		let staticFriction = sci0.staticFriction + sci1.staticFriction;
		if (axisVert * axisProjVelocity > 0) staticFriction += (sci0.extraUpStaticFriction + sci1.extraUpStaticFriction) * axisVert;
		else staticFriction += (sci0.extraDownStaticFriction + sci1.extraDownStaticFriction) * axisVert;
		staticFriction *= .5;
		const dynamicFriction = (sci0.dynamicFriction + sci1.dynamicFriction) * .5;
		const f2 = staticFriction * staticFriction;
		const av2 = axisProjVelocity * axisProjVelocity;
		if ((vel2 - av2) * f2 >= av2) {
			vcopy(velocityOut, groundVelocity);
			return;
		}
		if (dynamicFriction < 1 && axisProjVelocity * axisProjVelocity > 1e-4 * vel2) {
			const f = Math.abs(1 / axisProjVelocity) * Math.sqrt(vel2) * (1 - dynamicFriction) + dynamicFriction;
			axisProjVelocity *= f;
		}
		vcopy(velocityOut, groundVelocity);
		vaddIn(velocityOut, vscale(axis, axisProjVelocity));
	}
	_solve3d(info, maxSurfaceVelocity, sci0, sci1, sci2, allowResort, velocityIn, velocityOut) {
		const eps = 1e-5;
		let pointVel = v();
		let r0 = vcross(sci1.planeNormal, sci2.planeNormal);
		let r1 = vcross(sci2.planeNormal, sci0.planeNormal);
		let r2 = vcross(sci0.planeNormal, sci1.planeNormal);
		let det = vdot(r0, sci0.planeNormal);
		let solveSequentially = false;
		while (true) {
			if (Math.abs(det) < eps || solveSequentially) {
				if (allowResort) {
					this._sortInfo(info);
					sci0 = info.supportPlanes[0].constraint;
					sci1 = info.supportPlanes[1].constraint;
					sci2 = info.supportPlanes[2].constraint;
				}
				this._getOutput(info, sci0).status = 1;
				this._getOutput(info, sci1).status = 1;
				this._getOutput(info, sci2).status = 1;
				const oldNum = info.numSupportPlanes;
				this._solve2d(info, maxSurfaceVelocity, sci0, sci1, velocityIn, velocityOut);
				if (oldNum === info.numSupportPlanes) this._solve2d(info, maxSurfaceVelocity, sci0, sci2, velocityIn, velocityOut);
				if (oldNum === info.numSupportPlanes) this._solve2d(info, maxSurfaceVelocity, sci1, sci2, velocityIn, velocityOut);
				return;
			}
			const t = v(vdot(sci0.planeNormal, sci0.velocity), vdot(sci1.planeNormal, sci1.velocity), vdot(sci2.planeNormal, sci2.velocity));
			pointVel = {
				x: t.x * r0.x + t.y * r1.x + t.z * r2.x,
				y: t.x * r0.y + t.y * r1.y + t.z * r2.y,
				z: t.x * r0.z + t.y * r1.z + t.z * r2.z
			};
			vscaleIn(pointVel, 1 / det);
			if (Math.abs(pointVel.x) > maxSurfaceVelocity.x || Math.abs(pointVel.y) > maxSurfaceVelocity.y || Math.abs(pointVel.z) > maxSurfaceVelocity.z) solveSequentially = true;
			else break;
			r0 = vcross(sci1.planeNormal, sci2.planeNormal);
			r1 = vcross(sci2.planeNormal, sci0.planeNormal);
			r2 = vcross(sci0.planeNormal, sci1.planeNormal);
			det = vdot(r0, sci0.planeNormal);
		}
		vcopy(velocityOut, pointVel);
	}
	_examineActivePlanes(info, maxSurfaceVelocity, velocityIn, velocityOut) {
		while (true) switch (info.numSupportPlanes) {
			case 1:
				this._solve1d(info.supportPlanes[0].constraint, velocityIn, velocityOut);
				return;
			case 2: {
				const velocity = v();
				this._solve1d(info.supportPlanes[1].constraint, velocityIn, velocity);
				if (!this._solveTest1d(info.supportPlanes[0].constraint, velocity)) {
					this._copyPlane(info.supportPlanes[0], info.supportPlanes[1]);
					info.numSupportPlanes = 1;
					vcopy(velocityOut, velocity);
				} else this._solve2d(info, maxSurfaceVelocity, info.supportPlanes[0].constraint, info.supportPlanes[1].constraint, velocityIn, velocityOut);
				return;
			}
			case 3:
				{
					const velocity = v();
					this._solve1d(info.supportPlanes[2].constraint, velocityIn, velocityOut);
					if (!this._solveTest1d(info.supportPlanes[0].constraint, velocity) && !this._solveTest1d(info.supportPlanes[1].constraint, velocity)) {
						vcopy(velocityOut, velocity);
						this._copyPlane(info.supportPlanes[0], info.supportPlanes[2]);
						info.numSupportPlanes = 1;
						continue;
					}
				}
				{
					let droppedAPlane = false;
					for (let testPlane = 0; testPlane < 2; testPlane++) {
						this._solve2d(info, maxSurfaceVelocity, info.supportPlanes[testPlane].constraint, info.supportPlanes[2].constraint, velocityIn, velocityOut);
						if (!this._solveTest1d(info.supportPlanes[1 - testPlane].constraint, velocityOut)) {
							this._copyPlane(info.supportPlanes[0], info.supportPlanes[testPlane]);
							this._copyPlane(info.supportPlanes[1], info.supportPlanes[2]);
							info.numSupportPlanes--;
							droppedAPlane = true;
							break;
						}
					}
					if (droppedAPlane) continue;
				}
				this._solve3d(info, maxSurfaceVelocity, info.supportPlanes[0].constraint, info.supportPlanes[1].constraint, info.supportPlanes[2].constraint, true, velocityIn, velocityOut);
				return;
			case 4: {
				this._sortInfo(info);
				let droppedAPlane = false;
				for (let i = 0; i < 3; i++) {
					const velocity = v();
					this._solve3d(info, maxSurfaceVelocity, info.supportPlanes[(i + 1) % 3].constraint, info.supportPlanes[(i + 2) % 3].constraint, info.supportPlanes[3].constraint, false, velocityIn, velocity);
					if (!this._solveTest1d(info.supportPlanes[i].constraint, velocity)) {
						this._copyPlane(info.supportPlanes[i], info.supportPlanes[2]);
						this._copyPlane(info.supportPlanes[2], info.supportPlanes[3]);
						info.numSupportPlanes = 3;
						droppedAPlane = true;
						break;
					}
				}
				if (droppedAPlane) continue;
				{
					const velocity = vclone(velocityIn);
					this._solve3d(info, maxSurfaceVelocity, info.supportPlanes[0].constraint, info.supportPlanes[1].constraint, info.supportPlanes[2].constraint, false, velocity, velocity);
					vcopy(velocityOut, velocity);
				}
				{
					let maxStatus = 0;
					for (let i = 0; i < 4; i++) maxStatus = Math.max(maxStatus, info.supportPlanes[i].interaction.status);
					for (let i = 0; i < 4; i++) {
						if (maxStatus === info.supportPlanes[i].interaction.status) {
							this._copyPlane(info.supportPlanes[i], info.supportPlanes[3]);
							break;
						}
						info.numSupportPlanes--;
					}
				}
				for (let i = 0; i < 3; i++) info.supportPlanes[i].interaction.status = 0;
				continue;
			}
			default: return;
		}
	}
	_copyPlane(dst, src) {
		dst.index = src.index;
		dst.constraint = src.constraint;
		dst.interaction = src.interaction;
	}
	_simplexSolverSolve(constraints, velocity, deltaTime, minDeltaTime, maxSurfaceVelocity) {
		const eps = 1e-6;
		const output = {
			position: v(),
			velocity: vclone(velocity),
			deltaTime,
			planeInteractions: []
		};
		for (let i = 0; i < constraints.length; i++) output.planeInteractions.push({
			touched: false,
			stopped: false,
			surfaceTime: 0,
			penaltyDistance: 0,
			status: 0
		});
		const info = {
			supportPlanes: [],
			numSupportPlanes: 0,
			currentTime: 0,
			inputConstraints: constraints,
			outputInteractions: output.planeInteractions
		};
		const emptyConstraint = () => ({
			planeNormal: v(),
			planeDistance: 0,
			staticFriction: 0,
			dynamicFriction: 0,
			extraUpStaticFriction: 0,
			extraDownStaticFriction: 0,
			velocity: v(),
			angularVelocity: v(),
			priority: 0
		});
		const emptyInteraction = () => ({
			touched: false,
			stopped: false,
			surfaceTime: 0,
			penaltyDistance: 0,
			status: 0
		});
		for (let i = 0; i < 4; i++) info.supportPlanes.push({
			index: -1,
			constraint: emptyConstraint(),
			interaction: emptyInteraction()
		});
		let remainingTime = deltaTime;
		while (remainingTime > 0) {
			let hitIndex = -1;
			let minCollisionTime = remainingTime;
			for (let i = 0; i < constraints.length; i++) {
				if (info.numSupportPlanes >= 1 && info.supportPlanes[0].index === i) continue;
				if (info.numSupportPlanes >= 2 && info.supportPlanes[1].index === i) continue;
				if (info.numSupportPlanes >= 3 && info.supportPlanes[2].index === i) continue;
				if (output.planeInteractions[i].status !== 0) continue;
				const sci = constraints[i];
				const relativeProjectedVel = -vdot(vsub(output.velocity, sci.velocity), sci.planeNormal);
				if (relativeProjectedVel <= 0) continue;
				const relativePos = vsub(output.position, vscale(sci.velocity, info.currentTime));
				let projectedPos = vdot(sci.planeNormal, relativePos);
				const penaltyDist = output.planeInteractions[i].penaltyDistance;
				if (penaltyDist < eps) projectedPos = 0;
				projectedPos += penaltyDist;
				if (projectedPos < minCollisionTime * relativeProjectedVel) {
					minCollisionTime = projectedPos / relativeProjectedVel;
					hitIndex = i;
				}
			}
			if (minCollisionTime > 1e-4) {
				info.currentTime += minCollisionTime;
				remainingTime -= minCollisionTime;
				vaddIn(output.position, vscale(output.velocity, minCollisionTime));
				for (let i = 0; i < info.numSupportPlanes; i++) {
					info.supportPlanes[i].interaction.surfaceTime += minCollisionTime;
					info.supportPlanes[i].interaction.touched = true;
				}
				output.deltaTime = info.currentTime;
				if (info.currentTime > minDeltaTime) return output;
			}
			if (hitIndex < 0) {
				output.deltaTime = deltaTime;
				break;
			}
			const supportPlane = info.supportPlanes[info.numSupportPlanes++];
			supportPlane.constraint = constraints[hitIndex];
			supportPlane.interaction = output.planeInteractions[hitIndex];
			supportPlane.interaction.penaltyDistance = (supportPlane.interaction.penaltyDistance + eps) * 2;
			supportPlane.index = hitIndex;
			this._examineActivePlanes(info, maxSurfaceVelocity, velocity, output.velocity);
		}
		return output;
	}
};
var ZERO = {
	x: 0,
	y: 0,
	z: 0
};
function matToArray(m) {
	const out = new Array(16);
	for (let i = 0; i < 16; i++) out[i] = m[i];
	return out;
}
/**
* Create a Havok physics character controller.
*
* The controller adds a kinematic capsule body to `world` and resolves collisions by sweeping
* that capsule each step. Drive it from a per-physics-step callback (e.g. `onPhysicsAfterStep`)
* by calling {@link PhysicsCharacterController.moveWithCollisions} with the desired displacement,
* then read {@link PhysicsCharacterController.getPosition} to update your display mesh.
* @param world - The physics world to add the character to.
* @param position - Initial world-space position of the character.
* @param options - Capsule dimensions.
* @returns The character controller instance.
*/
function createPhysicsCharacterController(world, position, options) {
	return new PhysicsCharacterController(world, position, options);
}
/** Return the Havok body backing a character controller. */
function getPhysicsCharacterControllerBody(controller) {
	return controller.getBody();
}
export { CharacterCollisionObservable, CharacterSupportedState, PhysicsCharacterController, createPhysicsCharacterController, getPhysicsCharacterControllerBody };

//# sourceMappingURL=character-controller.js.map