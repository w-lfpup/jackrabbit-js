import { Logger } from "./logger.js";
export declare class Config {
    files: string[];
    constructor(args: string[]);
}
export declare function run(config: Config, logger?: Logger): Promise<void>;
