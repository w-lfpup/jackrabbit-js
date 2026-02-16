import { Logger } from "./logger.js";
import { run } from "./runner.js";

let logger = new Logger();

try {
	let jackrabbitMap = document.querySelector("script[type=jackrabbit_config]");
	if (null === jackrabbitMap)
		throw new Error("Failed to query jackrabbit_config script");

	// should be it's own verification and then throw
	let config = JSON.parse(jackrabbitMap.textContent);

	run(logger, config.test_collections);
} catch (e: unknown) {
	logger.log({
		type: "run_error",
		error: e?.toString() ?? "wild horses error",
	});
}
