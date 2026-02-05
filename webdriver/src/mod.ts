#!/usr/bin/env node

import * as http from "http";

import { createConfig } from "./config.js";
import { Logger } from "./logger.js";
import { Router } from "./routes.js";
import { WebDrivers } from "./webdriver.js";

let args = process.argv.slice(2);
console.log(args);

const config = await createConfig(args);
if (config instanceof Error) {
	console.log(config);
	process.exit(1);
}

console.log("config:", config);

// grand timeout
let abortController = new AbortController();

// server
let server = http.createServer();

// get webdrivers
let webdrivers = new WebDrivers(config);
webdrivers.addEventListener("complete", function () {
	console.log("end of webdrivers!");
	abortController.abort();
});
webdrivers.addEventListener("error", function () {
	console.log("error, probably timed out");
	webdrivers.next();
});

// logger
let logger = new Logger();

// pass messages from server to webdrivers
let router = new Router(config);
router.addEventListener("log", function () {
	logger.log();
});
router.addEventListener("complete", function () {
	console.log("webdriver completed it's run!");
	webdrivers.next();
});

server.on("request", router.route);
server.on("close", function () {
	console.log("server close");
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
