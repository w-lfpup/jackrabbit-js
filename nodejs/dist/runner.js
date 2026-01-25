import { startRun } from "../../core/dist/mod.js";
import { Logger } from "./logger.js";
import * as path from "path";
export class Config {
    files = [];
    constructor(args) {
        this.files = args;
    }
}
export async function run(config, logger = new Logger()) {
    for (const file of config.files) {
        let filepath = path.join(process.cwd(), file);
        const { testModules } = await import(filepath);
        await startRun(logger, testModules);
    }
}
