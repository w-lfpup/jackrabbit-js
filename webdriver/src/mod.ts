#!/usr/bin/env node

import * as http from "http";
import { createConfig } from "./config.js";
import { Logger } from "./logger.js";
import { Router } from "./routes.js";
import { WebDrivers } from "./webdriver.js";
import { EventBus } from "./eventbus.js";

let args = process.argv.slice(2);

const config = await createConfig(args);
if (config instanceof Error) {
	console.log(config);
	process.exit(1);
}

let eventbus = new EventBus();
let logger = new Logger(config, eventbus);
let router = new Router(config, eventbus);
let webdrivers = new WebDrivers(config, eventbus);

// setup server
let server = http.createServer();
server.addListener("request", router.route);
server.addListener("close", function () {
	console.log(logger.results);
	logger.errored || logger.failed ? process.exit(1) : process.exit(0);
});
eventbus.addListener("end", function () {
	server.close();
});

// run server
let { port, hostname } = config.hostAndPort;
server.listen({
	port,
	hostname,
});

// start test run
config.runAsynchronously ? webdrivers.runAll() : webdrivers.run();
