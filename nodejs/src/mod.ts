#!/usr/bin/env node

import { Logger } from "./logger.js";
import { Config, run } from "./runner.js";

const config = new Config(process.argv.slice(2));
const logger = new Logger();

let error;

try {
	await run(config, logger);
} catch (e: unknown) {
	error = e;
	console.log("Error:");

	e instanceof Error
		? console.log(`
${e.name}
${e.message}
${e.stack}`)
		: console.log(e);
}

logger.failed || error ? process.exit(1) : process.exit(0);
