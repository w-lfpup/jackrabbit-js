import type { LoggerInterface } from "../../core/dist/mod.js";
export declare class Config {
    files: string[];
    constructor(args: string[]);
}
export declare function run(config: Config, logger?: LoggerInterface): Promise<void>;
