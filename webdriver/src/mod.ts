#!/usr/bin/env node

import { createServer } from "./server.js";
import { createWebdriver } from "./webdriver.js";

import { createConfig } from "./config.js";

let args = process.argv.slice(2);

const config = await createConfig(args);
if (config instanceof Error) {
	console.log(config);
	process.exit(1);
}

let signal = AbortSignal.timeout(config.timeoutMs);

class Liaison {
	// has reference to commands and execs
	// has a bound callback for the server to update and queue next wedriver
	// has
}

let server = createServer();
server.on("error", function (e) {
	console.log(e);
	process.exit(0);
});

let { host, port } = config.hostAndPort;
server.listen({
	host,
	port,
	signal,
});

function sleep(timeMs: number): Promise<void> {
	return new Promise(function (resolve) {
		setTimeout(resolve, timeMs);
	});
}

for (let [command, url] of config.webdrivers) {
	// start command webdriver

	// get session
	// go to url
	await sleep(500);
}
