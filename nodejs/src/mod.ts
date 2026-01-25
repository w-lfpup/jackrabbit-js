#!/usr/bin/env node

import { Config } from "./config.js";
import { Logger } from "./logger.js";
import { run } from "./cli.js";

const config = new Config(process.argv.slice(2));
const logger = new Logger();

let errored = false;

try {
	await run(config, logger);
} catch (e: unknown) {
	errored = true;
	console.log("Error:");

	e instanceof Error
		? console.log(`
${e.name}
${e.message}
${e.stack}`)
		: console.log(e);
}

logger.failed || errored ? process.exit(1) : process.exit(0);
