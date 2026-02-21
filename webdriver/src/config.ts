import * as path from "path";

interface WebdriverConfig {
	command: string;
	url: URL;
	title: string;
	timeoutMs: number;
}

export interface WebdriverParams {
	command: string;
	url: URL;
	title: string;
	timeoutMs: number;
	jrId: string;
}

export interface ConfigInterface {
	hostAndPort: URL;
	webdrivers: WebdriverParams[];
}

export async function createConfig(
	args: string[],
): Promise<ConfigInterface | Error> {
	let configFilepath = args[0];
	let relPath = path.join(process.cwd(), configFilepath);

	try {
		let { default: json } = await import(relPath, { with: { type: "json" } });

		let hostAndPort: URL | null = URL.parse(json.host_and_port);
		if (!hostAndPort)
			throw new Error(`config: invalid host_and_port json property`);

		let webdrivers: WebdriverParams[] = [];
		if (Array.isArray(json.webdrivers))
			for (const [index, webdriverParams] of json.webdrivers.entries()) {
				let params = createWebdriverParams(webdriverParams);
				if (params instanceof Error) return params;

				let session = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
				let jrId = `${index}_${session.toString(32)}`;

				webdrivers.push({ ...params, jrId });
			}
		return {
			hostAndPort,
			webdrivers,
		};
	} catch (e) {
		if (e instanceof Error) return e;
		return new Error("failed to parse config params from string");
	}
}

export function createWebdriverParams(json: any): WebdriverConfig | Error {
	let { command, url, title, timeout_ms } = json;

	if (typeof command !== "string")
		return new Error("WebdriverParams.command is not a string");

	let parsedUrl: URL | null = URL.parse(url);
	if (null === parsedUrl)
		return new Error("WebdriverParams.url is not a valid URL");
	if (typeof title !== "string")
		return new Error("WebdriverParams.title is not a string");
	if (typeof timeout_ms !== "number")
		return new Error("WebdriverParams.timeout_ms is not a number");

	return {
		command,
		url: parsedUrl,
		title,
		timeoutMs: timeout_ms,
	};
}
