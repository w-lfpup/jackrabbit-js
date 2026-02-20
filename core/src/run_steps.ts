import type {
	Assertions,
	LoggerInterface,
	TestModule,
	Test,
	TestOptions,
} from "./jackrabbit_types.ts";

interface ExecTestParams {
	logger: LoggerInterface;
	options: TestOptions | undefined;
	jrTest: Test;
	collection_id: number;
	module_id: number;
	test_id: number;
}

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

async function execTest(params: ExecTestParams) {
	const { logger, options, jrTest, test_id, collection_id, module_id } = params;

	const test_name = jrTest.name ?? test_id.toString();

	logger.log({
		collection_id,
		module_id,
		test_id,
		test_name,
		type: "start_test",
	});

	let start_time = performance.now();

	let assertions: Assertions;
	try {
		assertions = await Promise.race([
			createTimeout(options?.timeoutMs),
			jrTest(),
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

	let end_time = performance.now();

	logger.log({
		assertions,
		collection_id,
		start_time,
		end_time,
		module_id,
		test_id,
		type: "end_test",
	});
}

async function execCollection(
	logger: LoggerInterface,
	testModule: TestModule,
	collection_id: number,
	module_id: number,
) {
	const { tests, options } = testModule;

	const wrappedTests = [];
	for (let [test_id, jrTest] of tests.entries()) {
		wrappedTests.push(async function () {
			await execTest({
				logger,
				options,
				jrTest,
				collection_id,
				module_id,
				test_id,
			});
		});
	}

	await Promise.all(wrappedTests);
}

async function execCollectionOrdered(
	logger: LoggerInterface,
	testModule: TestModule,
	collection_id: number,
	module_id: number,
) {
	const { tests, options } = testModule;

	for (let [test_id, jrTest] of tests.entries()) {
		await execTest({
			logger,
			options,
			jrTest,
			collection_id,
			module_id,
			test_id,
		});
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
			? await execCollection(logger, testModule, collection_id, module_id)
			: await execCollectionOrdered(
					logger,
					testModule,
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
