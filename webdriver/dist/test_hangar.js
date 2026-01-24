export function testHanger(args) {
    return `
		<!DOCTYPE html>
		<html>
			<head>
				<script type="importmap">
					{
						"jackrabbit": "",
						"jackrabbit_browser": ""
					}
				</script>
				<script type="jackrabbit">
					${args}
				</script>
			</head>
			<body>hello!</body>
		</html>
	`;
}
