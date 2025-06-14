import * as vscode from 'vscode';
import { getSettingsHtml } from './getSettingsHtml';
import * as nls from 'vscode-nls';
const localize = nls.loadMessageBundle();

export function openSettingsWebview() {

	const panel = vscode.window.createWebviewPanel(
		"focus-blockerSettings",
		localize('focusBlocker.settings.title', 'Blocker settings'),
		vscode.ViewColumn.One,
		{ enableScripts: true }
	);

	const config = vscode.workspace.getConfiguration("focus-blocker");
	const intervalMin = config.get<number>("intervalMin", 90);
	const breakMin = config.get<number>("breakMin", 10);
	const t = {
		title: localize('focusBlocker.settings.title', 'Focus Blocker Settings'),
		intervalLabel: localize('focusBlocker.configuration.intervalMin', 'Work interval duration in minutes'),
		breakLabel: localize('focusBlocker.configuration.breakMin', 'Break duration (min)'),
		saveButton: localize('focusBlocker.settings.save', 'Save')
	  };

	panel.webview.html = getSettingsHtml(intervalMin, breakMin, t);

	panel.webview.onDidReceiveMessage(async (msg) => {
		if (msg.command === "save") {
			await vscode.workspace
				.getConfiguration("focus-blocker")
				.update(
					"intervalMin",
					msg.intervalMin,
					vscode.ConfigurationTarget.Global
				);
			await vscode.workspace
				.getConfiguration("focus-blocker")
				.update("breakMin", msg.breakMin, vscode.ConfigurationTarget.Global);

			vscode.window.showInformationMessage(localize('focusBlocker.settings.saved', 'Settings saved!'));

			await vscode.commands.executeCommand("workbench.action.openSettingsJson");

			panel.dispose();
		}
	});
}
