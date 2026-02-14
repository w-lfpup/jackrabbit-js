import type {
	LoggerAction,
	LoggerInterface,
} from "jackrabbit/core/dist/mod.js";
import { FetchQueue } from "./queue.js";

interface LoggerData {
	cancelled: boolean;
	failed: boolean;
	startTime: number;
	testTime: number;
}

export class Logger implements LoggerInterface {
	#fetchQueue = new FetchQueue();
	#cancelled = false;

	get cancelled() {
		return this.#cancelled;
	}

	log(action: LoggerAction) {
		if ("start_run" === action.type) {
			this.#fetchQueue.enqueue(function () {
				return fetch("/log/start_run", getRequestInit(action));
			});
		}

		if ("start_module" === action.type) {
			this.#fetchQueue.enqueue(function () {
				return fetch("/log/start_module", getRequestInit(action));
			});
		}

		if ("end_test" === action.type) {
			this.#fetchQueue.enqueue(function () {
				return fetch("/log/end_test", getRequestInit(action));
			});
		}

		if ("end_module" === action.type) {
			this.#fetchQueue.enqueue(function () {
				return fetch("/log/end_module", getRequestInit(action));
			});
		}

		if ("end_run" === action.type) {
			this.#fetchQueue.enqueue(function () {
				return fetch("/log/end_run", getRequestInit(action));
			});
		}

		if ("error" === action.type) {
			this.#fetchQueue.enqueue(function () {
				return fetch("/log/error", getRequestInit(action));
			});
		}
	}
}

function getRequestInit(action: LoggerAction): RequestInit {
	return {
		body: JSON.stringify(action),
		headers: new Headers([["Content-Type", "application/json"]]),
		method: "POST",
	};
}
