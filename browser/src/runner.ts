import { startRun } from "jackrabbit/core/dist/mod.js";

import { Logger } from "./logger.js";

export async function run(files: string[], logger: Logger = new Logger()) {
	for (const url of files) {
		let filepath = URL.parse(import.meta.url, url);

		if (!filepath) {
			// log something
			continue;
		}

		const { testModules } = await import(filepath.toString());

		await startRun(logger, testModules);
	}
}
