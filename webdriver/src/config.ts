import * as path from "path";

interface WebdriverConfig {
	command: string;
	url: URL;
	title: string;
	timeoutMs: number;
	capabilities?: unknown;
}

export interface WebdriverParams extends WebdriverConfig {
	jackrabbitId: string;
}

export interface ConfigInterface {
	hostAndPort: URL;
	runAsynchronously?: boolean;
	webdrivers: WebdriverParams[];
}

export async function createConfig(
	args: string[],
): Promise<ConfigInterface | Error> {
	let configFilepath = args[0];
	// is absolute?
	path.isAbsolute(configFilepath);
	let relPath = path.resolve(process.cwd(), configFilepath);

	try {
		// windows might need a "file://<relPath>" situation
		let { default: json } = await import(`file://${relPath}`, {
			with: { type: "json" },
		});

		let hostAndPort: URL | null = URL.parse(json.host_and_port);
		if (!hostAndPort)
			throw new Error(`Config: invalid host_and_port json property`);

		let { run_asynchronously: runAsynchronously } = json;
		if (
			typeof runAsynchronously !== "boolean" &&
			undefined !== runAsynchronously
		)
			throw new Error(
				"Config: the property runAsynchronously is not a boolean or undefined",
			);

		let webdrivers: WebdriverParams[] = [];
		if (Array.isArray(json.webdrivers))
			for (const [index, webdriverParams] of json.webdrivers.entries()) {
				let params = createWebdriverParams(webdriverParams);
				if (params instanceof Error) return params;

				let session = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
				let jackrabbitId = `${index}:${session.toString(32)}`;

				webdrivers.push({ ...params, jackrabbitId });
			}
		return {
			hostAndPort,
			runAsynchronously,
			webdrivers,
		};
	} catch (e) {
		if (e instanceof Error) return e;
		return new Error("Config: failed to parse config params from string");
	}
}

export function createWebdriverParams(json: any): WebdriverConfig | Error {
	let { command, url, title, timeout_ms, capabilities } = json;

	if (typeof command !== "string")
		return new Error("WebdriverParams: command is not a string");

	let parsedUrl: URL | null = URL.parse(url);
	if (null === parsedUrl)
		return new Error("WebdriverParams: url is not a valid URL");
	if (typeof title !== "string")
		return new Error("WebdriverParams: title is not a string");
	if (typeof timeout_ms !== "number")
		return new Error("WebdriverParams: timeout_ms is not a number");

	return {
		command,
		url: parsedUrl,
		title,
		timeoutMs: timeout_ms,
		capabilities,
	};
}
