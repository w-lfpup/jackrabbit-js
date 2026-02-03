interface ListenerInterface {
	addEventListener: EventTarget["addEventListener"];
}

class Listeners implements ListenerInterface {
	#eventMap: Map<string, EventListenerOrEventListenerObject[]> = new Map();

	addEventListener(eventName: string, cb: EventListenerOrEventListenerObject) {
		let eventListeners = this.#eventMap.get(eventName);
		if (!eventListeners) {
			eventListeners = [];
			this.#eventMap.set(eventName, eventListeners);
		}
		eventListeners.push(cb);
	}
}
