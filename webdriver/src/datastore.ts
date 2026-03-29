import type { ChildProcess } from "child_process";
import type { ConfigInterface, WebdriverParams } from "./config.js";
import type {
	EventBusInterface,
	WebdriverLogAction,
	LogActions,
} from "./eventbus.js";

export interface TestResults {
	loggerStartAction: LogActions;
	loggerEndAction: LogActions | undefined;
}

export interface ModuleResults {
	loggerAction: LogActions;
	fails: number;
	errors: number;
	expectedTests: number;
	completedTests: number;
	errorLogs: LogActions[];
	testResults: (TestResults | undefined)[];
}

export interface CollectionResults {
	loggerAction: LogActions;
	fails: number;
	errors: number;
	expectedTests: number;
	completedTests: number;
	expectedModules: number;
	completedModules: number;
	errorLogs: LogActions[];
	modules: (ModuleResults | undefined)[];
}

export interface RunResults {
	sessionId: string | undefined;
	signal: AbortSignal | undefined;
	process: ChildProcess | undefined;
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
	errorLogs: LogActions[];
	webdriverParams: WebdriverParams;
	collections: (CollectionResults | undefined)[];
}

export interface SessionResults {
	fails: number;
	errors: number;
	runs: Map<string, RunResults>;
}

export class Datastore {
	#eventbus: EventBusInterface;

	#sessionResults: SessionResults = {
		fails: 0,
		errors: 0,
		runs: new Map(),
	};

	constructor(config: ConfigInterface, eventbus: EventBusInterface) {
		this.#eventbus = eventbus;
		this.#eventbus.addListener("log", this.#boundDispatch);

		for (let webdriverParams of config.webdrivers) {
			this.#sessionResults.runs.set(webdriverParams.jackrabbitId, {
				sessionId: undefined,
				signal: undefined,
				process: undefined,
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

	getState() {
		return this.#sessionResults;
	}

	#boundDispatch = this.#dispatch.bind(this);
	#dispatch(action: WebdriverLogAction) {
		let { loggerAction, jackrabbitId } = action;

		let runResults = this.#sessionResults.runs.get(jackrabbitId);
		if (!runResults) return;

		if ("session_synced" === loggerAction.type) {
			let { sessionId, process, signal } = loggerAction;
			runResults.sessionId = sessionId;
			runResults.process = process;
			runResults.signal = signal;
		}

		if ("session_error" === loggerAction.type) {
			runResults.sessionId = loggerAction.error;
		}

		if ("start_run" === loggerAction.type) {
			runResults.startTime = loggerAction.time;
			runResults.expectedCollections = loggerAction.expected_collection_count;
		}

		if ("end_run" === loggerAction.type) {
			runResults.endTime = loggerAction.time;
			this.#eventbus.dispatchAction({
				type: "run_complete",
				jackrabbitId,
			});
		}

		if ("run_error" === loggerAction.type) {
			this.#sessionResults.errors += 1;
			runResults.errors += 1;
			runResults.errorLogs.push(loggerAction);
		}

		if ("start_collection" === loggerAction.type) {
			runResults.collections[loggerAction.collection_id] = {
				completedModules: 0,
				completedTests: 0,
				errorLogs: [],
				errors: 0,
				expectedModules: loggerAction.expected_module_count,
				expectedTests: 0,
				fails: 0,
				loggerAction,
				modules: [],
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
				completedTests: 0,
				errorLogs: [],
				errors: 0,
				expectedTests: loggerAction.expected_test_count,
				fails: 0,
				loggerAction,
				testResults: [],
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

		if (endTest(this.#sessionResults, runResults, loggerAction)) return;

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

function endTest(
	sessionResults: SessionResults,
	runResults: RunResults,
	loggerAction: LogActions,
): boolean {
	if ("end_test" !== loggerAction.type) return false;

	let collection = runResults.collections[loggerAction.collection_id];
	if (!collection) return true;

	let module = collection.modules[loggerAction.module_id];
	if (!module) return true;

	let testResult = module.testResults[loggerAction.test_id];
	if (!testResult) return true;

	testResult.loggerEndAction = loggerAction;
	runResults.completedTests += 1;
	collection.completedTests += 1;
	module.completedTests += 1;

	let { assertions } = loggerAction;
	const isAssertionArray = Array.isArray(assertions) && assertions.length;
	// might be worth just sticking with language standard "none" like "" or 0 or false
	const isAssertion = !Array.isArray(assertions) && undefined !== assertions;
	if (isAssertion || isAssertionArray) {
		sessionResults.fails += 1;
		runResults.fails += 1;
		collection.fails += 1;
		module.fails += 1;
	}

	runResults.testTime += Math.max(
		0,
		loggerAction.end_time - loggerAction.start_time,
	);

	return true;
}
