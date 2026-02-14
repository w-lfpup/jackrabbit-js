import { Logger } from "./logger.js";
import { run } from "./runner.js";

const logger = new Logger();

try {
	let jackrabbitMap = document.querySelector("script[type=jackrabbitmap]");
	if (null === jackrabbitMap) throw new Error("jackrabbitmap not found");
	let jackrabbitConfig = JSON.parse(jackrabbitMap.textContent);

	await run(jackrabbitConfig.test_collections, logger);
} catch (e: unknown) {
	logger.log({
		type: "error",
		error: e?.toString() ?? "wild horses error",
	});
}
