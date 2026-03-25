import type { Logger } from "./logger.js";

import { runCollection } from "@w-lfpup/jackrabbit/core/dist/mod.js";

export async function run(logger: Logger, files: string[], baseUrl: string) {
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
