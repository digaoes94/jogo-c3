import { FgEventType } from "./types.js";
// src/flow-graph/event-bus.ts
/** Create an empty event bus. (Allocation is inside the factory, never at
*  module scope, so the module stays tree-shakable.) */
function createFgEventBus() {
	return {
		_listeners: /* @__PURE__ */ new Map(),
		_dispatchStack: [],
		_queue: []
	};
}
/** Queue an event for delivery at the start of the next flow-graph tick. */
function queueFgEvent(bus, channel, payload) {
	bus._queue.push({
		channel,
		payload
	});
}
/** Deliver all events currently queued. Events queued by a handler are deferred
* to the following flush so dispatch cannot recurse indefinitely. */
function flushFgEvents(bus) {
	const queued = bus._queue.splice(0, bus._queue.length);
	for (const event of queued) pumpFgEvent(bus, event.channel, event.payload);
}
/** Subscribe `handler` to a channel. Returns an unsubscribe function.
*  Handlers fire in subscription order — callers control ordering by the order
*  in which they subscribe (see runtime init-priority). */
function subscribeFgEvent(bus, channel, handler, owner = bus) {
	let subscriptions = bus._listeners.get(channel);
	if (!subscriptions) {
		subscriptions = [];
		bus._listeners.set(channel, subscriptions);
	}
	const subscription = {
		handler,
		owner
	};
	subscriptions.push(subscription);
	return () => {
		const list = bus._listeners.get(channel);
		if (!list) return;
		const i = list.indexOf(subscription);
		if (i >= 0) list.splice(i, 1);
	};
}
/** Dispatch `payload` to every handler subscribed to `channel`. Iterates a
*  snapshot so a handler may safely (un)subscribe during dispatch. */
function pumpFgEvent(bus, channel, payload) {
	const subscriptions = bus._listeners.get(channel);
	if (!subscriptions || subscriptions.length === 0) return;
	const reference = typeof payload.event === "string" ? payload.event : `/extensions/KHR_interactivity/events/${String(payload.eventName ?? channel)}`;
	const handlersByOwner = /* @__PURE__ */ new Map();
	for (const { handler, owner } of subscriptions.slice()) {
		const handlers = handlersByOwner.get(owner);
		if (handlers) handlers.push(handler);
		else handlersByOwner.set(owner, [handler]);
	}
	for (const handlers of handlersByOwner.values()) pumpFgEventHandlers(bus, handlers, {
		...payload,
		event: reference
	});
}
/** Dispatch to an explicit handler set. Lifecycle events use this to keep
* stopImmediate scoped to one behavior graph even when graphs share a bus. */
function pumpFgEventHandlers(bus, handlers, payload) {
	const reference = typeof payload.event === "string" ? payload.event : `/extensions/KHR_interactivity/events/${String(payload.eventName ?? "")}`;
	const dispatch = {
		reference,
		stopImmediate: false,
		stopTransitive: false,
		allowTransitive: 0
	};
	bus._dispatchStack.push(dispatch);
	try {
		const eventPayload = {
			...payload,
			event: reference
		};
		for (const handler of handlers) {
			handler(eventPayload);
			if (dispatch.stopImmediate) break;
			dispatch.stopTransitive = false;
		}
	} finally {
		bus._dispatchStack.pop();
	}
}
/** Stop transitive signal propagation for the most recent matching in-flight
* event. `stopImmediate` additionally stops sibling event handlers. */
function stopFgEventPropagation(bus, reference, stopImmediate) {
	for (let i = bus._dispatchStack.length - 1; i >= 0; i--) {
		const dispatch = bus._dispatchStack[i];
		if (dispatch.reference === reference) {
			dispatch.stopTransitive = true;
			dispatch.stopImmediate ||= stopImmediate;
			return;
		}
	}
}
/** Whether the active event dispatch has requested that its signal cascade stop. */
function isFgEventTransitivePropagationStopped(bus) {
	const dispatch = bus._dispatchStack[bus._dispatchStack.length - 1];
	return dispatch ? dispatch.stopTransitive && dispatch.allowTransitive === 0 : false;
}
/** Run the stopPropagation block's own output cascade after propagation stops. */
function allowFgEventPropagation(bus, callback) {
	const dispatch = bus._dispatchStack[bus._dispatchStack.length - 1];
	if (!dispatch) {
		callback();
		return;
	}
	dispatch.allowTransitive++;
	try {
		callback();
	} finally {
		dispatch.allowTransitive--;
	}
}
/** Remove every listener from the bus. */
function clearFgEventBus(bus) {
	bus._listeners.clear();
	bus._queue.length = 0;
	bus._dispatchStack.length = 0;
}
export { FgEventType, allowFgEventPropagation, clearFgEventBus, createFgEventBus, flushFgEvents, isFgEventTransitivePropagationStopped, pumpFgEvent, pumpFgEventHandlers, queueFgEvent, stopFgEventPropagation, subscribeFgEvent };

//# sourceMappingURL=event-bus.js.map