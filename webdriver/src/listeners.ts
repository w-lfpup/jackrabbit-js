export interface ListenerInterface {
	addEventListener: EventTarget["addEventListener"];
	dispatchEvent: EventTarget["dispatchEvent"];
}

export class Listeners implements ListenerInterface {
	#eventMap: Map<string, EventListenerOrEventListenerObject[]> = new Map();

	addEventListener(eventName: string, cb: EventListenerOrEventListenerObject) {
		let eventListeners = this.#eventMap.get(eventName);
		if (!eventListeners) {
			eventListeners = [];
			this.#eventMap.set(eventName, eventListeners);
		}
		eventListeners.push(cb);
	}

	dispatchEvent(event: Event): boolean {
		let eventListeners = this.#eventMap.get(event.type);
		if (eventListeners)
			for (const listener of eventListeners) {
				listener instanceof Function
					? listener(event)
					: listener.handleEvent(event);
			}

		return event.cancelable || event.defaultPrevented;
	}
}
