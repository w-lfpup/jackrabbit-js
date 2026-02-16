#!/usr/bin/env node

console.log("yoooo");

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

console.log(config);

// generate components
let logger = new Logger();
let router = new Router(config, logger);
let webdrivers = new WebDrivers(config);
let server = http.createServer();

// grand timeout
let abortController = new AbortController();

// add webdriver events
webdrivers.addEventListener("complete", function () {
	console.log("webdriver complete");
	abortController.abort();
});
webdrivers.addEventListener("error", function () {
	console.log("webdriver error");
	webdrivers.next();
});

// add router events
router.addEventListener("complete", function () {
	console.log("test run complete");
	webdrivers.next();
});
router.addEventListener("error", function () {
	console.log("run error occured");
	webdrivers.next();
});

// run server
server.on("request", router.route);
server.on("close", function () {
	console.log("closing the server");
	console.log("failed?", logger.failed);
	logger.cancelled || logger.failed ? process.exit(1) : process.exit(0);
});

let { signal } = abortController;
let { port, hostname } = config.hostAndPort;
server.listen({
	port,
	hostname,
	signal,
});

// start test run
webdrivers.next();
