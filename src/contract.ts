import * as child_process from 'child_process';
import * as path from 'path';
import * as vscode from 'vscode';

import * as variable from './variable';


export function getConf<T>(name: string): T {
  let conf = vscode.workspace.getConfiguration('bottle');
  let value = conf.get<T>(name);
  if (value == null) {
    vscode.window.showErrorMessage(`Error: invalid configuration ${name}`);
  }
  return value;
}

export function command(
    language: string, ...options: string[]): [string, string[]] {
  let cmd = variable.resolve(getConf<string>('executable'));
  let args: string[] = [];
  if (language === 'c') {
    args.push('hint')
  }
  args.push(...options);
  return [cmd, args];
}

export function check(language: string): [string, string[]] {
  return command(language, '-code');
}

export function version(language: string): [string, string[]] {
  return command(language, '--version');
}