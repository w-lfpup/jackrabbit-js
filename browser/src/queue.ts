interface Queueable {
	(): Promise<unknown>;
}

export class FetchQueue {
	#inbound: Queueable[] = [];
	#outbound: Queueable[] = [];
	#inRoute: Queueable | undefined;

	enqueue(queueable: Queueable) {
		console.log("enqueue");
		this.#inbound.push(queueable);
		if (!this.#inRoute) this.#queueAtom();
	}

	#queueAtom() {
		console.log("queue atom");
		if (!this.#outbound.length) {
			while (this.#inbound.length) {
				let pip = this.#inbound.pop();
				if (pip) this.#outbound.push(pip);
			}
		}

		this.#inRoute = this.#outbound.pop();
		this.#execAtom();
	}

	async #execAtom() {
		console.log("exec atom");
		if (this.#inRoute) {
			console.log("inroute found!");
			await this.#inRoute();
			console.log("exec atom fetched");
			this.#queueAtom();
		}
	}
}
