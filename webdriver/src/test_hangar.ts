interface TestHangerParams {
	jackrabbit_url: URL;
	test_collections: string[];
}

export function testHanger(params: TestHangerParams) {
	return `
		<!DOCTYPE html>
		<html>
			<head>
				<script type="jackrabbit">
					${JSON.stringify(params)}
				</script>
				<script type="importmap">
					{
						
					}
				</script>
				<script>
					let jackrabbitConfig = document.querySelector("script[type=jackrabbit]");
					let json = JSON.parse(jackrabbitConfig.textContent);
					fetch(new URL("/log/end_run", json.jackrabbit_url));
				</script>
			</head>
			<body>
				<p>hello! welcome to jackrabbit</b>
			</body>
		</html>
	`;
}
