#!/usr/bin/env node
import * as http from "http";
import { createConfig } from "./config.js";
import { Router } from "./routes.js";
import { WebDrivers } from "./webdriver.js";
import { EventBus } from "./eventbus.js";
import { Datastore } from "./datastore.js";
import { getResultsAsString, isComplete } from "./results.js";
let args = process.argv.slice(2);
const config = await createConfig(args);
if (config instanceof Error) {
    console.log(config);
    process.exit(1);
}
let eventbus = new EventBus();
let datastore = new Datastore(config, eventbus);
let router = new Router(config, eventbus, datastore);
let webdrivers = new WebDrivers(config, eventbus, datastore);
let server = http.createServer();
server.addListener("request", router.route);
server.addListener("close", function () {
    let state = datastore.getState();
    console.log(getResultsAsString(state));
    state.errors || state.fails || !isComplete(state)
        ? process.exit(1)
        : process.exit(0);
});
eventbus.addListener("end", function () {
    server.close();
});
let { port, hostname } = config.jackrabbitUrl;
server.listen({
    port,
    hostname,
});
config.runAsynchronously ? webdrivers.runAll() : webdrivers.run();
