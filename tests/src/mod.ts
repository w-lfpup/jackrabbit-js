import * as FailTests from "./test_fail.test.js";
import * as PassTests from "./test_pass.test.js";
import * as ErrorTests from "./test_error.test.js";

import { startRun } from "../../core/dist/mod.js";
import { TestLogger } from "./test_logger.js";

// Test pass and fail behavior

const failTestModules = [FailTests];
const passTestModules = [PassTests];
const errorTestModules = [ErrorTests];

// jackrabbit test run won't pass failing tests
async function testsFail() {
	let logger = new TestLogger();
	await startRun(logger, "test_pass.tests.js", [FailTests]);

	if (logger.errored) throw new Error("an error occured");
	if (!logger.failed) return "fail tests failed to fail";
}

// jackrabbit test run won't fail passing tests
async function testsPass() {
	let logger = new TestLogger();
	await startRun(logger, "test_fail.tests.js", [PassTests]);

	if (logger.errored) throw new Error("an error occured");
	if (logger.failed) return "passing tests failed to pass";
}

async function testsError() {
	let logger = new TestLogger();
	await startRun(logger, "test_error.tests.js", [ErrorTests]);

	if (!logger.errored) return "tests failed to error";
	if (logger.failed) return "tests should error not fail";
}

const testFailures = {
	tests: [testsFail],
	options: {
		title: "Failures",
	},
};

const testSuccesses = {
	tests: [testsPass],
	options: {
		title: "Sucesses",
	},
};

const testErrors = {
	tests: [testsError],
	options: {
		title: "Errors",
	},
};

export const testModules = [testFailures, testSuccesses, testErrors];
