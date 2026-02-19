#!/usr/bin/env node

import * as http from "http";

import { ConfigInterface, createConfig } from "./config.js";
import { Logger } from "./logger.js";
import { Router } from "./routes.js";
import { WebDrivers } from "./webdriver.js";

let args = process.argv.slice(2);

const config = await createConfig(args);
if (config instanceof Error) {
	console.log(config);
	process.exit(1);
}

// create webdriver ids [adf, 43f, 5532s]
let driverIDs = createWebdriverIDs(config);
console.log(driverIDs);

// generate components
let logger = new Logger();
let router = new Router(config, logger);
let webdrivers = new WebDrivers(config);
let server = http.createServer();

// grand timeout
let abortController = new AbortController();

// add webdriver events
webdrivers.addEventListener("complete", function () {
	abortController.abort();
});
webdrivers.addEventListener("error", function () {
	webdrivers.next();
});

// add router events
router.addEventListener("complete", function () {
	webdrivers.next();
});
router.addEventListener("error", function () {
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

function createWebdriverIDs(config: ConfigInterface): string[] {
	let ids: string[] = [];
	for (const [index] of config.webdrivers.entries()) {
		let num = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
		// no base 64 so whatever for now
		ids.push(`${index}:${num.toString(32)}`);
	}
	return ids;
}
