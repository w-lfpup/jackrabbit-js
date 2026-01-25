import type { LoggerInterface } from "../../core/dist/mod.js";
export interface ConfigInterface {
    files: string[];
}
export declare function run(config: ConfigInterface, logger?: LoggerInterface): Promise<void>;
