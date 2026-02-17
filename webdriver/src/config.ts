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
	webdrivers: [string, URL][];
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

		let webdrivers: [string, URL][] = [];
		if (Array.isArray(json.webdrivers))
			for (let [command, targetUrl] of json.webdrivers) {
				let url = URL.parse(targetUrl);
				if (!url)
					throw new Error(`config: invalid webdriver url json property`);

				if (typeof command === "string") {
					webdrivers.push([command, url]);
				} else {
					throw new Error(`config: invalid webdriver commmand json property`);
				}
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
