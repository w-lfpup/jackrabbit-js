# Jackrabbit Tests

## Tests

Tests are functions that return assertions.

Tests `pass` when they return the `undefined` primitive or an empty array.

```TS
// my_library.tests.ts

function testStuffAndPass() {
	return;
}

async function testMoreStuffAndPass() {
	return [];
}
```

Any other value will cause a test to `fail`.

So tests that `fail` look like:

```TS
// my_library.tests.ts

function testStuffAndFail() {
	return "this test failed!";
}

function testMoreStuffAndFail() {
	return ["this test also failed!"];
}
```

## Test Modules

Test Modules are javascript `modules`.

### Export Tests

Test Modules export their tests in an array called `tests`.

```TS
// my_library.tests.ts

export const tests = [
	testStuffAndPass,
	testMoreStuffAndPass,
	testStuffAndFail,
	testMoreStuffAndFail,
];
```

### Export Options

Exporting an `options` pojo is not required.

But exporting an `options` pojo with the following properties will affect test behavior:

```TS
export const options = {
	title: import.meta.url,
	runAsyncronously: true,
	timeoutInterval: 3000,
}
```

All properteis are optional.

Tests will run sequentially unless `runAsyncronously` is `true`.

```TS
// my_library.tests.ts

interface Options {
  title?: string;
  runAsynchronously?: boolean;
  timeoutInterval?: number;
}
```

## Test Collections

A `test collection` is a javascript module that exports a list of all relavent test modules called `testModules`.

```TS
// mod.test.ts

import * as MyTests from "./my_library.tests.ts";

export const testModules = [
	MyTests
];
```

## Run Test Collections

Jackrabbit logs the results of `test collections`.

```sh
npx jackrabbit --file ./mod.test.ts
```

## License

BSD 3-Clause License
