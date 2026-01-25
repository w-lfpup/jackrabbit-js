import { exec } from "child_process";

export function createWebdriver(webdriver: string, port: number) {
	const abortController = new AbortController();
	const { signal } = abortController;

	const child = exec(
		"safaridriver -p 3000",
		{ signal },
		function (error, stdout, stderr) {},
	);

	return abortController;
}

class WebdriverSession {
	#host = "localhost:4000/";
	#session: string | undefined;
	#abortController: AbortController | undefined;

	upWebdriver() {
		if (this.#abortController) return;

		this.#abortController = new AbortController();
		const { signal } = this.#abortController;

		const child = exec(
			"safaridriver -p 3000",
			{ signal },
			function (error, stdout, stderr) {
				console.log("WebDriverSession error:\n", error);
			},
		);
	}

	downWebdriver() {
		// delete session
		// DELETE /session/<session_id>
		// abort signal
		// remove abort signal
	}

	createSession() {
		// POST /session
		// response {
		// 	"value": {
		// 		"sessionId": "1234567890",
		// 		"capabilities": {...}
		// 	}
		// }
	}

	goToUrl(url: string) {
		// POST /session/<session_id>/url
		// null response
		// status code 200
	}
}
