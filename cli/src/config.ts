import type { ConfigInterface } from "./cli_types.ts";

type Reaction = (config: ConfigInterface, value?: string) => void;
type Reactions = Record<string, Reaction>;

const reactions: Reactions = {
	"--file": fileConfig,
	"-f": fileConfig,
};

function fileConfig(config: ConfigInterface, file?: string) {
	if (file === undefined) return;
	config.files.push(file);
}

function iterateArgs(config: ConfigInterface, args: string[]) {
	let index = 0;
	while (index < args.length) {
		const flag = args[index];
		const reaction = reactions[flag];
		if (reaction === undefined) {
			throw new Error(`unrecognized argument: ${flag}`);
		}

		reaction(config, args[index + 1]);
		index += 2;
	}
}

export class Config implements ConfigInterface {
	files: string[] = [];

	constructor(args: string[]) {
		iterateArgs(this, args);
	}
}
