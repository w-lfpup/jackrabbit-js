import type { TestModule } from "../../core/dist/mod.js";
import type { ImporterInterface } from "./cli_types.js";
export declare class Importer implements ImporterInterface {
    #private;
    constructor(cwd: string);
    load(uri: string): Promise<TestModule[]>;
}
