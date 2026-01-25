import type { ConfigInterface, ImporterInterface } from "./cli_types.js";
import type { LoggerInterface } from "../../core/dist/mod.js";
export declare function run(config: ConfigInterface, importer: ImporterInterface, logger?: LoggerInterface): Promise<void>;
