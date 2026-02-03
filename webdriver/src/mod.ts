#!/usr/bin/env node

import { createConfig } from "./config.js";
import { Logger } from "./logger.js";
import { Router } from "./routes.js";

import { WebDrivers } from "./webdriver.js";
import * as http from "http";

let args = process.argv.slice(2);

const config = await createConfig(args);
if (config instanceof Error) {
	console.log(config);
	process.exit(1);
}

// grand timeout
let signal = AbortSignal.timeout(config.timeoutMs);

// server
let server = http.createServer();

// get webdrivers
let webdrivers = new WebDrivers(config, signal);
webdrivers.addEventListener("complete", function () {
	server.closeAllConnections();
});
webdrivers.addEventListener("error", function () {
	// server.closeAllConnections();
});

// logger
let logger = new Logger();

// pass messages from server to webdrivers
let router = new Router();
router.addEventListener("log", function () {
	logger.log();
});
router.addEventListener("complete", function () {
	webdrivers.next();
});

server.on("request", router.route);
server.on("close", function () {
	logger.cancelled || logger.failed ? process.exit(1) : process.exit(0);
});

// run server
let { port, hostname } = config.hostAndPort;
server.listen({
	port,
	hostname,
	signal,
});

// start test run
webdrivers.next();
