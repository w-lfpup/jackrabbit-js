import type { LoggerAction } from "../../core/dist/jackrabbit_types.js";
import type { ConfigInterface, WebdriverParams } from "./config.js";
import type {
	EventBus,
	WebdriverActions,
	WebdriverLogAction,
	WebdriverSessionErrorAction,
} from "./eventbus.js";

interface TestResults {
	loggerStartAction: LoggerAction;
	loggerEndAction: LoggerAction | undefined;
}

// remove logger actions
interface ModuleResults {
	loggerAction: LoggerAction;
	fails: number;
	errors: number;
	expectedTests: number;
	completedTests: number;
	errorLogs: LoggerAction[];
	testResults: (TestResults | undefined)[];
}

interface CollectionResults {
	loggerAction: LoggerAction;
	fails: number;
	errors: number;
	expectedTests: number;
	completedTests: number;
	expectedModules: number;
	completedModules: number;
	errorLogs: LoggerAction[];
	modules: (ModuleResults | undefined)[];
}

interface RunResults {
	fails: number;
	errors: number;
	startTime: number;
	endTime: number;
	testTime: number;
	expectedTests: number;
	completedTests: number;
	expectedModules: number;
	completedModules: number;
	expectedCollections: number;
	completedCollections: number;
	errorLogs: LoggerAction[];
	webdriverParams: WebdriverParams;
	collections: (CollectionResults | undefined)[];
}

// track if session started or not
// if browser never launched
interface SessionResults {
	fails: number;
	errors: number;
	errorLogs: WebdriverActions[];
	runs: Map<string, RunResults>;
}


const SPACE = "  ";


export class Logger {
	#eventbus: EventBus;

	#results: SessionResults = {
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
			this.#results.runs.set(webdriverParams.jrId, {
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
		return this.#results.fails !== 0;
	}

	get errored() {
		return this.#results.errors !== 0;
	}

	// get completed() {}

	get results(): string {
		return getResultsAsString(this.#results);
	}

	// get output
	// output being a array of a string
	#boundError = this.#onError.bind(this);
	#onError(action: WebdriverSessionErrorAction) {
		if ("session_error" === action.type) {
			this.#results.errors += 1;
			this.#results.errorLogs.push(action);
		}
	}

	#boundLog = this.#onLog.bind(this);
	#onLog(action: WebdriverLogAction) {
		let results = this.#results.runs.get(action.id);
		if (!results) return;

		let { loggerAction, id } = action;

		if ("start_run" === loggerAction.type) {
			results.startTime = loggerAction.time;
			results.expectedCollections = loggerAction.expected_collection_count;
		}

		if ("end_run" === loggerAction.type) {
			results.endTime = loggerAction.time;
			this.#eventbus.dispatchAction({
				type: "run_complete",
				id,
			});
		}

		if ("run_error" === loggerAction.type) {
			this.#results.errors += 1;
			results.errors += 1;
			results.errorLogs.push(loggerAction);
		}

		if ("start_collection" === loggerAction.type) {
			results.collections[loggerAction.collection_id] = {
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

			results.expectedModules += loggerAction.expected_module_count;
		}

		if ("end_collection" === loggerAction.type) {
			let collection = results.collections[loggerAction.collection_id];
			if (!collection) return;

			results.completedCollections += 1;
		}

		if ("collection_error" === loggerAction.type) {
			let collection = results.collections[loggerAction.collection_id];
			if (!collection) return;

			this.#results.errors += 1;
			results.errors += 1;
			collection.errors += 1;

			collection.errorLogs.push(loggerAction);
		}

		if ("start_module" === loggerAction.type) {
			let collection = results.collections[loggerAction.collection_id];
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
			results.expectedTests += loggerAction.expected_test_count;
		}

		if ("end_module" === loggerAction.type) {
			let collection = results.collections[loggerAction.collection_id];
			if (!collection) return;

			let module = collection.modules[loggerAction.module_id];
			if (!module) return;

			results.completedModules += 1;
			collection.completedModules += 1;
		}

		if ("module_error" === loggerAction.type) {
			let collection = results.collections[loggerAction.collection_id];
			if (!collection) return;

			let module = collection.modules[loggerAction.module_id];
			if (!module) return;

			this.#results.errors += 1;
			results.errors += 1;
			collection.errors += 1;
			module.errors += 1;
			module.errorLogs.push(loggerAction);
		}

		if ("start_test" === loggerAction.type) {
			let collection = results.collections[loggerAction.collection_id];
			if (!collection) return;

			let module = collection.modules[loggerAction.module_id];
			if (!module) return;

			module.testResults[loggerAction.test_id] = {
				loggerStartAction: loggerAction,
				loggerEndAction: undefined,
			};
		}

		if ("end_test" === loggerAction.type) {
			let collection = results.collections[loggerAction.collection_id];
			if (!collection) return;

			let module = collection.modules[loggerAction.module_id];
			if (!module) return;

			let testResult = module.testResults[loggerAction.test_id];
			if (!testResult) return;

			testResult.loggerEndAction = loggerAction;
			results.completedTests += 1;
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
				this.#results.fails += 1;
				results.fails += 1;
				collection.fails += 1;
				module.fails += 1;
			}

			results.testTime += Math.max(
				0,
				loggerAction.end_time - loggerAction.start_time,
			);
		}

		if ("test_error" === loggerAction.type) {
			let collection = results.collections[loggerAction.collection_id];
			if (!collection) return;

			let module = collection.modules[loggerAction.module_id];
			if (!module) return;

			let testResult = module.testResults[loggerAction.test_id];
			if (!testResult) return;

			testResult.loggerEndAction = loggerAction;
			this.#results.errors += 1;
			results.errors += 1;
			collection.errors += 1;
			module.errors += 1;
		}
	}
}

function getResultsAsString(sessionResults: SessionResults): string {
	const output: string[] = [];


	for (let errorAction of sessionResults.errorLogs) {
		if ("session_error" !== errorAction.type) continue;
		output.push(`${SPACE}[session_error]\n${errorAction.error}`);
	}

	for (let [index, result] of sessionResults.runs) {
		output.push(`
${result.webdriverParams.title}`);

		// When everything goes right :3
		if (
			!result.fails &&
			!result.errors &&
			result.expectedTests === result.completedTests &&
			result.expectedModules === result.completedModules &&
			result.expectedCollections === result.completedCollections
		) {
			output.push(`${SPACE}${result.completedTests} tests
${SPACE}${result.completedModules} modules
${SPACE}${result.completedCollections} collections`);
			continue;
		}

		for (let errorAction of result.errorLogs) {
			if ("run_error" !== errorAction.type) continue;
			output.push(`${SPACE}[run_error] ${errorAction.error}`);
		}

		for (const collection of result.collections) {
			if (!collection) continue;

			let { loggerAction } = collection;
			if ("start_collection" !== loggerAction.type) continue;

			output.push(`${SPACE}${loggerAction.collection_url}`);

			// when everything in the collection goes right
			if (
				!collection.fails &&
				!collection.errors &&
				collection.expectedTests === collection.completedTests &&
				collection.expectedModules === collection.completedModules
			) {
				output.push(
					`${SPACE.repeat(2)}${collection.expectedTests} tests
${SPACE.repeat(2)}${loggerAction.expected_module_count} modules`,
				);

				continue;
			}

			for (let errorAction of collection.errorLogs) {
				if ("collection_error" !== errorAction.type) continue;
				output.push(
					`${SPACE.repeat(2)}[collection_error] ${errorAction.error}`,
				);
			}

			for (const module of collection.modules) {
				if (!module) continue;

				let { loggerAction } = module;
				if ("start_module" !== loggerAction.type) continue;

				output.push(`${SPACE.repeat(2)}${loggerAction.module_name}`);

				// when everything in the module goes right
				if (
					!module.fails &&
					!module.errors &&
					module.expectedTests === module.completedTests
				) {
					output.push(`${SPACE.repeat(3)}${collection.expectedTests} tests`);
					continue;
				}

				for (let errorAction of module.errorLogs) {
					if ("collection_error" !== errorAction.type) continue;
					output.push(`${SPACE.repeat(2)}[module_error] ${errorAction.error}`);
				}

				for (const test of module.testResults) {
					if (!test) continue;

					let { loggerStartAction, loggerEndAction } = test;
					if ("start_test" !== loggerStartAction.type) continue;

					if ("test_error" === loggerEndAction?.type) {
						let { test_name } = loggerStartAction;
						output.push(
							`${SPACE.repeat(3)}${test_name}
${SPACE.repeat(4)}[error] ${loggerEndAction.error}`,
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
							output.push(`${SPACE.repeat(3)}${test_name}`);
						}

						if (isAssertion) {
							output.push(`${SPACE.repeat(4)}- ${assertions}`);
						}

						if (isAssertionArray) {
							for (const assertion of assertions) {
								output.push(`${SPACE.repeat(4)}- ${assertion}`);
							}
						}
					}
				}
			}
		}
	}

	let status_with_color = sessionResults.fails
		? yellow("\u{2717} failed")
		: blue("\u{2714} passed");

	if (sessionResults.errors) {
		status_with_color = gray("\u{2717} errored");
	}

	let totalTime = 0;
	let testTime = 0;
	for (let [, run] of sessionResults.runs) {
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
