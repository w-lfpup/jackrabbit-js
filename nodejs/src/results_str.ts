import type { LoggerAction } from "../../core/dist/mod.js";

export interface TestResults {
	loggerStartAction: LoggerAction;
	loggerEndAction: LoggerAction | undefined;
}

export interface ModuleResults {
	loggerAction: LoggerAction;
	fails: number;
	errors: number;
	expectedTests: number;
	completedTests: number;
	errorLogs: LoggerAction[];
	testResults: (TestResults | undefined)[];
}

export interface CollectionResults {
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

export interface RunResults {
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
	collections: (CollectionResults | undefined)[];
}

const SPACE = "  ";

export function getResultsAsString(runResults: RunResults): string {
	const output: string[] = [];

	for (let errorAction of runResults.errorLogs) {
		if ("run_error" !== errorAction.type) continue;
		output.push(`${SPACE}[session_error]\n${errorAction.error}`);
	}

	// Lots of nested loops because results a nested structure.
	// I'd rather see composition nested in one function
	// than have for loops spread across each function.

	if (!logRunResults(output, runResults))
		for (const collection of runResults.collections) {
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

	logSummary(output, runResults);

	return output.join("\n");
}

function logRunResults(output: string[], result: RunResults): boolean {
	// When everything goes right :3
	if (
		!result.fails &&
		!result.errors &&
		result.expectedTests === result.completedTests &&
		result.expectedModules === result.completedModules &&
		result.expectedCollections === result.completedCollections
	) {
		output.push(`${result.completedTests} tests
${result.completedModules} modules
${result.completedCollections} collections`);
		return true;
	}

	for (let errorAction of result.errorLogs) {
		if ("run_error" !== errorAction.type) continue;
		output.push(`[run_error] ${errorAction.error}`);
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

	output.push(`${loggerAction.collection_url}`);

	// when everything in the collection goes right
	if (
		!collection.fails &&
		!collection.errors &&
		collection.expectedTests === collection.completedTests &&
		collection.expectedModules === collection.completedModules
	) {
		output.push(
			`${SPACE}${collection.expectedTests} tests
${SPACE}${loggerAction.expected_module_count} modules`,
		);

		return true;
	}

	for (let errorAction of collection.errorLogs) {
		if ("collection_error" !== errorAction.type) continue;
		output.push(`${SPACE}[collection_error] ${errorAction.error}`);
	}

	return false;
}

function logModuleResult(
	output: string[],
	module: ModuleResults | undefined,
): boolean {
	if (!module) return true;

	let { loggerAction } = module;
	if ("start_module" !== loggerAction.type) return true;

	output.push(`${SPACE}${loggerAction.module_name}`);

	// when everything in the module goes right
	if (
		!module.fails &&
		!module.errors &&
		module.expectedTests === module.completedTests
	) {
		output.push(`${SPACE.repeat(2)}${module.expectedTests} tests`);
		return true;
	}

	for (let errorAction of module.errorLogs) {
		if ("collection_error" !== errorAction.type) continue;
		output.push(`${SPACE.repeat(2)}[module_error] ${errorAction.error}`);
	}

	return false;
}

function logTest(output: string[], test: TestResults | undefined) {
	if (!test) return;

	let { loggerStartAction, loggerEndAction } = test;
	if ("start_test" !== loggerStartAction.type) return;

	if ("test_error" === loggerEndAction?.type) {
		let { test_name } = loggerStartAction;
		output.push(
			`${SPACE.repeat(2)}${test_name}
${SPACE.repeat(3)}[error] ${loggerEndAction.error}`,
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
			output.push(`${SPACE.repeat(2)}${test_name}`);
		}

		if (isAssertion) {
			output.push(`${SPACE.repeat(3)}- ${assertions}`);
		}

		if (isAssertionArray) {
			for (const assertion of assertions) {
				output.push(`${SPACE.repeat(3)}- ${assertion}`);
			}
		}
	}
}

function logSummary(output: string[], runResults: RunResults) {
	let status_with_color = runResults.fails
		? yellow("\u{2717} failed")
		: blue("\u{2714} passed");

	if (runResults.errors) {
		status_with_color = gray("\u{2717} errored");
	}

	let totalTime = runResults.endTime - runResults.startTime;
	output.push(`
${status_with_color}
duration: ${runResults.testTime.toFixed(4)} mS
total: ${totalTime.toFixed(4)} mS
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
