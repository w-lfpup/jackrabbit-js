import type { TestModule } from "../../core/dist/mod.js";
export interface ConfigInterface {
    files: string[];
}
export interface ImporterInterface {
    load(url: string): Promise<TestModule[]>;
}
