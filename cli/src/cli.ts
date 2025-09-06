import type { ConfigInterface, ImporterInterface } from "./cli_types.ts";
import type { LoggerInterface } from "../../core/dist/mod.ts";

import { startRun } from "../../core/dist/mod.js";
import { Logger } from "./logger.js";

export async function run(
	config: ConfigInterface,
	importer: ImporterInterface,
	logger: LoggerInterface = new Logger(),
) {
	for (const file of config.files) {
		const testModules = await importer.load(file);

		await startRun(logger, testModules);
	}
}
