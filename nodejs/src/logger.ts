import type { LoggerAction, LoggerInterface } from "../../core/dist/mod.js";

interface LoggerData {
	errors: number;
	fails: number;
	startTime: number;
	endTime: number;
	testTime: number;
}

interface Receipts {
	runData: LoggerData;
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
	collections: (CollectionResults | undefined)[];
}

// Make logger stack an array
// Can just add stuff as entries come in, no reed to save all the actions

export class Logger implements LoggerInterface {
	#results: RunResults = {
		startTime: 0,
		fails: 0,
		errors: 0,
		tests: 0,
		endTime: 0,
		testTime: 0,
		startedTests: 0,
		errorLogs: [],
		collections: [],
	};

	get failed() {
		return this.#results.fails !== 0;
	}

	get errored() {
		return this.#results.errors !== 0;
	}

	log(action: LoggerAction) {
		if ("start_run" === action.type) {
			this.#results.startTime = action.time;
		}

		if ("end_run" === action.type) {
			this.#results.endTime = action.time;
			console.log(getResultsAsString(this.#results));
		}

		if ("start_collection" === action.type) {
			// this.#results.collections.push(action);
			this.#results.collections[action.collection_id] = {
				loggerAction: action,
				modules: [],
				fails: 0,
				errors: 0,
				tests: 0,
				startedTests: 0,
			};
		}

		if ("collection_error" === action.type) {
			this.#results.errorLogs.push(action);
		}

		if ("start_module" === action.type) {
			let collection = this.#results.collections[action.collection_id];
			if (collection)
				collection.modules[action.module_id] = {
					loggerAction: action,
					testResults: [],
					fails: 0,
					tests: 0,
					errors: 0,
					startedTests: 0,
				};
		}

		if ("module_error" === action.type) {
			this.#results.errorLogs.push(action);
		}

		if ("start_test" === action.type) {
			// this.#results.tests.push(action);
			let collection = this.#results.collections[action.collection_id];
			if (collection) {
				let module = collection.modules[action.module_id];
				if (module) {
					this.#results.startedTests += 1;
					collection.startedTests += 1;
					module.startedTests += 1;
					module.testResults[action.test_id] = {
						loggerStartAction: action,
						loggerEndAction: undefined,
					};
				}
			}
		}

		if ("end_test" === action.type) {
			// move everything from null to undefined;
			let collection = this.#results.collections[action.collection_id];
			if (collection) {
				let module = collection.modules[action.module_id];
				if (module) {
					this.#results.tests += 1;
					collection.tests += 1;
					module.tests += 1;

					let testResult = module.testResults[action.test_id];
					if (testResult) testResult.loggerEndAction = action;

					let { assertions } = action;
					const isAssertionArray =
						Array.isArray(assertions) && assertions.length;
					// might be worth just sticking with language standard "none" like "" or 0 or false
					const isAssertion =
						!Array.isArray(assertions) &&
						undefined !== assertions &&
						null !== assertions;
					if (isAssertion || isAssertionArray) {
						this.#results.fails += 1;
						collection.fails += 1;
						module.fails += 1;
					}
				}
			}

			this.#results.testTime += Math.max(
				0,
				action.end_time - action.start_time,
			);
		}

		if ("test_error" === action.type) {
			let collection = this.#results.collections[action.collection_id];
			if (collection) {
				let module = collection.modules[action.module_id];
				if (module) {
					let testResult = module.testResults[action.test_id];
					if (testResult) testResult.loggerEndAction = action;

					let { error } = action;
					if (error) {
						this.#results.errors += 1;
						collection.errors += 1;
						module.errors += 1;
					}
				}
			}
		}
	}
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

function getResultsAsString(
	results: RunResults | undefined,
): string | undefined {
	if (!results) return;

	const output: string[] = [];

	for (const collection of results.collections) {
		if (!collection) continue;

		let { loggerAction } = collection;
		if ("start_collection" !== loggerAction.type) continue;

		output.push(`${loggerAction.collection_url}`);

		// if tests and started tests are === AND
		if (!collection.fails && !collection.errors) {
			output.push(
				`${loggerAction.expected_module_count} collections, ${collection.tests} tests`,
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

	let status_with_color = results.fails
		? yellow("\u{2717} failed")
		: blue("\u{2714} passed");

	if (results.errors) {
		status_with_color = gray("\u{2717} errored");
	}

	const total = results.endTime - results.startTime;
	output.push(`
${status_with_color}
duration: ${results.testTime.toFixed(4)} mS
total: ${total.toFixed(4)} mS
`);

	return output.join("\n");
}
