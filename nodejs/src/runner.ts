import type { Logger } from "./logger.js";

import * as path from "path";
import { startRun } from "../../core/dist/mod.js";

// logger must exist over the lifetime of multiple test collections
// at the end still say if failed or not

export async function run(logger: Logger, files: string[]) {
	for (const file of files) {
		let filepath = path.join(process.cwd(), file);

		try {
			const { testModules } = await import(filepath);
			await startRun(logger, testModules);
		} catch (e: unknown) {
			logger.log({
				type: "error",
				error: e?.toString() ?? "wild horses error",
			});
		}
	}
}
