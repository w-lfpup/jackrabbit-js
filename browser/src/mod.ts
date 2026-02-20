import { Logger } from "./logger.js";
import { run } from "./runner.js";

let logger = new Logger();

try {
	let jackrabbitMap = document.querySelector("script[type=jackrabbit_config]");
	if (null === jackrabbitMap)
		throw new Error("Failed to query jackrabbit_config script");

	// should be it's own verification and then throw
	let config = JSON.parse(jackrabbitMap.textContent);

	logger.log({
		type: "start_run",
		time: performance.now(),
		expected_collection_count: config?.test_collections?.length ?? 0,
	});

	run(logger, config.test_collections, config.jackrabbit_url);
} catch (e: unknown) {
	logger.log({
		type: "run_error",
		error: e?.toString() ?? "wild horses error",
	});
}

logger.log({
	type: "end_run",
	time: performance.now(),
});
