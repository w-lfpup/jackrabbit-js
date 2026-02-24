import { Assertions } from "../../core/dist/jackrabbit_types.js";
import type { LoggerAction, LoggerInterface } from "../../core/dist/mod.js";

interface LoggerData {
	errored: boolean;
	failed: boolean;
	startTime: number;
	endTime: number;
	testTime: number;
}

interface TestReceipt {
	title: string;
	assertions: Assertions;
	error: string | undefined;
}

interface ModuleReceipt {
	title: string;
	error: string | undefined;
	numberOfTests: number;
	testReceipts: (TestReceipt | undefined)[];
}

interface CollectionReceipt {
	title: string;
	error: string | undefined;
	numberOfModules: number;
	moduleReceipts: (ModuleReceipt | undefined)[];
}

export class Logger implements LoggerInterface {
	#failed: boolean = false;
	#errored: boolean = false;

	#collectionReceipts: CollectionReceipt[] = [];

	#data = {
		errored: false,
		failed: false,
		startTime: 0,
		endTime: 0,
		testTime: 0,
	};

	get failed() {
		return this.#failed;
	}

	get errored() {
		return this.#errored;
	}

	log(action: LoggerAction) {
		if ("start_run" === action.type) {
			this.#data.startTime = action.time;
			this.#collectionReceipts = new Array(action.expected_collection_count);
		}

		if ("end_run" === action.type) {
			console.log("end run");
			this.#data.endTime = action.time;
			logResults(this.#data, this.#collectionReceipts);
			// log results
			// iterate through logs and build an object
		}

		if ("start_collection" === action.type) {
			this.#collectionReceipts[action.collection_id] = {
				title: action.collection_url,
				numberOfModules: action.expected_module_count,
				moduleReceipts: new Array(action.expected_module_count),
				error: undefined,
			};
		}

		if ("collection_error" === action.type) {
			this.#errored = true;
			let receipt = this.#collectionReceipts[action.collection_id];
			if (receipt) {
				receipt.error = action.error;
			}
		}

		if ("start_module" === action.type) {
			let moduleReceipts =
				this.#collectionReceipts[action.collection_id]?.moduleReceipts;
			if (moduleReceipts) {
				moduleReceipts[action.module_id] = {
					title: action.module_name,
					numberOfTests: action.expected_test_count,
					testReceipts: new Array(action.expected_test_count),
					error: undefined,
				};
			}
		}

		if ("module_error" === action.type) {
			this.#errored = true;
			let receipt =
				this.#collectionReceipts[action.collection_id]?.moduleReceipts?.[
					action.module_id
				];
			if (receipt) {
				receipt.error = action.error;
			}
		}

		if ("start_test" === action.type) {
			let testReceipt =
				this.#collectionReceipts[action.collection_id]?.moduleReceipts[
					action.module_id
				]?.testReceipts;
			if (testReceipt) {
				testReceipt[action.test_id] = {
					title: action.test_name,
					assertions: undefined,
					error: undefined,
				};
			}
		}

		if ("end_test" === action.type) {
			let testReceipt =
				this.#collectionReceipts[action.collection_id]?.moduleReceipts[
					action.module_id
				]?.testReceipts?.[action.test_id];
			if (!testReceipt) return;

			// move everything from null to undefined;
			let assertions = action.assertions ?? undefined;
			if (Array.isArray(assertions) && assertions.length) {
				this.#failed = true;
			}
			if (!Array.isArray(assertions) && undefined !== assertions) {
				this.#failed = true;
			}

			testReceipt.assertions = assertions;
			this.#data.testTime += Math.max(0, action.end_time - action.start_time);
		}

		if ("test_error" === action.type) {
			this.#errored = true;

			let testReceipt =
				this.#collectionReceipts[action.collection_id]?.moduleReceipts[
					action.module_id
				]?.testReceipts?.[action.test_id];
			if (!testReceipt) return;

			testReceipt.error = action.error;
		}
	}
}

function logResults(data: LoggerData, collectionReceipts: CollectionReceipt[]) {
	let status_with_color = data.failed
		? yellow("\u{2717} failed")
		: blue("\u{2714} passed");

	if (data.errored) {
		status_with_color = gray("\u{2717} errored");
	}

	const overhead = data.endTime - data.startTime;
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
