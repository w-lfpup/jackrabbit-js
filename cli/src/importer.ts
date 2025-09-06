import type { TestModule } from "../../core/dist/mod.ts";
import type { ImporterInterface } from "./cli_types.ts";

export class Importer implements ImporterInterface {
	#cwd: string;

	constructor(cwd: string) {
		this.#cwd = cwd;
	}

	async load(uri: string): Promise<TestModule[]> {
		let uri_updated = uri;

		let absolute = uri.startsWith("/");
		if (!absolute) {
			uri_updated = this.#cwd + "/" + uri;
		}

		const { testModules } = await import(uri_updated);

		// verify here

		return testModules;
	}
}
