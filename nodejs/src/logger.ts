import type {
	LoggerAction,
	LoggerInterface,
	EndTest,
} from "../../core/dist/mod.js";
import type { RunResults } from "./results_str.js";

import { getResultsAsString } from "./results_str.js";

export class Logger implements LoggerInterface {
	#results: RunResults = {
		startTime: 0,
		fails: 0,
		errors: 0,
		expectedTests: 0,
		endTime: 0,
		testTime: 0,
		expectedModules: 0,
		expectedCollections: 0,
		completedModules: 0,
		completedCollections: 0,
		completedTests: 0,
		errorLogs: [],
		collections: [],
	};

	get failed() {
		return this.#results.fails !== 0;
	}

	get errored() {
		return this.#results.errors !== 0;
	}

	get results(): string {
		return getResultsAsString(this.#results);
	}

	log(action: LoggerAction) {
		if ("start_run" === action.type) {
			this.#results.startTime = action.time;
			this.#results.expectedCollections = action.expected_collection_count;
		}

		if ("end_run" === action.type) {
			this.#results.endTime = action.time;
		}

		if ("run_error" === action.type) {
			this.#results.errors += 1;
			this.#results.errorLogs.push(action);
		}

		if ("start_collection" === action.type) {
			this.#results.collections[action.collection_id] = {
				completedModules: 0,
				completedTests: 0,
				errorLogs: [],
				errors: 0,
				expectedModules: action.expected_module_count,
				expectedTests: 0,
				fails: 0,
				loggerAction: action,
				modules: [],
			};

			this.#results.expectedModules += action.expected_module_count;
		}

		if ("end_collection" === action.type) {
			let collection = this.#results.collections[action.collection_id];
			if (!collection) return;

			this.#results.completedCollections += 1;
		}

		if ("collection_error" === action.type) {
			let collection = this.#results.collections[action.collection_id];
			if (!collection) return;

			this.#results.errors += 1;
			collection.errors += 1;

			collection.errorLogs.push(action);
		}

		if ("start_module" === action.type) {
			let collection = this.#results.collections[action.collection_id];
			if (!collection) return;

			collection.modules[action.module_id] = {
				completedTests: 0,
				errorLogs: [],
				errors: 0,
				expectedTests: action.expected_test_count,
				fails: 0,
				loggerAction: action,
				testResults: [],
			};

			collection.expectedTests += action.expected_test_count;
			this.#results.expectedTests += action.expected_test_count;
		}

		if ("end_module" === action.type) {
			let collection = this.#results.collections[action.collection_id];
			if (!collection) return;

			let module = collection.modules[action.module_id];
			if (!module) return;

			this.#results.completedModules += 1;
			collection.completedModules += 1;
		}

		if ("module_error" === action.type) {
			let collection = this.#results.collections[action.collection_id];
			if (!collection) return;

			let module = collection.modules[action.module_id];
			if (!module) return;

			this.#results.errors += 1;
			collection.errors += 1;
			module.errors += 1;
			module.errorLogs.push(action);
		}

		if ("start_test" === action.type) {
			let collection = this.#results.collections[action.collection_id];
			if (!collection) return;

			let module = collection.modules[action.module_id];
			if (!module) return;

			module.testResults[action.test_id] = {
				loggerStartAction: action,
				loggerEndAction: undefined,
			};
		}

		if ("end_test" === action.type) {
			endTest(this.#results, action);
		}

		if ("test_error" === action.type) {
			let collection = this.#results.collections[action.collection_id];
			if (!collection) return;

			let module = collection.modules[action.module_id];
			if (!module) return;

			let testResult = module.testResults[action.test_id];
			if (!testResult) return;

			testResult.loggerEndAction = action;
			this.#results.errors += 1;
			collection.errors += 1;
			module.errors += 1;
		}
	}
}

function endTest(runResults: RunResults, loggerAction: EndTest) {
	let collection = runResults.collections[loggerAction.collection_id];
	if (!collection) return;

	let module = collection.modules[loggerAction.module_id];
	if (!module) return;

	let testResult = module.testResults[loggerAction.test_id];
	if (!testResult) return;

	testResult.loggerEndAction = loggerAction;
	runResults.completedTests += 1;
	collection.completedTests += 1;
	module.completedTests += 1;

	let { assertions } = loggerAction;
	const isAssertionArray = Array.isArray(assertions) && assertions.length;
	// might be worth just sticking with language standard "none" like "" or 0 or false
	const isAssertion = !Array.isArray(assertions) && undefined !== assertions;
	if (isAssertion || isAssertionArray) {
		runResults.fails += 1;
		collection.fails += 1;
		module.fails += 1;
	}

	runResults.testTime += Math.max(
		0,
		loggerAction.end_time - loggerAction.start_time,
	);
}
