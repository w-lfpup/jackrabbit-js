import type { Logger } from "./logger.js";

import { startRun } from "jackrabbit/core/dist/mod.js";

export async function run(logger: Logger, files: string[], baseUrl: string) {
	for (const url of files) {
		try {
			let filepath = URL.parse(url, baseUrl);
			if (null === filepath) throw new Error("Failed to import url: " + url);

			const { testModules } = await import(filepath.toString());
			await startRun(logger, testModules);
		} catch (e: unknown) {
			logger.log({
				type: "run_error",
				error: e?.toString() ?? "wild horses error",
			});
		}
	}
}
