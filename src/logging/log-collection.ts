import { iLogItem } from "../interfaces/ilog-item";

export class LogCollection {
  protected _logItems: iLogItem[] = [];

  public get items(): iLogItem[] {
    return this._logItems;
  }

  public add(item: iLogItem) {
    if (item && Reflect.has(item, "className")) {
      this._logItems.push(item);
      return;
    }
    throw new TypeError(`Not a log item: ${item}`);
  }
}
