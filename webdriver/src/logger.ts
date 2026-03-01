import type {
	LoggerAction,
	LoggerInterface,
} from "../../core/dist/jackrabbit_types.js";
import type { ConfigInterface, WebdriverParams } from "./config.js";
import type { EventBus, WebdriverActions } from "./eventbus.js";

// A LOG Event would allow me to send actions
//

// log sync -> print out results as they happen
// log async -> save results print when all done

// need config for webdriver names and stuff

// need to track each web driver

interface TestResults {
	loggerStartAction: LoggerAction;
	loggerEndAction: LoggerAction | undefined;
}

interface ModuleResults {
	loggerAction: LoggerAction;
	fails: number;
	errors: number;
	tests: number;
	startedTests: number;
	testResults: (TestResults | undefined)[];
}

interface CollectionResults {
	loggerAction: LoggerAction;
	fails: number;
	errors: number;
	tests: number;
	startedTests: number;
	modules: (ModuleResults | undefined)[];
}

interface RunResults {
	startTime: number;
	fails: number;
	errors: number;
	tests: number;
	startedTests: number;
	endTime: number;
	errorLogs: LoggerAction[];
	testTime: number;
	webdriverParams: WebdriverParams;
	collections: (CollectionResults | undefined)[];
}

// Session (chrome firefox etc)
//   Collection
//.    Modules
//.      Tests

export class Logger {
	#boundLog = this.#log.bind(this);

	#eventbus: EventBus;

	#results: Map<string, RunResults> = new Map();

	constructor(config: ConfigInterface, eventbus: EventBus) {
		this.#eventbus = eventbus;
		// this.#eventbus.addListener("session_error", this.#boundLog);
		this.#eventbus.addListener("log", this.#boundLog);

		for (let webdriverParams of config.webdrivers) {
			this.#results.set(webdriverParams.jrId, {
				startTime: 0,
				fails: 0,
				errors: 0,
				tests: 0,
				endTime: 0,
				testTime: 0,
				errorLogs: [],
				startedTests: 0,
				webdriverParams,
				collections: [],
			});
		}
	}

	get failed() {
		// for any session did their run fail?
		for (let [, result] of this.#results) {
			if (result.fails) return true;
		}
	}

	get errored() {
		// for any session is their run errored?
		for (let [, result] of this.#results) {
			if (result.fails) return true;
		}
	}

	// get results(): string {
	// 	return getResultsAsString(this.#results);
	// }

	// get output
	// output being a array of a string

	#log(action: WebdriverActions) {
		// if ("session_start" === action.type) {
		// }
		// if ("session_closed" === action.type) {
		// }
		// if ("session_error" === action.type) {
		// }

		if ("log" !== action.type) return;

		let results = this.#results.get(action.id);
		if (!results) return;

		let { loggerAction, id, urlStr } = action;

		if ("start_run" === loggerAction.type) {
			results.startTime = loggerAction.time;
		}

		if ("end_run" === loggerAction.type) {
			this.#eventbus.dispatchAction({
				type: "run_complete",
				id,
			});
		}

		if ("run_error" === loggerAction.type) {
		}

		if ("start_module" === loggerAction.type) {
			let collection = results.collections[loggerAction.collection_id];
			if (collection)
				collection.modules[loggerAction.module_id] = {
					loggerAction,
					testResults: [],
					fails: 0,
					tests: 0,
					errors: 0,
					startedTests: 0,
				};
		}

		if ("end_module" === loggerAction.type) {
		}

		if ("module_error" === loggerAction.type) {
		}

		if ("start_test" === loggerAction.type) {
			let collection = results.collections[loggerAction.collection_id];
			if (collection) {
				let module = collection.modules[loggerAction.module_id];
				if (module) {
					results.startedTests += 1;
					collection.startedTests += 1;
					module.startedTests += 1;
					module.testResults[loggerAction.test_id] = {
						loggerStartAction: loggerAction,
						loggerEndAction: undefined,
					};
				}
			}
		}

		if ("end_test" === loggerAction.type) {
			let collection = results.collections[loggerAction.collection_id];
			if (collection) {
				let module = collection.modules[loggerAction.module_id];
				if (module) {
					results.tests += 1;
					collection.tests += 1;
					module.tests += 1;

					let testResult = module.testResults[loggerAction.test_id];
					if (testResult) testResult.loggerEndAction = loggerAction;

					let { assertions } = loggerAction;
					const isAssertionArray =
						Array.isArray(assertions) && assertions.length;
					// might be worth just sticking with language standard "none" like "" or 0 or false
					const isAssertion =
						!Array.isArray(assertions) &&
						undefined !== assertions &&
						null !== assertions;
					if (isAssertion || isAssertionArray) {
						results.fails += 1;
						collection.fails += 1;
						module.fails += 1;
					}
				}
			}

			results.testTime += Math.max(
				0,
				loggerAction.end_time - loggerAction.start_time,
			);
		}

		if ("test_error" === loggerAction.type) {
			let collection = results.collections[loggerAction.collection_id];
			if (collection) {
				let module = collection.modules[loggerAction.module_id];
				if (module) {
					let testResult = module.testResults[loggerAction.test_id];
					if (testResult) testResult.loggerEndAction = loggerAction;

					let { error } = loggerAction;
					if (error) {
						results.errors += 1;
						collection.errors += 1;
						module.errors += 1;
					}
				}
			}
		}

		if ("end_test" === loggerAction.type) {
		}
	}
}
