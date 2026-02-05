#!/usr/bin/env node

import * as http from "http";

import { createConfig } from "./config.js";
import { Logger } from "./logger.js";
import { Router } from "./routes.js";
import { WebDrivers } from "./webdriver.js";

let args = process.argv.slice(2);

const config = await createConfig(args);
if (config instanceof Error) {
	console.log(config);
	process.exit(1);
}

// grand timeout
let abortController = new AbortController();

// generate components
let server = http.createServer();
let webdrivers = new WebDrivers(config);
let logger = new Logger();
let router = new Router(config);

// add webdriver events
webdrivers.addEventListener("complete", function () {
	abortController.abort();
});
webdrivers.addEventListener("error", function () {
	webdrivers.next();
});

// add router events
// logs are tightly coupled
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
let { signal } = abortController;
let { port, hostname } = config.hostAndPort;
server.listen({
	port,
	hostname,
	signal,
});

// start test run
webdrivers.next();
