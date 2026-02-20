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

async function prepareTest(
	testModules: TestModule[],
	logger: LoggerInterface,
	collection_id: number,
	module_id: number,
	test_id: number,
) {
	const { tests, options } = testModules[module_id];
	const test_name =
		testModules[module_id]?.tests[test_id]?.name ?? test_id.toString();

	// should be a promise
	return async function () {
		logger.log({
			collection_id,
			module_id,
			test_id,
			test_name,
			type: "start_test",
		});

		const testFunc = tests[test_id];
		const start_time = performance.now();
		let assertions: Assertions;
		try {
			assertions = await Promise.race([
				createTimeout(options?.timeoutMs),
				testFunc(),
			]);
		} catch (e: unknown) {
			return logger.log({
				collection_id,
				error: e?.toString() ?? "wild test error",
				module_id,
				test_id,
				type: "test_error",
			});
		}

		const end_time = performance.now();

		logger.log({
			assertions,
			collection_id,
			end_time,
			module_id,
			start_time,
			test_id,
			type: "end_test",
		});
	};
}

async function execCollection(
	logger: LoggerInterface,
	testModules: TestModule[],
	collection_id: number,
	module_id: number,
) {
	const { tests } = testModules[module_id];

	const wrappedTests = [];
	for (let [test_id] of tests.entries()) {
		wrappedTests.push(
			prepareTest(testModules, logger, collection_id, module_id, test_id),
		);
	}

	await Promise.all(wrappedTests);
}

async function execCollectionOrdered(
	logger: LoggerInterface,
	testModules: TestModule[],
	collection_id: number,
	module_id: number,
) {
	const { tests } = testModules[module_id];

	for (let [test_id] of tests.entries()) {
		await prepareTest(testModules, logger, collection_id, module_id, test_id);
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
			? await execCollection(logger, testModules, collection_id, module_id)
			: await execCollectionOrdered(
					logger,
					testModules,
					collection_id,
					module_id,
				);

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
