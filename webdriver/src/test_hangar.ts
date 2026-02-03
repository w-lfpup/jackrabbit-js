export function testHanger(args: string[]) {
	return `
		<!DOCTYPE html>
		<html>
			<head>
				<script type="importmap">
					{
						"jackrabbit": "/jackrabbit/"
					}
				</script>
				<script type="jackrabbit">
					${args}
				</script>
			</head>
			<body></body>
		</html>
	`;
}
