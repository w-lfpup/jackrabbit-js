export function nextFrame(): Promise<void> {
	return new Promise(function (resolve) {
		queueMicrotask(function() {
			resolve();
		})
	})
}
