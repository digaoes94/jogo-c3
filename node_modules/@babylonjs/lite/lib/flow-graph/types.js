// src/flow-graph/types.ts
/** Type tags.
*  String values intentionally match the glTF / BJS `flowGraphType` identifiers
*  so the declaration mapper can pass them through unchanged. */
var FgType = {
	Any: "any",
	Number: "number",
	Boolean: "boolean",
	String: "string",
	Integer: "FlowGraphInteger",
	Vector2: "Vector2",
	Vector3: "Vector3",
	Vector4: "Vector4",
	Quaternion: "Quaternion",
	Matrix: "Matrix",
	Matrix2D: "Matrix2D",
	Matrix3D: "Matrix3D",
	Color3: "Color3",
	Color4: "Color4",
	/** Opaque host reference. KHR uses canonical JSON Pointer strings; "" is null. */
	Reference: "ref"
};
/** Event channels an event block can subscribe to. */
var FgEventType = {
	/** Fired once when the graph starts (scene ready). */
	Start: "start",
	/** Fired every frame with `{ deltaMs, deltaTime }`. */
	Tick: "tick",
	/** Custom events sent between graphs; payload carries `eventName` + values. */
	CustomEvent: "customEvent",
	/** Pointer events forwarded by the picking/input layer. */
	Pointer: "pointer",
	/** Keyboard events forwarded by the input layer. */
	Key: "key"
};
export { FgEventType, FgType };

//# sourceMappingURL=types.js.map