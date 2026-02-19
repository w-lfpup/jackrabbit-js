// All webdriver events have a webdriver ID

import { LoggerAction } from "../../core/dist/jackrabbit_types.js";

interface WebdriverSessionAction {
	id: string;
}

interface WebdriverSessionStartAction extends WebdriverSessionAction {
	type: "session_start";
	error: Error;
}

interface WebdriverSessionErrorAction extends WebdriverSessionAction {
	type: "session_error";
	error: Error;
}

interface WebdriverSessionCompleteAction extends WebdriverSessionAction {
	type: "session_complete";
	loggerAction: LoggerAction;
}

interface WebdriverLogAction extends WebdriverSessionAction {
	type: "log";
	loggerAction: LoggerAction;
}

type WebdriverActions =
	| WebdriverSessionStartAction
	| WebdriverSessionCompleteAction
	| WebdriverSessionErrorAction
	| WebdriverLogAction;

interface EventbusListener {
	(action: WebdriverActions): void;
}

export interface EventBusInterface {
	addListener(type: string, listener: EventbusListener): void;
	dispatchAction(action: WebdriverActions): void;
}

export class EventBus implements EventBusInterface {
	#eventMap: Map<string, EventbusListener[]> = new Map();

	addListener(type: string, cb: EventbusListener) {
		let listeners = this.#eventMap.get(type);
		if (!listeners) {
			listeners = [];
			this.#eventMap.set(type, listeners);
		}
		listeners.push(cb);
	}

	dispatchAction(action: WebdriverActions) {
		let listeners = this.#eventMap.get(action.type);
		if (listeners)
			for (const listener of listeners) {
				listener(action);
			}
	}
}
