import type { WebdriverParams } from "./config.js";
import type { LogActions } from "./eventbus.js";

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

const SPACE = "  ";

/*
	Lots of nested loops because results is a nested structure.
	I'd rather see composition nested in one function
	than have for loops spread across each function.
*/

export function getResultsAsString(sessionResults: SessionResults): string {
	const output: string[] = [];

	logSessionErrors(output, sessionResults);

	for (let [, result] of sessionResults.runs) {
		if (logRunResults(output, result)) continue;

		for (const collection of result.collections) {
			if (logCollectionResult(output, collection)) continue;

			if (collection)
				for (const moduleResult of collection.modules) {
					if (logModuleResult(output, moduleResult)) continue;

					if (moduleResult)
						for (const testResult of moduleResult.testResults) {
							logTest(output, testResult);
						}
				}
		}
	}

	logSummary(output, sessionResults);

	return output.join("\n");
}

function logSessionErrors(output: string[], sessionResults: SessionResults) {
	if (!sessionResults.runs.size) output.push("\nNo webdrivers were run.");

	for (let [, result] of sessionResults.runs) {
		if (result.errorLogs.length)
			output.push(`\n${result.webdriverParams.title}`);
		for (let errorAction of result.errorLogs) {
			if ("session_error" === errorAction.type) {
				output.push(`${SPACE}[session_error] ${errorAction.error}`);
			}
		}
	}
}

function logRunResults(output: string[], result: RunResults): boolean {
	output.push(`\n${result.webdriverParams.title}`);

	for (let logAction of result.errorLogs) {
		if ("run_error" !== logAction.type) continue;

		output.push(`${SPACE.repeat(2)}[run_error] ${logAction.error}`);
	}
	if (result.errorLogs.length) output.push("");

	if (!result.collections && !result.expectedTests) {
		output.push(`${SPACE}No tests were run.`);
		return true;
	}

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
		return true;
	}

	return false;
}

function logCollectionResult(
	output: string[],
	collection: CollectionResults | undefined,
): boolean {
	if (!collection) return true;

	let { loggerAction } = collection;
	if ("start_collection" !== loggerAction.type) return true;

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

		return true;
	}

	for (let errorAction of collection.errorLogs) {
		if ("collection_error" !== errorAction.type) continue;
		output.push(`${SPACE.repeat(2)}[collection_error] ${errorAction.error}`);
	}

	if (collection.errorLogs.length) output.push("");

	return false;
}

function logModuleResult(
	output: string[],
	module: ModuleResults | undefined,
): boolean {
	if (!module) return true;

	let { loggerAction } = module;
	if ("start_module" !== loggerAction.type) return true;

	output.push(`${SPACE.repeat(2)}${loggerAction.module_name}`);

	// when everything in the module goes right
	if (
		!module.fails &&
		!module.errors &&
		module.expectedTests === module.completedTests
	) {
		output.push(`${SPACE.repeat(3)}${module.expectedTests} tests`);
		return true;
	}

	output.push(
		`${SPACE.repeat(3)}${module.completedTests - module.fails}/${module.expectedTests} tests`,
	);

	output.push("");
	for (let errorAction of module.errorLogs) {
		if ("module_error" !== errorAction.type) continue;
		output.push(`${SPACE.repeat(3)}[module_error] ${errorAction.error}`);
	}

	if (module.errorLogs.length) output.push("");

	return false;
}

function logTest(output: string[], test: TestResults | undefined) {
	if (!test) return;

	let { loggerStartAction, loggerEndAction } = test;
	if ("start_test" !== loggerStartAction.type) return;

	if ("test_error" === loggerEndAction?.type) {
		let { test_name } = loggerStartAction;
		output.push(
			`${SPACE.repeat(3)}${test_name}
${SPACE.repeat(4)}[error] ${loggerEndAction.error}`,
		);
	}

	if ("end_test" === loggerEndAction?.type) {
		let { assertions } = loggerEndAction;
		const isAssertionArray = Array.isArray(assertions) && assertions.length;
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

	if (undefined === loggerEndAction) {
		let { test_name } = loggerStartAction;

		output.push(`${SPACE.repeat(3)}${test_name}
${SPACE.repeat(4)}[incomplete]`);
	}
}

function logSummary(output: string[], sessionResults: SessionResults) {
	let status_with_color = blue("\u{2714} passed");

	if (!isComplete(sessionResults))
		status_with_color = gray("\u{2717} incomplete");
	if (sessionResults.fails) status_with_color = yellow("\u{2717} failed");
	if (sessionResults.errors) status_with_color = gray("\u{2717} errored");

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
}

export function isComplete(sessionResults: SessionResults): boolean {
	for (const [, result] of sessionResults.runs) {
		if (
			!result.expectedTests ||
			!result.expectedModules ||
			!result.expectedCollections
		)
			return false;
		if (
			result.expectedTests !== result.completedTests ||
			result.expectedModules !== result.completedModules ||
			result.expectedCollections !== result.completedCollections
		)
			return false;
	}

	return true;
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
