
export function getSettingsHtml(interval: number, breakDuration: number, t: { [key: string]: string }) {
	return `
	<!DOCTYPE html>
	<html>
	<body style="font-family:sans-serif;padding:2rem;background:#1e1e1e;color:#fff">
		<h2>${t.title}</h2>
		<label>${t.intervalLabel}: <input id="interval" type="number" value="${interval}"></label><br><br>
		<label>${t.breakLabel}: <input id="break" type="number" value="${breakDuration}"></label><br><br>
		<button onclick="save()">${t.saveButton}</button>

		<script>
			const vscode = acquireVsCodeApi();
			function save() {
				const intervalMin = parseInt(document.getElementById('interval').value);
				const breakMin = parseInt(document.getElementById('break').value);
				vscode.postMessage({ command: 'save', intervalMin, breakMin });
			}
		</script>
	</body>
	</html>
	`;
	}