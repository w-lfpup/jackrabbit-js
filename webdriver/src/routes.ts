import type { IncomingMessage, ServerResponse } from "http";
import type { ConfigInterface } from "./config.js";
import type { Datastore } from "./datastore.js";
import type { EventBusInterface, LogActions } from "./eventbus.js";
import type { ActionParams } from "./flyweight.js";

import { testHanger } from "./test_hangar.js";
import * as cmd from "./commands/mod.js";
import { serveFile } from "./operations/mod.js";
import { getJsonFromRequestBody } from "./flyweight.js";

// 404 - not found / undefined
// 400 - bad request
// 500 - error between this server and webdriver

let routeMap = new Map([
	["/cmd/element_click", cmd.elementClick],
	["/cmd/element_send_keys", cmd.elementSendKeys],
	["/cmd/find_element_from_element", cmd.findElementFromElement],
	["/cmd/find_element_from_shadow_root", cmd.findElementFromShadowRoot],
	["/cmd/find_element", cmd.findElement],
	["/cmd/find_elements_from_element", cmd.findElementsFromElement],
	["/cmd/find_elements_from_shadow_root", cmd.findElementsFromShadowRoot],
	["/cmd/find_elements", cmd.findElements],
	["/cmd/get_element_shadow_root", cmd.getElementShadowRoot],
	["/cmd/log", cmd.log],
	["/cmd/take_element_screenshot", cmd.takeElementScreenshot],
]);

export class Router {
	#config: ConfigInterface;
	#eventbus: EventBusInterface;
	#datastore: Datastore;

	constructor(
		config: ConfigInterface,
		eventbus: EventBusInterface,
		datastore: Datastore,
	) {
		this.#config = config;
		this.#eventbus = eventbus;
		this.#datastore = datastore;
	}

	get route() {
		return this.#boundRoute;
	}

	#boundRoute = this.#route.bind(this);
	async #route(req: IncomingMessage, res: ServerResponse) {
		if (servePing(req, res)) return;
		if (serveTestPage(req, res, this.#config)) return;
		if (logAction(req, res, this.#eventbus)) return;
		if (execWebdriverCommand(req, res, this.#datastore, this.#eventbus)) return;

		await serveFile(req, res);
	}
}

function servePing(req: IncomingMessage, res: ServerResponse): boolean {
	let { url, method } = req;
	if (url !== "/ping" || "GET" !== method) return false;

	res.setHeader("Content-Type", "text/html");
	res.writeHead(200);
	res.end("The cookie train has arrived!");

	return true;
}

function serveTestPage(
	req: IncomingMessage,
	res: ServerResponse,
	config: ConfigInterface,
): boolean {
	let { url, method } = req;
	if (url !== "/" || "GET" !== method) return false;

	let hangar = testHanger({
		jackrabbit_url: config.jackrabbitUrl,
		test_collections: process.argv.slice(3),
	});

	res.setHeader("Content-Type", "text/html");
	res.writeHead(200);
	res.end(hangar);

	return true;
}

function getCookie(req: IncomingMessage): string | undefined {
	let cookies = req.headers.cookie?.split(";") ?? [];
	for (const cookieLine of cookies) {
		if (cookieLine.startsWith("jackrabbit=")) {
			return cookieLine.split("=")[1];
		}
	}
}

function logAction(
	req: IncomingMessage,
	res: ServerResponse,
	eventbus: EventBusInterface,
): boolean {
	let { url, method } = req;
	if (!url?.startsWith("/log/") || "POST" !== method) return false;

	let jackrabbitId = getCookie(req);
	if (!jackrabbitId) {
		res.writeHead(401);
		res.end();
		return true;
	}

	getJsonFromRequestBody(req)
		.then(function (loggerAction: LogActions) {
			eventbus.dispatchAction({
				type: "log",
				loggerAction,
				jackrabbitId,
			});
			res.writeHead(200);
			res.end();
		})
		.catch(function () {
			res.writeHead(500);
			res.end();
		});

	return true;
}

function execWebdriverCommand(
	req: IncomingMessage,
	res: ServerResponse,
	datastore: Datastore,
	eventbus: EventBusInterface,
): boolean {
	let { url } = req;
	if (!url?.startsWith("/cmd/")) return false;

	let jackrabbitId = getCookie(req);
	if (!jackrabbitId) {
		res.writeHead(401);
		res.end();
		return true;
	}

	let session = datastore.getState().runs.get(jackrabbitId);
	if (!session) {
		res.writeHead(401);
		res.end();
		return true;
	}

	let { sessionId } = session;
	if (!sessionId) {
		res.writeHead(401);
		res.end();
		return true;
	}

	let { webdriverParams, signal } = session;
	webdriverCommands({
		req,
		res,
		signal,
		sessionId,
		webdriverParams,
		eventbus,
	}).catch(function () {
		res.writeHead(500);
		res.end();
	});

	return true;
}

export async function webdriverCommands(actionParams: ActionParams) {
	let { req, res, sessionId } = actionParams;
	if (!sessionId) return;

	// expecting http 1.1
	let reqUrl = req.url;
	if (reqUrl) {
		let action = routeMap.get(reqUrl);
		if (action) return action(actionParams);
	}

	res.writeHead(404);
	res.end();
}
