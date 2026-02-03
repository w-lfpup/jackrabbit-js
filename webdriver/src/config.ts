export interface ConfigInterface {
	hostAndPort: URL;
	timeoutMs: number;
	webdrivers: [string, URL][];
}

export async function createConfig(
	args: string[],
): Promise<ConfigInterface | Error> {
	let configFilepath = args[0];

	let json: any;
	try {
		json = await import(configFilepath, { with: { type: "json" } });
	} catch (e) {
		if (e instanceof Error) return e;
		return new Error("failed to parse config params from string");
	}

	let hostAndPort: URL | null = URL.parse(json.host_and_port);
	if (!hostAndPort)
		return new Error(`config: invalid host_and_port json property`);

	let timeoutMs = json.timeout_ms;
	if (typeof timeoutMs !== "number")
		return new Error("config: invalid timeout_ms json property");

	let webdrivers: [string, URL][] = [];
	if (Array.isArray(json.webdrivers))
		for (let [command, targetUrl] of json.webdrivers) {
			let url = URL.parse(targetUrl);
			if (!url) return new Error(`config: invalid webdriver url json property`);

			if (typeof command === "string") {
				webdrivers.push([command, url]);
			} else {
				return new Error(`config: invalid webdriver commmand json property`);
			}
		}

	return {
		hostAndPort,
		webdrivers,
		timeoutMs,
	};
}

export {};
