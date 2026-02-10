#!/usr/bin/env node
import { Logger } from "./logger.js";
import { run } from "./runner.js";
const logger = new Logger();
let error;
try {
    await run(process.argv.slice(2), logger);
}
catch (e) {
    error = e;
    console.log(e);
}
logger.failed || error ? process.exit(1) : process.exit(0);
