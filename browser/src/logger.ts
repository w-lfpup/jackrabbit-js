import type {
	LoggerAction,
	LoggerInterface,
} from "jackrabbit/core/dist/mod.js";
import { FetchQueue } from "./queue.js";

export class Logger implements LoggerInterface {
	#fetchQueue = new FetchQueue();
	#cancelled = false;

	get cancelled() {
		return this.#cancelled;
	}

	log(action: LoggerAction) {
		console.log(action);
		this.#fetchQueue.enqueue(function () {
			return fetch(`/log/${action.type}`, {
				body: JSON.stringify(action),
				headers: new Headers([["Content-Type", "application/json"]]),
				method: "POST",
			});
		});
	}
}
