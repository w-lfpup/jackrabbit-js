import { SessionOptions } from "http2";
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

interface SessionResults {
	fails: number;
	errors: number;
	tests: number;
	startedTests: number;
	runs: Map<string, RunResults>;
}

// Session (chrome firefox etc)
//   Collection
//.    Modules
//.      Tests

export class Logger {
	#boundLog = this.#log.bind(this);

	#eventbus: EventBus;

	#results: SessionResults = {
		fails: 0,
		errors: 0,
		tests: 0,
		startedTests: 0,
		runs: new Map(),
	};

	constructor(config: ConfigInterface, eventbus: EventBus) {
		this.#eventbus = eventbus;
		// this.#eventbus.addListener("session_error", this.#boundLog);
		this.#eventbus.addListener("log", this.#boundLog);

		for (let webdriverParams of config.webdrivers) {
			this.#results.runs.set(webdriverParams.jrId, {
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
		return this.#results.fails !== 0;
	}

	get errored() {
		return this.#results.errors !== 0;
	}

	get results(): string {
		return getResultsAsString(this.#results);
	}

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

		let results = this.#results.runs.get(action.id);
		if (!results) return;

		let { loggerAction, id, urlStr } = action;

		if ("start_run" === loggerAction.type) {
			results.startTime = loggerAction.time;
		}

		if ("end_run" === loggerAction.type) {
			results.endTime = loggerAction.time;
			this.#eventbus.dispatchAction({
				type: "run_complete",
				id,
			});
		}

		if ("run_error" === loggerAction.type) {
		}

		if ("start_collection" === loggerAction.type) {
			// this.#results.collections.push(action);
			results.collections[loggerAction.collection_id] = {
				loggerAction,
				modules: [],
				fails: 0,
				errors: 0,
				tests: 0,
				startedTests: 0,
			};
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
					this.#results.startedTests += 1;
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
					this.#results.tests += 1;
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
						this.#results.fails += 1;
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
						this.#results.errors += 1;
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

function getResultsAsString(sessionResults: SessionResults): string {
	const output: string[] = [];

	for (let [index, result] of sessionResults.runs) {
		output.push(`
${result.webdriverParams.title}`);

		if (!result.fails && !result.errors) {
			output.push(`${result.tests} tests`);

			continue;
		}
		// if session has met requirements

		// * firefox
		//   43/43 tests
		//   7/7 modules
		//   3/3 collections
		//
		// * safari
		//   43/43 tests
		//   7/7 modules
		//   3/3 collections

		//	 chrome
		//   /djfksldjf
		//.    23/23 tests
		//.    3/3 modules
		//.  /kdiop9
		//.    x ModuleA
		//.        testName
		//.          - assertion
		//.

		for (const collection of result.collections) {
			if (!collection) continue;

			let { loggerAction } = collection;
			if ("start_collection" !== loggerAction.type) continue;

			output.push(`${loggerAction.collection_url}`);

			// if tests and started tests are === AND
			if (!collection.fails && !collection.errors) {
				output.push(
					`${collection.tests} tests
${loggerAction.expected_module_count} modules`,
				);

				continue;
			}

			for (const module of collection.modules) {
				if (!module) continue;

				let { loggerAction } = module;
				if ("start_module" !== loggerAction.type) continue;

				let delta = Math.max(0, module.tests - module.fails - module.errors);

				if (delta === loggerAction.expected_test_count) continue;
				output.push(
					`  ${loggerAction.module_name}  ${delta}/${loggerAction.expected_test_count}`,
				);

				for (const test of module.testResults) {
					if (!test) continue;

					let { loggerStartAction, loggerEndAction } = test;
					if ("start_test" !== loggerStartAction.type) continue;

					if ("test_error" === loggerEndAction?.type) {
						let { test_name } = loggerStartAction;
						output.push(
							`      ${test_name}\n      [error] ${loggerEndAction.error}`,
						);
					}

					if ("end_test" === loggerEndAction?.type) {
						let { assertions } = loggerEndAction;
						const isAssertionArray =
							Array.isArray(assertions) && assertions.length;
						const isAssertion =
							!Array.isArray(assertions) &&
							undefined !== assertions &&
							null !== assertions;

						if (isAssertion || isAssertionArray) {
							let { test_name } = loggerStartAction;
							output.push(`    ${test_name}`);
						}

						if (isAssertion) {
							output.push(`      - ${assertions}`);
						}

						if (isAssertionArray) {
							for (const assertion of assertions) {
								output.push(`      - ${assertion}`);
							}
						}
					}
				}
			}
		}
	}

	// 	let status_with_color = results.fails
	// 		? yellow("\u{2717} failed")
	// 		: blue("\u{2714} passed");

	// 	if (results.errors) {
	// 		status_with_color = gray("\u{2717} errored");
	// 	}

	// 	const total = results.endTime - results.startTime;
	// 	output.push(`
	// ${status_with_color}
	// duration: ${results.testTime.toFixed(4)} mS
	// total: ${total.toFixed(4)} mS
	// `);

	// failed
	// passed
	// errored
	// incomplete

	let status_with_color = sessionResults.fails
		? yellow("\u{2717} failed")
		: blue("\u{2714} passed");

	if (sessionResults.errors) {
		status_with_color = gray("\u{2717} errored");
	}

	let totalTime = 0;
	let testTime = 0;
	for (let [index, run] of sessionResults.runs) {
		totalTime += run.endTime - run.startTime;
		testTime += run.testTime;
	}
	output.push(`
${status_with_color}
duration: ${testTime.toFixed(4)} mS
total: ${totalTime.toFixed(4)} mS
`);

	return output.join("\n");
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
