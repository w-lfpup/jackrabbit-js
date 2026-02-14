#!/usr/bin/env node

import { Logger } from "./logger.js";
import { run } from "./runner.js";

const logger = new Logger();

await run(logger, process.argv.slice(2));

logger.failed || logger.errored ? process.exit(1) : process.exit(0);
