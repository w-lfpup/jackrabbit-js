#!/usr/bin/env node

import { createServer } from "./server/server.js";
import { createWebdriver } from "./server/webdriver.js";

// for driver in webdrivers (ie safar chromium firefox)
let server = createServer();
server.on("close", function () {
	// exit process when server is closed
	process.exit(0);
});

// server.listen(4000);

// let abortController = createWebdriver();

export {};
