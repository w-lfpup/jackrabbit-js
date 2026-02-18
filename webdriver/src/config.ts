import { lstat } from "fs";
import * as path from "path";

// use params for each driver
interface WebdriverParams {
	command: string;
	url: URL;
	title: string;
	timeoutMs: number;
}

export interface ConfigInterface {
	hostAndPort: URL;
	timeoutMs: number;
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

		let timeoutMs = json.timeout_ms;
		if (typeof timeoutMs !== "number")
			throw new Error("config: invalid timeout_ms json property");

		let webdrivers: WebdriverParams[] = [];
		if (Array.isArray(json.webdrivers))
			for (const webdriverParams of json.webdrivers) {
				let params = createWebdriverParams(webdriverParams);
				if (params instanceof Error) return params;
				webdrivers.push(params);
			}

		return {
			hostAndPort,
			webdrivers,
			timeoutMs,
		};
	} catch (e) {
		if (e instanceof Error) return e;
		return new Error("failed to parse config params from string");
	}
}

export function createWebdriverParams(json: any): WebdriverParams | Error {
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
