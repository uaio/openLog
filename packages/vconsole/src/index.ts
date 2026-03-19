/**
 * AIConsole - Frontend SDK for AI Console
 */

export const version = '0.1.0';

export class AIConsole {
  private readonly version: string;

  constructor() {
    this.version = version;
  }

  public getVersion(): string {
    return this.version;
  }
}

export default AIConsole;
