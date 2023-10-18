import { App } from 'octokit';

export interface Module {
  (app: App): void;
}

export const register = (app: App, m: Module) => m(app);
