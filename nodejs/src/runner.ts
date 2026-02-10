import { startRun } from "../../core/dist/mod.js";

import { Logger } from "./logger.js";

import * as path from "path";

// logger must exist over the lifetime of multiple test collections
// at the end still say if failed or not

export async function run(files: string[], logger: Logger = new Logger()) {
	for (const file of files) {
		let filepath = path.join(process.cwd(), file);

		const { testModules } = await import(filepath);

		await startRun(logger, testModules);

		// log results?
		// new logger each route
	}
}
