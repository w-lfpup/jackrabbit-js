#!/usr/bin/env node
import { createServer } from "./server/server.js";
// for driver in webdrivers (ie safar chromium firefox)
let server = createServer();
server.on("close", function () {
    // exit process when server is closed
    process.exit(0);
});
