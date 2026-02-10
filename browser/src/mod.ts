#!/usr/bin/env node

import { Logger } from "./logger.js";
import { run } from "./runner.js";

const logger = new Logger();

let error;
try {
	await run(process.argv.slice(2), logger);
} catch (e: unknown) {
	error = e;
	console.log(e);
}

// logger.log({"action": "end_test_run"})
