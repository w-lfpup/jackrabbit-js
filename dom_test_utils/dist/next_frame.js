export function nextFrame() {
    return new Promise(function (resolve) {
        queueMicrotask(function () {
            resolve();
        });
    });
}
