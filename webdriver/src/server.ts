#!/usr/bin/env node

import * as http from "http";
import * as path from "path";

let cwd = path.parse(process.cwd());

let repoPath = path.join(import.meta.url, "../../../");

console.log(repoPath);

export function createServer() {
	const server = http.createServer(function (req, res) {
		// router logic here

		// ROUTES
		//
		let { url } = req;
		if (url) {
			if (url.startsWith("/jackrabbit/core/")) {
				// load jackrabbit library
				// based on repo path
			}

			if (url.startsWith("/jackrabbit/browser/")) {
				// load jackrabbit library
			}

			if (url.startsWith("/log/")) {
				// if "end_run"
				// abortController.abort();
				// server.close();
				// send signal success / fail
			}

			if (url === "/") {
				// send "test" home page
			}

			// otherwise send file based on cwd
		}

		console.log(req.url);
		res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
		res.end(req.url);
	});

	return server;
}

// server.listen(4000);
