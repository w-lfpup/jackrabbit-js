import type { TestModule } from "../../core/dist/mod.ts";

export interface ConfigInterface {
	files: string[];
}

export interface ImporterInterface {
	load(url: string): Promise<TestModule[]>;
}
