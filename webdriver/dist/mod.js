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
let logger = new Logger(eventbus);
let router = new Router(config, eventbus);
let webdrivers = new WebDrivers(config, eventbus);
// run server
let server = http.createServer();
server.on("request", router.route);
server.on("close", function () {
    console.log("closing the server");
    console.log("failed?", logger.failed);
    logger.cancelled || logger.failed ? process.exit(1) : process.exit(0);
});
let abortController = new AbortController();
let { signal } = abortController;
let { port, hostname } = config.hostAndPort;
server.listen({
    port,
    hostname,
    signal,
});
// start test run
webdrivers.start();
