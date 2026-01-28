#!/usr/bin/env node

import { createServer } from "./server/server.js";
import { createWebdriver } from "./server/webdriver.js";

import { createConfig } from "./config.js";

let args = process.argv.slice(2);

const config = await createConfig(args);
if (config instanceof Error) {
	console.log(config);
	process.exit(1);
}

// for driver in webdrivers (ie safar chromium firefox)
let server = createServer();
server.on("close", function () {
	// exit process when server is closed
	process.exit(0);
});

// server.listen(4000);

// let abortController = createWebdriver();

export {};
