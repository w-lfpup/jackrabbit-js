import type { ConfigInterface } from "./cli_types.js";

export class Config implements ConfigInterface {
	files: string[] = [];

	constructor(args: string[]) {
		this.files = args;
	}
}
