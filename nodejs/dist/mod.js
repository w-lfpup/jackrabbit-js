#!/usr/bin/env node
import { Logger } from "./logger.js";
import * as path from "path";
import { startRun } from "../../core/dist/mod.js";
const logger = new Logger();
for (const file of process.argv.slice(2)) {
    let filepath = path.join(process.cwd(), file);
    try {
        const { testModules } = await import(filepath);
        await startRun(logger, testModules);
    }
    catch (e) {
        logger.log({
            type: "run_error",
            error: e?.toString() ?? "wild horses error",
        });
    }
}
logger.failed || logger.errored ? process.exit(1) : process.exit(0);
