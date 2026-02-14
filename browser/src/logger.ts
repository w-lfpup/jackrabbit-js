import type {
	LoggerAction,
	LoggerInterface,
} from "jackrabbit/core/dist/mod.js";
import { FetchQueue } from "./queue.js";

const actions = new Set<LoggerAction["type"]>([
	"start_run",
	"start_module",
	"module_error",
	"end_test",
	"test_error",
	"end_module",
	"end_run",
	"cancel_run",
	"run_error",
]);

export class Logger implements LoggerInterface {
	#fetchQueue = new FetchQueue();
	#cancelled = false;

	get cancelled() {
		return this.#cancelled;
	}

	log(action: LoggerAction) {
		if (actions.has(action.type))
			this.#fetchQueue.enqueue(function () {
				return fetch(`/log/${action.type}`, {
					body: JSON.stringify(action),
					headers: new Headers([["Content-Type", "application/json"]]),
					method: "POST",
				});
			});
	}
}
