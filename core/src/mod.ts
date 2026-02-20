export type {
	LoggerAction,
	LoggerInterface,
	Test,
	Options,
	TestModule,
} from "./jackrabbit_types.ts";

import type {
	Assertions,
	LoggerInterface,
	TestModule,
} from "./jackrabbit_types.ts";

const TIMEOUT_INTERVAL_MS = 10000;

function sleep(time: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve();
		}, time);
	});
}

async function createTimeout(
	timeoutMs: number = TIMEOUT_INTERVAL_MS,
): Promise<Assertions> {
	await sleep(timeoutMs);

	return `timed out at ${performance.now()} after ${timeoutMs} ms.`;
}

async function execTest(
	testModules: TestModule[],
	logger: LoggerInterface,
	moduleId: number,
	testId: number,
) {
	const { tests, options } = testModules[moduleId];
	const moduleName = options?.title ?? moduleId.toString();
	const testName =
		testModules[moduleId]?.tests[testId]?.name ?? testId.toString();

	logger.log({
		type: "start_test",
		moduleId,
		testId,
		moduleName,
		testName,
	});

	const testFunc = tests[testId];
	const startTime = performance.now();
	let assertions: Assertions;
	try {
		assertions = await Promise.race([
			createTimeout(options?.timeoutMs),
			testFunc(),
		]);
	} catch (e: unknown) {
		return logger.log({
			type: "test_error",
			moduleId,
			moduleName,
			testId,
			testName,
			error: e?.toString() ?? "wild test error",
		});
	}

	const endTime = performance.now();

	logger.log({
		type: "end_test",
		assertions,
		endTime,
		moduleId,
		moduleName,
		startTime,
		testId,
		testName,
	});
}

async function execCollection(
	testModules: TestModule[],
	logger: LoggerInterface,
	moduleId: number,
) {
	const { tests } = testModules[moduleId];

	const wrappedTests = [];
	for (let [testID] of tests.entries()) {
		wrappedTests.push(execTest(testModules, logger, moduleId, testID));
	}

	await Promise.all(wrappedTests);
}

async function execCollectionOrdered(
	testModules: TestModule[],
	logger: LoggerInterface,
	moduleId: number,
) {
	const { tests } = testModules[moduleId];

	for (let [testID] of tests.entries()) {
		await execTest(testModules, logger, moduleId, testID);
	}
}

export async function startRun(
	logger: LoggerInterface,
	filepath: string,
	testModules: TestModule[],
) {
	logger.log({
		type: "start_run",
		filepath,
		time: performance.now(),
	});

	for (let [moduleId, testModule] of testModules.entries()) {
		const { options } = testModule;

		const moduleName = options?.title ?? moduleId.toString();

		logger.log({
			type: "start_module",
			moduleId,
			moduleName,
		});

		options?.runAsynchronously
			? await execCollection(testModules, logger, moduleId)
			: await execCollectionOrdered(testModules, logger, moduleId);

		logger.log({
			type: "end_module",
			moduleId,
			moduleName,
		});
	}

	logger.log({
		type: "end_run",
		time: performance.now(),
	});
}
