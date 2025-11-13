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
	if (logger.cancelled) return;

	logger.log(testModules, {
		type: "start_test",
		moduleId,
		testId,
	});

	const { tests, options } = testModules[moduleId];

	const testFunc = tests[testId];
	const startTime = performance.now();
	const assertions = await Promise.race([
		createTimeout(options.timeoutMs),
		testFunc(),
	]);

	if (logger.cancelled) return;

	const endTime = performance.now();

	logger.log(testModules, {
		type: "end_test",
		assertions,
		endTime,
		moduleId,
		startTime,
		testId,
	});
}

async function execCollection(
	testModules: TestModule[],
	logger: LoggerInterface,
	moduleId: number,
) {
	if (logger.cancelled) return;

	const { tests } = testModules[moduleId];

	const wrappedTests = [];
	for (let [testID] of tests.entries()) {
		wrappedTests.push(execTest(testModules, logger, moduleId, testID));
	}

	if (logger.cancelled) return;

	await Promise.all(wrappedTests);
}

async function execCollectionOrdered(
	testModules: TestModule[],
	logger: LoggerInterface,
	moduleId: number,
) {
	const { tests } = testModules[moduleId];

	for (let [testID] of tests.entries()) {
		if (logger.cancelled) return;

		await execTest(testModules, logger, moduleId, testID);
	}
}

export async function startRun(
	logger: LoggerInterface,
	testModules: TestModule[],
) {
	logger.log(testModules, {
		type: "start_run",
		time: performance.now(),
	});

	for (let [moduleId, testModule] of testModules.entries()) {
		if (logger.cancelled) return;

		logger.log(testModules, {
			type: "start_module",
			moduleId,
		});

		const { options } = testModule;
		options?.runAsynchronously
			? await execCollection(testModules, logger, moduleId)
			: await execCollectionOrdered(testModules, logger, moduleId);

		if (logger.cancelled) return;

		logger.log(testModules, {
			type: "end_module",
			time: performance.now(),
			moduleId,
		});
	}

	logger.log(testModules, {
		type: "end_run",
		time: performance.now(),
	});
}

export function cancelRun(logger: LoggerInterface, testModules: TestModule[]) {
	if (logger.cancelled) return;

	logger.log(testModules, {
		type: "cancel_run",
		time: performance.now(),
	});
}
