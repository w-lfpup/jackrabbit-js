import type { ConfigInterface } from "./cli_types.js";
export declare class Config implements ConfigInterface {
    files: string[];
    constructor(args: string[]);
}
