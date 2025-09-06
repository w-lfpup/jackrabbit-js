#!/usr/bin/env node
import { Config, Importer, Logger, run } from "../../cli/dist/mod.js";
const config = new Config(process.argv.slice(2));
const importer = new Importer(process.cwd());
const logger = new Logger();
let errored = false;
try {
    await run(config, importer, logger);
}
catch (e) {
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
