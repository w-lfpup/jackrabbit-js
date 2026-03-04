import type { ConfigInterface } from "./config.js";
import type {
	EventBus,
	WebdriverLogAction,
	WebdriverSessionErrorAction,
} from "./eventbus.js";
import type { SessionResults } from "./results.js";

import { getResultsAsString } from "./results_str.js";

export class Logger {
	#eventbus: EventBus;

	#sessionResults: SessionResults = {
		fails: 0,
		errors: 0,
		errorLogs: [],
		runs: new Map(),
	};

	constructor(config: ConfigInterface, eventbus: EventBus) {
		this.#eventbus = eventbus;
		this.#eventbus.addListener("log", this.#boundLog);
		this.#eventbus.addListener("session_error", this.#boundError);

		for (let webdriverParams of config.webdrivers) {
			this.#sessionResults.runs.set(webdriverParams.jrId, {
				startTime: 0,
				fails: 0,
				errors: 0,
				expectedTests: 0,
				expectedModules: 0,
				endTime: 0,
				testTime: 0,
				errorLogs: [],
				completedTests: 0,
				completedModules: 0,
				expectedCollections: 0,
				completedCollections: 0,
				webdriverParams,
				collections: [],
			});
		}
	}

	get failed() {
		return this.#sessionResults.fails !== 0;
	}

	get errored() {
		return this.#sessionResults.errors !== 0;
	}

	// get completed() {}

	get results(): string {
		return getResultsAsString(this.#sessionResults);
	}

	// get output
	// output being a array of a string
	#boundError = this.#onError.bind(this);
	#onError(action: WebdriverSessionErrorAction) {
		if ("session_error" === action.type) {
			this.#sessionResults.errors += 1;
			this.#sessionResults.errorLogs.push(action);
		}
	}

	#boundLog = this.#onLog.bind(this);
	#onLog(action: WebdriverLogAction) {
		let { loggerAction, id } = action;

		let runResults = this.#sessionResults.runs.get(id);
		if (!runResults) return;

		if ("start_run" === loggerAction.type) {
			runResults.startTime = loggerAction.time;
			runResults.expectedCollections = loggerAction.expected_collection_count;
		}

		if ("end_run" === loggerAction.type) {
			runResults.endTime = loggerAction.time;
			this.#eventbus.dispatchAction({
				type: "run_complete",
				id,
			});
		}

		if ("run_error" === loggerAction.type) {
			this.#sessionResults.errors += 1;
			runResults.errors += 1;
			runResults.errorLogs.push(loggerAction);
		}

		if ("start_collection" === loggerAction.type) {
			runResults.collections[loggerAction.collection_id] = {
				loggerAction,
				modules: [],
				errorLogs: [],
				fails: 0,
				errors: 0,
				expectedModules: loggerAction.expected_module_count,
				completedModules: 0,
				expectedTests: 0,
				completedTests: 0,
			};

			runResults.expectedModules += loggerAction.expected_module_count;
		}

		if ("end_collection" === loggerAction.type) {
			let collection = runResults.collections[loggerAction.collection_id];
			if (!collection) return;

			runResults.completedCollections += 1;
		}

		if ("collection_error" === loggerAction.type) {
			let collection = runResults.collections[loggerAction.collection_id];
			if (!collection) return;

			this.#sessionResults.errors += 1;
			runResults.errors += 1;
			collection.errors += 1;

			collection.errorLogs.push(loggerAction);
		}

		if ("start_module" === loggerAction.type) {
			let collection = runResults.collections[loggerAction.collection_id];
			if (!collection) return;

			collection.modules[loggerAction.module_id] = {
				loggerAction,
				testResults: [],
				errorLogs: [],
				fails: 0,
				expectedTests: loggerAction.expected_test_count,
				errors: 0,
				completedTests: 0,
			};

			collection.expectedTests += loggerAction.expected_test_count;
			runResults.expectedTests += loggerAction.expected_test_count;
		}

		if ("end_module" === loggerAction.type) {
			let collection = runResults.collections[loggerAction.collection_id];
			if (!collection) return;

			let module = collection.modules[loggerAction.module_id];
			if (!module) return;

			runResults.completedModules += 1;
			collection.completedModules += 1;
		}

		if ("module_error" === loggerAction.type) {
			let collection = runResults.collections[loggerAction.collection_id];
			if (!collection) return;

			let module = collection.modules[loggerAction.module_id];
			if (!module) return;

			this.#sessionResults.errors += 1;
			runResults.errors += 1;
			collection.errors += 1;
			module.errors += 1;
			module.errorLogs.push(loggerAction);
		}

		if ("start_test" === loggerAction.type) {
			let collection = runResults.collections[loggerAction.collection_id];
			if (!collection) return;

			let module = collection.modules[loggerAction.module_id];
			if (!module) return;

			module.testResults[loggerAction.test_id] = {
				loggerStartAction: loggerAction,
				loggerEndAction: undefined,
			};
		}

		if ("end_test" === loggerAction.type) {
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
			const isAssertion =
				!Array.isArray(assertions) &&
				undefined !== assertions &&
				null !== assertions;
			if (isAssertion || isAssertionArray) {
				this.#sessionResults.fails += 1;
				runResults.fails += 1;
				collection.fails += 1;
				module.fails += 1;
			}

			runResults.testTime += Math.max(
				0,
				loggerAction.end_time - loggerAction.start_time,
			);
		}

		if ("test_error" === loggerAction.type) {
			let collection = runResults.collections[loggerAction.collection_id];
			if (!collection) return;

			let module = collection.modules[loggerAction.module_id];
			if (!module) return;

			let testResult = module.testResults[loggerAction.test_id];
			if (!testResult) return;

			testResult.loggerEndAction = loggerAction;
			this.#sessionResults.errors += 1;
			runResults.errors += 1;
			collection.errors += 1;
			module.errors += 1;
		}
	}
}
