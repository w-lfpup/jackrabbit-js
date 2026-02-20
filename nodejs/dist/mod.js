#!/usr/bin/env node
import { Logger } from "./logger.js";
import * as path from "path";
import { runCollection } from "../../core/dist/mod.js";
const logger = new Logger();
// start run
for (const [index, file] of process.argv.slice(2).entries()) {
    let filepath = path.join(process.cwd(), file);
    try {
        const { testModules } = await import(filepath);
        await runCollection(logger, filepath, testModules);
    }
    catch (e) {
        logger.log({
            type: "collection_error",
            collection_id: index,
            url: filepath,
            error: e?.toString() ?? "wild horses error",
        });
    }
}
// end run
// log results
logger.failed || logger.errored ? process.exit(1) : process.exit(0);
