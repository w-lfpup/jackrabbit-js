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

	#data: LoggerData = {
		cancelled: false,
		failed: false,
		startTime: -1,
		testTime: 0,
	};

	get failed() {
		return this.#data.failed;
	}

	get cancelled() {
		return this.#data.cancelled;
	}

	log(action: LoggerAction) {
		if ("start_run" === action.type) {
			this.#fetchQueue.enqueue(function () {
				return fetch("/log/start_run", {
					method: "POST",
					body: JSON.stringify(action),
				});
			});
		}

		if ("start_module" === action.type) {
			this.#fetchQueue.enqueue(function () {
				return fetch("/log/start_module", {
					method: "POST",
					body: JSON.stringify(action),
				});
			});
		}

		if ("end_test" === action.type) {
			this.#fetchQueue.enqueue(function () {
				return fetch("/log/end_test", {
					method: "POST",
					body: JSON.stringify(action),
				});
			});
		}

		if ("end_module" === action.type) {
			this.#fetchQueue.enqueue(function () {
				return fetch("/log/end_module", {
					method: "POST",
					body: JSON.stringify(action),
				});
			});
		}

		if ("end_run" === action.type) {
			this.#fetchQueue.enqueue(function () {
				return fetch("/log/end_run", {
					method: "POST",
					body: JSON.stringify(action),
				});
			});
		}
	}
}
