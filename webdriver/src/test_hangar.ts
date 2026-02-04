interface TestHangerParams {
	jackrabbit_url: URL;
	test_collections: URL[];
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
				</script>
			</head>
			<body></body>
		</html>
	`;
}
