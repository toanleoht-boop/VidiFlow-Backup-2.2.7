import { appLog } from "./logger.js";

export class StepLogger {
  private logs: string[] = [];

  constructor() {}

  public log(msg: string): void {
    appLog(msg);
    this.logs.push(msg);
  }

  public getLogs(): string[] {
    return this.logs;
  }
}
