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
	loggerAction: LoggerAction;
	fails: number;
	errors: number;
	tests: number;
	startedTests: number;
	collections: (CollectionResults | undefined)[];
}

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
			if (
				!Array.isArray(assertions) &&
				undefined !== assertions &&
				null !== assertions
			) {
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
	console.log(`
${status_with_color}
duration: ${data.testTime.toFixed(4)} mS
total: ${total.toFixed(4)} mS
`);
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

function buildResults(receipts: Receipts): RunResults | undefined {
	let runAction = receipts.runs[0];
	if (!runAction) return;

	let results: RunResults = {
		loggerAction: runAction,
		fails: 0,
		errors: 0,
		tests: 0,
		startedTests: 0,
		collections: [],
	};

	for (let loggerAction of receipts.collections) {
		if ("start_collection" === loggerAction.type) {
			results.collections[loggerAction.collection_id] = {
				loggerAction,
				modules: [],
				fails: 0,
				errors: 0,
				tests: 0,
				startedTests: 0,
			};
		}
	}

	for (let loggerAction of receipts.modules) {
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
	}

	for (let loggerAction of receipts.tests) {
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
	}

	// this is where we declare collections or modules have failed
	for (let loggerAction of receipts.testResults) {
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
	}

	return results;
}

function logResults(results: RunResults | undefined) {
	if (!results) return;

	const output: string[] = [];

	// need to have a "result string" that we add to whenever new stuff is uncovered

	// couple functions
	// one iterate through tests and create an array of strings

	for (const collection of results.collections) {
		if (!collection) continue;

		let { loggerAction } = collection;
		if ("start_collection" !== loggerAction.type) continue;

		console.log(`${loggerAction.collection_url}`);

		// if tests and started tests are === AND
		if (!collection.fails && !collection.errors) {
			console.log(
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
			console.log(
				`  ${loggerAction.module_name}  ${delta}/${loggerAction.expected_test_count}`,
			);

			for (const test of module.testResults) {
				if (test) {
					let { loggerStartAction, loggerEndAction } = test;

					if ("start_test" === loggerStartAction.type) {
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
								console.log(`    ${test_name}`);
							}

							if (isAssertion) {
								console.log(`      - ${assertions}`);
							}

							if (isAssertionArray) {
								for (const assertion of assertions) {
									console.log(`      - ${assertion}`);
								}
							}
						}

						if ("test_error" === loggerEndAction?.type) {
							let { test_name } = loggerStartAction;
							console.log(
								`      ${test_name}\n      error:\n      ${loggerEndAction.error}`,
							);
						}
					}
				}
			}
		}
	}
}
