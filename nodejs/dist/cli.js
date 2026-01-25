import { startRun } from "../../core/dist/mod.js";
import { Logger } from "./logger.js";
export async function run(config, importer, logger = new Logger()) {
    for (const file of config.files) {
        const testModules = await importer.load(file);
        await startRun(logger, testModules);
    }
}
