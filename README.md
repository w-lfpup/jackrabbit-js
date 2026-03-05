# Jackrabbit-js

Write tests without dependencies (including jackrabbit itself).

[![Tests](https://github.com/w-lfpup/jackrabbit-js/actions/workflows/tests.yml/badge.svg)](https://github.com/w-lfpup/jackrabbit-js/actions/workflows/tests.yml)

## Install

Install jackrabbit with npm.

```sh
npm install --save-dev @w-lfpup/jackrabbit
```

Or Install jackrabbit directly from github.

```sh
npm install --save-dev https://github.com/w-lfpup/jackrabbit-js
```

# Tests

For a quick visual reference, please refer to the [examples](./examples/).

Developers with javascript experience can immediately start testing with basically zero overhead.

## Tests

Tests are functions or promises that return assertions.

Tests `pass` when they return the `undefined` primitive or an empty array `[]`.

```TS
// my.tests.ts

function testStuffAndPass() {
	return;
}

function testMoreStuffAndPass() {
	return [];
}
```

Any other value will cause a test to `fail`.

So tests that `fail` look like:

```TS
// my.tests.ts

function testStuffAndFail() {
	return "this test failed!";
}

function testMoreStuffAndFail() {
	return ["this test also failed!"];
}
```

## Test Modules

Test Modules are javascript `modules` that export two values: `tests` and `options`.

### Export Tests

Test Modules export their tests in an array called `tests`.

```TS
// my.tests.ts

export const tests = [
	testStuffAndPass,
	testMoreStuffAndPass,
	testStuffAndFail,
	testMoreStuffAndFail,
];
```

### Export Options

Export a parameter object named `options` to affect test behaviors in the current module:

```TS
// my.tests.ts

interface Options {
  runAsynchronously?: boolean;
  timeoutMs?: number;
  title?: string;
}

...

export const options = {
	runAsyncronously: true,
	timeoutMs: 3000,
	title: import.meta.url,
}
```

All properties are optional and exporting an `options` pojo is not required.

Tests run sequentially unless the `runAsyncronously` property is set to `true`.

## Test Collections

A `test collection` is a javascript module that exports a list test modules called `testModules`.

```TS
// mod.test.ts

import * as MyTests from "./my.tests.ts";

export const testModules = [
	MyTests
];
```

## Run Test Collections

### NodeJS

Run the following command to log the results of a test collection in nodejs.

```sh
npx jackrabbit ./mod.tests.ts
```

To run multiple test collections, add more filepaths as commandline arguments:

```sh
npx jackrabbit ./mod.tests.ts ./another_mod.tests.ts
```

### Webdrivers

Run the following command to log the results of a test collection from a browser.

```sh
npx jackrabbit_webdriver ./config.json ./mod.tests.ts
```

To run multiple test collections, add more filepaths as commandline arguments:

```sh
npx jackrabbit_webdriver ./config.json ./mod.tests.ts ./another_mod.tests.ts
```

An example `jackrabbit_webdriver` config is as follows:

```JSON
{
	"host_and_port": "http://localhost:4000",
	"run_asynchronously": false,
	"webdrivers": [
		{
			"title": "Firefox",
			"command": "geckodriver -p 4001",
			"timeout_ms": 20000,
			"url": "http://localhost:4001",
			"capabilities": {
				"alwaysMatch": {
					"moz:firefoxOptions": {
						"args": ["-headless"]
					}
				}
			}
		}
	]
}
```

## License

`Jackrabbit-js` is released under the BSD 3-Clause License.
