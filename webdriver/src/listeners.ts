export interface ListenerInterface {
	addEventListener: EventTarget["addEventListener"];
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

	dispatchEvent(event: Event) {
		let eventListeners = this.#eventMap.get(event.type);
		if (eventListeners)
			for (const listener of eventListeners) {
				if (listener instanceof Function) {
					listener(event);
				} else {
					listener.handleEvent(event);
				}
			}
	}
}
