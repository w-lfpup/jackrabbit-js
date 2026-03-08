import type { LoggerAction } from "../../core/dist/jackrabbit_types.js";

export interface WebdriverSessionAction {
	id: string;
}

export interface WebdriverSessionStartAction extends WebdriverSessionAction {
	type: "session_start";
}

export interface WebdriverSessionErrorAction extends WebdriverSessionAction {
	type: "session_error";
	error: string;
}

export interface WebdriverSessionClosedAction extends WebdriverSessionAction {
	type: "session_closed";
}

export interface WebdriverRunCompleteAction extends WebdriverSessionAction {
	type: "run_complete";
}

export interface WebdriverLogAction extends WebdriverSessionAction {
	type: "log";
	loggerAction: LoggerAction;
}

export interface WebdriverCliOutpuAction extends WebdriverSessionAction {
	type: "stdout";
	output: string;
}

export interface WebdriverCliErrorOutpuAction extends WebdriverSessionAction {
	type: "stderr";
	output: string;
}

export interface WebdriverEndAction {
	type: "end";
}

export interface WebdriverActionMap {
	end: WebdriverEndAction;
	log: WebdriverLogAction;
	run_complete: WebdriverRunCompleteAction;
	session_closed: WebdriverSessionClosedAction;
	session_error: WebdriverSessionErrorAction;
	session_start: WebdriverSessionStartAction;
	stderr: WebdriverCliErrorOutpuAction;
	stdout: WebdriverCliOutpuAction;
}

export type WebdriverActions =
	| WebdriverCliErrorOutpuAction
	| WebdriverCliOutpuAction
	| WebdriverEndAction
	| WebdriverLogAction
	| WebdriverRunCompleteAction
	| WebdriverSessionClosedAction
	| WebdriverSessionErrorAction
	| WebdriverSessionStartAction;

interface TypedEventBusListener<
	K extends keyof WebdriverActionMap = keyof WebdriverActionMap,
> {
	(action: WebdriverActionMap[K]): void;
}

interface EventBusListener extends TypedEventBusListener {
	(action: WebdriverActions): void;
}

export interface EventBusInterface {
	addListener<K extends keyof WebdriverActionMap>(
		type: K,
		listener: TypedEventBusListener<K>,
	): void;
	dispatchAction(action: WebdriverActions): void;
}

export class EventBus implements EventBusInterface {
	#eventMap: Map<string, EventBusListener[]> = new Map();

	addListener<K extends keyof WebdriverActionMap>(
		type: K,
		cb: TypedEventBusListener<K>,
	) {
		let listeners = this.#eventMap.get(type);
		if (!listeners) {
			listeners = [];
			this.#eventMap.set(type, listeners);
		}
		listeners.push(cb as EventBusListener);
	}

	dispatchAction(action: WebdriverActions) {
		console.log(action);
		let listeners = this.#eventMap.get(action.type);
		if (listeners)
			for (const listener of listeners) {
				listener(action);
			}
	}
}
