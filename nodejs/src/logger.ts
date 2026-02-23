import type { LoggerAction, LoggerInterface } from "../../core/dist/mod.js";

/**
 * TODO(taylorvann):
 *
 * Logging tests in order is not a priority.
 * I will come back to it when I feel like it.
 */

/**
 *
 */

interface LoggerData {
	errored: boolean;
	failed: boolean;
	startTime: number;
	testTime: number;
}

interface ModuleReceipt {
	title: string;
	numberOfTests: number;
	testActions: LoggerAction[];
}

interface CollectionReceipt {
	title: string;
	numberOfModules: number;
	moduleReceipts: ModuleReceipt[];
}

export class Logger implements LoggerInterface {
	#failed: boolean = false;
	#errored: boolean = false;
	#testActions: LoggerAction[] = [];

	get failed() {
		return this.#failed;
	}

	get errored() {
		return this.#errored;
	}

	log(action: LoggerAction) {
		if ("start_run" === action.type) {
			this.#testActions.push(action);
			console.log("begin run");
		}

		if ("end_run" === action.type) {
			console.log("end run");
		}

		if ("start_collection" === action.type) {
			this.#testActions.push(action);
		}

		if ("collection_error" === action.type) {
			this.#errored = true;
			this.#testActions.push(action);
		}

		if ("start_module" === action.type) {
			this.#testActions.push(action);
		}

		if ("module_error" === action.type) {
			// this.#errored = true;
			this.#errored = true;
			this.#testActions.push(action);
		}

		if ("end_test" === action.type) {
			// move everything from null to undefined;
			let assertions = action.assertions ?? undefined;

			if (Array.isArray(assertions) && assertions.length) {
				this.#failed = true;
				this.#testActions.push(action);
			}
			if (!Array.isArray(assertions) && undefined !== assertions) {
				this.#failed = true;
				this.#testActions.push(action);
			}
		}

		if ("test_error" === action.type) {
			this.#errored = true;
			this.#testActions.push(action);
		}
	}
}

function logResults(data: LoggerData, time: number) {
	let status_with_color = data.failed
		? yellow("\u{2717} failed")
		: blue("\u{2714} passed");

	if (data.errored) {
		status_with_color = gray("\u{2717} errored");
	}

	const overhead = time - data.startTime;
	console.log(`Results:
${status_with_color}
  duration: ${data.testTime.toFixed(4)} mS
  overhead: ${overhead.toFixed(4)} mS`);
}

// 39 - default foreground color
// 49 - default background color
function blue(text: string) {
	return `\x1b[44m\x1b[97m${text}\x1b[0m`;
}

function yellow(text: string) {
	return `\x1b[43m\x1b[97m${text}\x1b[0m`;
}

function gray(text: string) {
	return `\x1b[100m\x1b[97m${text}\x1b[0m`;
}
