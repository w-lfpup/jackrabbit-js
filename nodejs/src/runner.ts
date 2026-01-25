import type { LoggerInterface } from "../../core/dist/mod.js";

import { startRun } from "../../core/dist/mod.js";

import { Logger } from "./logger.js";

import * as path from "path";

export class Config {
	files: string[] = [];

	constructor(args: string[]) {
		this.files = args;
	}
}

export async function run(
	config: Config,
	logger: LoggerInterface = new Logger(),
) {
	for (const file of config.files) {
		let filepath = path.join(process.cwd(), file);

		const { testModules } = await import(filepath);

		await startRun(logger, testModules);
	}
}
