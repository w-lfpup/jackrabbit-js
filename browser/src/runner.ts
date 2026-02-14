import { startRun } from "jackrabbit/core/dist/mod.js";

import type { Logger } from "./logger.js";

export async function run(files: string[], logger: Logger) {
	for (const url of files) {
		try {
			let filepath = URL.parse(import.meta.url, url);
			if (null === filepath) throw new Error("Failed to import url: " + url);

			const { testModules } = await import(filepath.toString());
			await startRun(logger, testModules);
		} catch (e: unknown) {
			logger.log({
				type: "error",
				error: e?.toString() ?? "wild horses error",
			});
		}
	}
}
