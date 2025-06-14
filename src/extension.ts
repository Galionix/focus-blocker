import * as vscode from "vscode";
import { getWebviewContent } from "./getWebviewContent";
import { openSettingsWebview } from "./openSettingsWebview";
import * as nls from "vscode-nls";

const localize = nls.loadMessageBundle();

let blockerPanel: vscode.WebviewPanel | null = null;
let blockerTimer: NodeJS.Timeout;
let statusBarItem: vscode.StatusBarItem;
let intervalCountdown: NodeJS.Timeout;

export function activate(context: vscode.ExtensionContext) {
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  statusBarItem.tooltip = localize(
    "focusBlocker.status.tooltip",
    "Time until break"
  );
  //   statusBarItem.tooltip = "До перерыва";
  context.subscriptions.push(statusBarItem);
  const log = (msg: string) => {
    console.log(`[focus-blocker] ${msg}`);
    vscode.window.showInformationMessage(
      `[${localize(
        "focusBlocker.configuration.title",
        "Focus Blocker"
      )}] ${msg}`
    );
  };
  context.subscriptions.push(
    vscode.commands.registerCommand("focus-blocker.restartTimer", () => {
      log(localize("focusBlocker.timer.restarted", "Timer restarted manually"));
      clearTimeout(blockerTimer);
      clearInterval(intervalCountdown);
      statusBarItem.hide();
      startBlockerTimer();
    })
  );

  const startBlockerTimer = () => {
    const config = vscode.workspace.getConfiguration("focus-blocker");
    const intervalMin = config.get<number>("intervalMin", 90);
    const intervalMs = intervalMin * 60 * 1000;
    const deadline = Date.now() + intervalMs;

    statusBarItem.show();

    clearInterval(intervalCountdown);
    intervalCountdown = setInterval(() => {
      const msLeft = deadline - Date.now();
      if (msLeft <= 0) {
        statusBarItem.text = localize(
          "focusBlocker.status.break",
          "$(watch) 🔒 Break"
        );
        clearInterval(intervalCountdown);
        return;
      }
      const min = Math.floor(msLeft / 60000);
      const sec = Math.floor((msLeft % 60000) / 1000);

      statusBarItem.text = localize(
        "focusBlocker.status.untilBreak",
        "$(watch) {0}:{1} until break",
        min,
        sec.toString().padStart(2, "0")
      );
    }, 1000);

    // Запуск самого таймера
    blockerTimer = setTimeout(showBlocker, intervalMs);
    log(
      localize(
        "focusBlocker.timer.started",
        "Timer started: {0} minutes",
        intervalMin
      )
    );
  };

  const showBlocker = async () => {
    statusBarItem.hide();
    clearInterval(intervalCountdown);

    log(localize("focusBlocker.blocker.activated", "Blocker activated"));

    // Максимизируем текущую редакторскую панель (сворачиваем все остальные)
    await vscode.commands.executeCommand(
      "workbench.action.minimizeOtherEditors"
    );

    if (blockerPanel) {
      //   log("Старая панель ещё активна — закрываю");
      blockerPanel.dispose();
    }

    blockerPanel = vscode.window.createWebviewPanel(
      "focus-blocker",
      //   "Перерыв",
      localize("focusBlocker.status.break", "$(watch) 🔒 Break"),
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    blockerPanel.webview.html = getWebviewContent({
      title: localize(
        "focusBlocker.webview.breakTitle",
        "🚫 Break! Return in:"
      ),
    });

    const listener = blockerPanel.webview.onDidReceiveMessage((message) => {
      if (message === "done") {
        // log("Перерыв завершён, запускаю таймер заново");
        log(
          localize(
            "focusBlocker.blocker.finished",
            "Break finished, restarting timer"
          )
        );

        blockerPanel?.dispose();
        blockerPanel = null;
        startBlockerTimer();
      }
    });

    blockerPanel.onDidDispose(() => {
      // log("Окно блокера закрыто вручную");
      log(localize("focusBlocker.blocker.closed", "Blocker manually closed"));
      listener.dispose();
      blockerPanel = null;
    });
  };
  startBlockerTimer();
  const disposable = vscode.commands.registerCommand(
    "focus-blocker.activate",
    () => {
      vscode.window.showInformationMessage(
        localize(
          "focusBlocker.activatedMessage",
          "Hello from vscode-focus-blocker!"
        )
      );
    }
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("focus-blocker.openSettings", () => {
      openSettingsWebview();
    })
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push({
    dispose() {
      clearTimeout(blockerTimer);
      log(localize("focusBlocker.deactivated", "Extension deactivated"));
    },
  });
}
