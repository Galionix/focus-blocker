import * as vscode from 'vscode';

export function getWebviewContent(t: { title: string; }): string {
	const config = vscode.workspace.getConfiguration("focus-blocker");

	const intervalMin = config.get<number>("breakMin", 20);
	const durationSec = intervalMin * 60; // таймер на 10 секунд
	return `
<!DOCTYPE html>
<html lang="ru">
<head>
	<meta charset="UTF-8">
	<style>
		body {
			background-color: #1e1e1e;
			color: #fff;
			display: flex;
			justify-content: center;
			align-items: center;
			height: 100vh;
			font-family: sans-serif;
			font-size: 24px;
			flex-direction: column;
		}
		#countdown {
			font-size: 48px;
			margin-top: 1em;
		}
	</style>
</head>
<body>
	<div>${t.title}</div>
	<div id="countdown">${durationSec}</div>

	<script>
		let timeLeft = ${durationSec};
		const countdown = document.getElementById('countdown');
		const vscode = acquireVsCodeApi();

		const interval = setInterval(() => {
			timeLeft--;
			countdown.textContent = timeLeft;

			if (timeLeft <= 0) {
				clearInterval(interval);
				vscode.postMessage('done');
			}
		}, 1000);
	</script>
</body>
</html>
`;
}
