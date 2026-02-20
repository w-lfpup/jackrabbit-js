import type {
	Assertions,
	LoggerInterface,
	TestModule,
} from "./jackrabbit_types.ts";

const TIMEOUT_INTERVAL_MS = 10000;

export function sleep(time: number): Promise<void> {
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
	module_id: number,
	test_id: number,
) {
	const { tests, options } = testModules[module_id];
	const module_name = options?.title ?? module_id.toString();
	const test_Name =
		testModules[module_id]?.tests[test_id]?.name ?? test_id.toString();

	// should be a promise

	logger.log({
		type: "start_test",
		module_id,
		test_id,
		test_name,
	});

	const testFunc = tests[test_id];
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
			module_id,
			module_name,
			test_id,
			test_name,
			error: e?.toString() ?? "wild test error",
		});
	}

	const end_time = performance.now();

	logger.log({
		type: "end_test",
		assertions,
		end_time,
		module_id,
		module_name,
		startTime,
		test_id,
		test_name,
	});
}

async function execCollection(
	testModules: TestModule[],
	logger: LoggerInterface,
	module_id: number,
) {
	const { tests } = testModules[module_id];

	const wrappedTests = [];
	for (let [test_id] of tests.entries()) {
		wrappedTests.push(execTest(testModules, logger, module_id, test_id));
	}

	await Promise.all(wrappedTests);
}

async function execCollectionOrdered(
	testModules: TestModule[],
	logger: LoggerInterface,
	module_id: number,
) {
	const { tests } = testModules[module_id];

	for (let [test_id] of tests.entries()) {
		await execTest(testModules, logger, module_id, test_id);
	}
}

export async function runCollection(
	logger: LoggerInterface,
	testModules: TestModule[],
	collection_id: number,
	collection_url: string,
) {
	logger.log({
		collection_id,
		collection_url,
		expected_module_count: testModules.length,
		type: "start_collection",
	});

	for (let [module_id, testModule] of testModules.entries()) {
		const { options } = testModule;

		const module_name = options?.title ?? module_id.toString();

		logger.log({
			type: "start_module",
			module_id,
			module_name,
			collection_id,
			expected_test_count: testModule.tests.length,
		});

		options?.runAsynchronously
			? await execCollection(testModules, logger, module_id)
			: await execCollectionOrdered(testModules, logger, module_id);

		logger.log({
			collection_id,
			module_id,
			type: "end_module",
		});
	}

	logger.log({
		type: "end_collection",
		collection_id,
	});
}
