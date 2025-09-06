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
    if (e instanceof Error) {
        console.log(`
${e.name}
${e.message}
${e.stack}`);
    }
    else {
        console.log(e);
    }
}
if (logger.failed || errored) {
    console.log("mmm bad");
    process.exit(1);
}
process.exit(0);
