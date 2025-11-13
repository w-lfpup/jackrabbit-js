import * as FailTests from "./test_fail.test.js";
import * as PassTests from "./test_pass.test.js";

import { startRun } from "../../core/dist/mod.js";
import { TestLogger } from "./test_logger.js";

// Test pass and fail behavior

const failTestModules = [FailTests];
const passTestModules = [PassTests];

// jackrabbit test run won't pass failing tests
async function testsFail() {
	let logger = new TestLogger();
	await startRun(logger, failTestModules);

	if (!logger.failed) return "fail tests failed to fail";
}

// jackrabbit test run won't fail passing tests
async function testsPass() {
	let logger = new TestLogger();
	await startRun(logger, passTestModules);

	if (logger.failed) return "passing tests failed to pass";
}

const tests = [testsFail, testsPass];

const options = {
	title: "Failures and Successes",
};

const testModule = {
	tests,
	options,
};

export const testModules = [testModule];
