import { Logger } from "./logger.js";
import { run } from "./runner.js";

let logger = new Logger();

try {
	let jackrabbitMap = document.querySelector("script[type=jackrabbitmap]");
	if (null === jackrabbitMap)
		throw new Error("Failed to query jackrabbitmap script");
	let jackrabbitConfig = JSON.parse(jackrabbitMap.textContent);

	run(logger, jackrabbitConfig.test_collections);
} catch (e: unknown) {
	logger.log({
		type: "run_error",
		error: e?.toString() ?? "wild horses error",
	});
}
