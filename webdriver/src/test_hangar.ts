interface TestHangerParams {
	jackrabbit_url: URL;
	test_collections: string[];
}

export function testHanger(params: TestHangerParams) {
	return `<!DOCTYPE html>
<html>
	<head>
		<script type="importmap">
			{
				"imports": {
					"@w-lfpup/jackrabbit/": "/jackrabbit/"
				}
			}
		</script>
		<script type="jackrabbit_config">
			${JSON.stringify(params)}
		</script>
		<script type="module" src="/jackrabbit/browser/dist/mod.js"></script>
	</head>
	<body></body>
</html>
`;
}
