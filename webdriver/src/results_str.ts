import type {
	SessionResults,
	RunResults,
	CollectionResults,
	ModuleResults,
	TestResults,
} from "./results.js";

const SPACE = "  ";

export function getResultsAsString(sessionResults: SessionResults): string {
	const output: string[] = [];

	// Lots of nested loops because results a nested structure.
	// I'd rather see composition nested in one function
	// than have for loops spread across each function.

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
	for (let [, result] of sessionResults.runs) {
		for (let errorAction of result.errorLogs) {
			if ("session_error" === errorAction.type) {
				output.push(
					`\n[${result.webdriverParams.title}:session_error] ${errorAction.error}`,
				);
			}
		}
	}
}

function logRunResults(output: string[], result: RunResults): boolean {
	output.push(`
${result.webdriverParams.title}`);

	for (let errorAction of result.errorLogs) {
		if ("log" === errorAction.type) {
			if ("run_error" === errorAction.loggerAction.type) {
				output.push(`${SPACE}[run_error] ${errorAction.loggerAction.error}`);
			}
		}
	}

	if (!result.expectedTests) {
		output.push(`  No teset runs occured.`)
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
}

function logSummary(output: string[], sessionResults: SessionResults) {
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
