export interface Config {
  name: string;
  version: string;
  debug?: boolean;
}

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';