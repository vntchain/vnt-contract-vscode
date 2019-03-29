import * as vscode from 'vscode';

import * as configuration from './configuration';
import * as clang from './contract';
import * as diagnostic from './diagnostic';

const CLANG_MODE: vscode.DocumentSelector = [{language: 'c', scheme: 'file'}];

class ResidentExtension implements vscode.Disposable {
  extensions: Map<string, vscode.Disposable>;
  constructor() {
    this.extensions = new Map<string, vscode.Disposable>();
    this.update();
  }
  private _updateProvider(
      enable: boolean, name: string, create: () => vscode.Disposable): void {
    if (this.extensions.has(name)) {
      this.extensions.get(name).dispose();
      this.extensions.delete(name);
    }
    if (enable) {
      this.extensions.set(name, create());
    }
  }

  update() {
    this._updateProvider(
        clang.getConf<boolean>('diagnostic.enable'), 'diagnostic',
        () => diagnostic.registerDiagnosticProvider(
            CLANG_MODE, new diagnostic.ClangDiagnosticProvider, 'clang'));
  }

  dispose() {
    for (let disposable of Array.from(this.extensions.values())) {
      disposable.dispose();
    }
  }
}

export function activate(context: vscode.ExtensionContext) {
  let confViewer = new configuration.ConfigurationViewer;
  context.subscriptions.push(confViewer);
  context.subscriptions.push(vscode.commands.registerTextEditorCommand(
      'bottle.showExecConf',
      (editor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
        if (!vscode.languages.match(CLANG_MODE, editor.document)) {
          vscode.window.showErrorMessage(`Current language is not C`);
          return;
        }
        confViewer.show(editor.document);
      }));

  let confTester = new configuration.ConfigurationTester;
  context.subscriptions.push(confTester);
  let subscriptions: vscode.Disposable[] = [];
  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (!editor || !vscode.languages.match(CLANG_MODE, editor.document)) return;
    confTester.test(editor.document.languageId, editor.document);
  }, null, subscriptions);


  let residentExtension: ResidentExtension = new ResidentExtension();
  context.subscriptions.push(residentExtension);
  vscode.workspace.onDidChangeConfiguration(() => {
    residentExtension.update();
  }, null, subscriptions);
  context.subscriptions.push(vscode.Disposable.from(...subscriptions));
}

export function deactivate() {}
