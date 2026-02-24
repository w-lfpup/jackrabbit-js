import type {
	LoggerAction,
	LoggerInterface,
} from "jackrabbit/core/dist/mod.js";

interface Queueable {
	(): Promise<unknown>;
}

export class Logger implements LoggerInterface {
	#fetchQueue = new FetchQueue();
	#cancelled = false;

	get cancelled() {
		return this.#cancelled;
	}

	log(action: LoggerAction) {
		this.#fetchQueue.enqueue(function () {
			return fetch(`/log/${action.type}`, {
				body: JSON.stringify(action),
				headers: new Headers([["Content-Type", "application/json"]]),
				method: "POST",
			});
		});
	}
}

class FetchQueue {
	#inbound: Queueable[] = [];
	#outbound: Queueable[] = [];
	#inRoute: Queueable | undefined;

	enqueue(queueable: Queueable) {
		this.#inbound.push(queueable);
		if (!this.#inRoute) this.#queueAtom();
	}

	#queueAtom() {
		if (!this.#outbound.length) {
			while (this.#inbound.length) {
				let pip = this.#inbound.pop();
				if (pip) this.#outbound.push(pip);
			}
		}

		this.#inRoute = this.#outbound.pop();
		this.#execAtom();
	}

	async #execAtom() {
		if (this.#inRoute) {
			await this.#inRoute();
			this.#queueAtom();
		}
	}
}
