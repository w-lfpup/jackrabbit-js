import type { LoggerAction, LoggerInterface } from "../../core/dist/mod.js";

/**
 * TODO(taylorvann):
 *
 * Logging tests in order is not a priority.
 * I will come back to it when I feel like it.
 */

interface LoggerData {
	errored: boolean;
	failed: boolean;
	startTime: number;
	testTime: number;
}

interface ModuleReceipt {
	title: string;
	assertions: LoggerAction[];
}

interface CollectionReceipt {
	title: string;
	numberOfTest: number;
	numberOfFails: number;
	numberOfErrors: number;
	moduleReceipts: ModuleReceipt[];
}

export class Logger implements LoggerInterface {
	#data: LoggerData = {
		failed: false,
		errored: false,
		startTime: 0,
		testTime: 0,
	};

	#collectionReceipts: (CollectionReceipt | undefined)[] = [];

	get failed() {
		return this.#data.failed;
	}

	get errored() {
		return this.#data.errored;
	}

	log(action: LoggerAction) {
		// if ("start_run" === action.type) {
		// 	this.#data.startTime = action.time;
		// }

		if ("start_run" === action.type) {
			// verify two properties are correct type first
			this.#collectionReceipts = new Array(action.expected_collection_count);
			this.#data.startTime = action.time;
		}

		if ("start_collection" === action.type) {
			// create collection receipts
			this.#collectionReceipts[action.collection_id] = {
				title: action.collection_url,
				numberOfTest: 0,
				numberOfFails: 0,
				numberOfErrors: 0,
				moduleReceipts: new Array(action.expected_module_count),
			};
		}

		if ("start_module" === action.type) {
			// create test receipts
			let moduleReceipts =
				this.#collectionReceipts[action.collection_id]?.moduleReceipts;
			if (moduleReceipts) {
				moduleReceipts[action.module_id] = {
					title: action.module_name,
					assertions: [],
				};
			}
		}

		if ("module_error" === action.type) {
		}

		if ("end_test" === action.type) {
		}

		if ("test_error" === action.type) {
		}

		if ("end_run" === action.type) {
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
