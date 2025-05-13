#!/usr/bin/env node
import { Config, Importer, Logger, run } from "../../cli/dist/mod.js";
const config = new Config(process.argv.slice(2));
const importer = new Importer(process.cwd());
const logger = new Logger();
try {
    await run(config, importer, logger);
    if (!logger.failed) {
        process.exit(0);
    }
}
catch (e) {
    if (e instanceof Error) {
        console.log(`
Error:
${e.name}
${e.message}
${e.stack}`);
    }
}
process.exit(1);
