import type { Logger } from "./logger.js";

import * as path from "path";
import { startRun } from "../../core/dist/mod.js";

export async function run(logger: Logger, files: string[]) {
	for (const file of files) {
		let filepath = path.join(process.cwd(), file);

		try {
			const { testModules } = await import(filepath);
			await startRun(logger, testModules);
		} catch (e: unknown) {
			logger.log({
				type: "run_error",
				error: e?.toString() ?? "wild horses error",
			});
		}
	}
}
