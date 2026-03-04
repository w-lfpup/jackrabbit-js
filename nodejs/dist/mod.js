#!/usr/bin/env node
import { Logger } from "./logger.js";
import * as path from "path";
import { runCollection } from "../../core/dist/mod.js";
let filepaths = process.argv.slice(2);
const logger = new Logger();
logger.log({
    type: "start_run",
    time: performance.now(),
    expected_collection_count: filepaths.length,
});
for (const [collection_id, file] of filepaths.entries()) {
    try {
        let filepath = path.join(process.cwd(), file);
        const { testModules } = await import(filepath);
        await runCollection(logger, testModules, collection_id, filepath);
    }
    catch (e) {
        logger.log({
            type: "collection_error",
            collection_id,
            error: e?.toString() ?? "wild horses error",
        });
    }
}
logger.log({
    type: "end_run",
    time: performance.now(),
});
console.log(logger.results);
logger.failed || logger.errored ? process.exit(1) : process.exit(0);
