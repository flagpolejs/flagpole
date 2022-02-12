import { LogItem } from "./log-item";

export class LogCollection {
  protected _logItems: LogItem[] = [];

  public get items(): LogItem[] {
    return this._logItems;
  }

  public add(item: LogItem) {
    if (item && Reflect.has(item, "className")) {
      this._logItems.push(item);
      return;
    }
    throw new TypeError(`Not a log item: ${item}`);
  }
}
