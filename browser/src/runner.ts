import { Logger } from "./logger.js";
import { runCollection } from "@w-lfpup/jackrabbit/core/dist/mod.js";

let logger = new Logger();

async function run(logger: Logger, files: string[], baseUrl: string) {
	for (const [collection_id, url] of files.entries()) {
		try {
			let filepath = URL.parse(url, baseUrl);
			if (null === filepath) throw new Error("Failed to import url: " + url);

			let filepathStr = filepath.toString();
			const { testModules } = await import(filepath.toString());
			await runCollection(logger, testModules, collection_id, filepathStr);
		} catch (e: unknown) {
			logger.log({
				type: "collection_error",
				collection_id,
				error: e?.toString() ?? "wild horses error",
			});
		}
	}
}

try {
	let jackrabbitMap = document.querySelector("script[type=jackrabbit_config]");
	// this should just send a logger error instead of quitting
	if (null === jackrabbitMap)
		throw new Error("Failed to query jackrabbit_config script");

	// should be it's own verification and then throw
	let config = JSON.parse(jackrabbitMap.textContent);

	logger.log({
		type: "start_run",
		time: performance.now(),
		expected_collection_count: config?.test_collections?.length ?? 0,
	});

	await run(logger, config.test_collections, config.jackrabbit_url);
	logger.log({
		type: "end_run",
		time: performance.now(),
	});
} catch (e: unknown) {
	logger.log({
		type: "run_error",
		error: e?.toString() ?? "wild horses error",
	});
}
