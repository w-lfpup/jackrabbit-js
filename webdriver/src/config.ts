export interface ConfigParams {
	host_and_port: string;
	webdrivers: [string, string][];
}

export interface ConfigJson {
	host_and_port: URL;
	webdrivers: [string, URL][];
}

class Config {}

export async function createConfig(
	args: string[],
): Promise<ConfigJson | Error> {
	let configFilepath = args[0];

	let json: any;
	try {
		let json = await import(configFilepath, { with: { type: "json" } });
	} catch (e) {
		if (e instanceof Error) return e;
		return new Error("failed to parse config params from string");
	}

	let host_and_port: URL | null = URL.parse(json.host_and_port);
	if (!host_and_port) return new Error(`JSON: invalid host_and_port`);

	let webdrivers: [string, URL][] = [];
	if (Array.isArray(json.webdrivers))
		for (let [command, targetUrl] of json.webdrivers) {
			if (typeof command === "string") {
				let url = URL.parse(targetUrl);
				if (!url) return new Error(`JSON: invalid webdriver url`);
				webdrivers.push([command, url]);
			} else {
				return new Error(`JSON: invalid webdriver commmand`);
			}
		}

	return {
		host_and_port,
		webdrivers,
	};
}

export {};
