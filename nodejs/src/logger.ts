import type { LoggerAction, LoggerInterface } from "../../core/dist/mod.js";

interface LoggerData {
	errored: boolean;
	failed: boolean;
	startTime: number;
	endTime: number;
	testTime: number;
}

interface Receipts {
	runs: LoggerAction[];
	collections: LoggerAction[];
	modules: LoggerAction[];
	tests: LoggerAction[];
	testResults: LoggerAction[];
	errors: LoggerAction[];
}

interface TestResults {
	loggerStartAction: LoggerAction;
	loggerEndAction: LoggerAction | undefined;
}

interface ModuleResults {
	loggerAction: LoggerAction;
	tests: Map<number, TestResults>;
}

interface CollectionResults {
	loggerAction: LoggerAction;
	modules: Map<number, ModuleResults>;
}

type Results = Map<number, CollectionResults>;

export class Logger implements LoggerInterface {
	#receipts: Receipts = {
		runs: [],
		collections: [],
		modules: [],
		tests: [],
		testResults: [],
		errors: [],
	};

	#data = {
		errored: false,
		failed: false,
		startTime: 0,
		endTime: 0,
		testTime: 0,
	};

	get failed() {
		return this.#data.failed;
	}

	get errored() {
		return this.#data.errored;
	}

	log(action: LoggerAction) {
		if ("start_run" === action.type) {
			this.#data.startTime = action.time;
			this.#receipts.runs.push(action);
		}

		if ("end_run" === action.type) {
			this.#data.endTime = action.time;

			// buildResults
			logRun(this.#data, this.#receipts);
		}

		if ("start_collection" === action.type) {
			this.#receipts.collections.push(action);
		}

		if ("collection_error" === action.type) {
			this.#data.errored = true;
			this.#receipts.errors.push(action);
		}

		if ("start_module" === action.type) {
			this.#receipts.modules.push(action);
		}

		if ("module_error" === action.type) {
			this.#data.errored = true;
			this.#receipts.errors.push(action);
		}

		if ("start_test" === action.type) {
			this.#receipts.tests.push(action);
		}

		if ("end_test" === action.type) {
			this.#receipts.testResults.push(action);

			// move everything from null to undefined;
			let assertions = action.assertions ?? undefined;
			if (Array.isArray(assertions) && assertions.length) {
				this.#data.failed = true;
			}
			if (!Array.isArray(assertions) && undefined !== assertions) {
				this.#data.failed = true;
			}

			this.#data.testTime += Math.max(0, action.end_time - action.start_time);
		}

		if ("test_error" === action.type) {
			this.#data.errored = true;
			this.#receipts.errors.push(action);
		}
	}
}

function logRun(data: LoggerData, receipts: Receipts) {
	let status_with_color = data.failed
		? yellow("\u{2717} failed")
		: blue("\u{2714} passed");

	if (data.errored) {
		status_with_color = gray("\u{2717} errored");
	}

	let results = buildResults(receipts);
	logResults(results);

	const total = data.endTime - data.startTime;
	console.log(`Results:
${status_with_color}
  duration: ${data.testTime.toFixed(4)} mS
  total: ${total.toFixed(4)} mS`);
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

function buildResults(receipts: Receipts): Results {
	let results = new Map<number, CollectionResults>();

	for (let loggerAction of receipts.collections) {
		if ("start_collection" === loggerAction.type) {
			results.set(loggerAction.collection_id, {
				loggerAction,
				modules: new Map(),
			});
		}
	}

	for (let loggerAction of receipts.modules) {
		if ("start_module" === loggerAction.type) {
			let collection = results.get(loggerAction.collection_id);
			if (collection)
				collection.modules.set(loggerAction.module_id, {
					loggerAction,
					tests: new Map(),
				});
		}
	}

	for (let loggerAction of receipts.tests) {
		if ("start_test" === loggerAction.type) {
			let collection = results.get(loggerAction.collection_id);
			if (collection) {
				let module = collection.modules.get(loggerAction.collection_id);
				if (module)
					module.tests.set(loggerAction.test_id, {
						loggerStartAction: loggerAction,
						loggerEndAction: undefined,
					});
			}
		}
	}

	for (let loggerAction of receipts.testResults) {
		if (
			"end_test" === loggerAction.type ||
			"test_error" === loggerAction.type
		) {
			let collection = results.get(loggerAction.collection_id);
			if (collection) {
				let module = collection.modules.get(loggerAction.collection_id);
				if (module) {
					let testResult = module.tests.get(loggerAction.test_id);
					if (testResult) testResult.loggerEndAction = loggerAction;
				}
			}
		}
	}

	return results;
}

function logResults(results: Results) {}
