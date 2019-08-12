import * as child_process from 'child_process';
import * as vscode from 'vscode';

import * as clang from './contract';

export class ConfigurationTester implements vscode.Disposable {
  processes: Map<number, child_process.ChildProcess>;
  constructor() {
    this.processes = new Map<number, child_process.ChildProcess>();
  }
  test(language: string, document: vscode.TextDocument): void {
    let [cmd, args] = clang.check(language);
    let filepath = document.uri.path;
    args.push(filepath);
    let proc = child_process.execFile(cmd, args, (error, stdout, stderr) => {
      if (error) {
        if ((<any>error).code === 'ENOENT') {
          vscode.window.showErrorMessage(
              'Please install [Bottle](https://github.com/vntchain/bottle/) or check configuration `bottle.executable`');
        }
        // else {
        //   vscode.window.showErrorMessage(
        //       'Please check your configurations: ' +
        //       stderr.toString().trim());
        // }
      }
      this.processes.delete(proc.pid);
    });
    proc.stdin.end('int main() { return 0; }\n');
    this.processes.set(proc.pid, proc);
  }
  dispose() {
    for (let proc of Array.from(this.processes.values())) {
      proc.kill();
    }
  }
}

export class ConfigurationViewer implements vscode.Disposable {
  chan: vscode.OutputChannel;
  constructor() {
    this.chan = vscode.window.createOutputChannel('Clang Configuration');
  }
  show(document: vscode.TextDocument) {
    let [command, args] = clang.command(document.languageId);
    this.chan.show();
    this.chan.clear();
    let buf = [];
    buf.push(`Executable: ${command}`);
    args.forEach((arg, i) => {
      buf.push(`Option ${i}: ${arg}`);
    });
    this.chan.appendLine(buf.join('\n'));
  }
  dispose() {
    this.chan.dispose();
  }
}
