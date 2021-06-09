import { iConsoleLine, iLogItem } from "../interfaces";
import { LineType } from "../enums";
import { CustomLine } from "./consoleline";

export abstract class LogItem implements iLogItem {
  public abstract readonly type: LineType;
  public abstract readonly className: string;

  public get passed(): boolean {
    return false;
  }

  public get failed(): boolean {
    return false;
  }

  public get isOptional(): boolean {
    return false;
  }

  public readonly message: string;
  public readonly timestamp: Date;

  constructor(message: string) {
    this.timestamp = new Date();
    this.message = String(message);
  }

  public toString(): string {
    return `${this.message}`;
  }

  public toConsole(): iConsoleLine[] {
    return [new CustomLine(this.message, [255, 255, 255])];
  }

  public toHtml(): string {    
    let html: string = "";
    html += '<li class="${this.className}">';
    html += `<span class="message">${this.message}</span>`;
    if (this.failed) {
      html += `<div>${this['detailsMessage']}</div>`
    }
    html += '</li>';
    return html;
  }

  public toJson(): any {
    return {
      timestamp: this.timestamp,
      type: this.className,
      message: this.message,
    };
  }

  public toCsv(): string {
    return (
      `"${this.timestamp.toUTCString()}","${this.className}",` +
      // CSV escapes a double quote with two double quotes
      `"${String(this.message).replace(/"/g, '""')}"`
    );
  }

  public toTsv(): string {
    return `${this.timestamp.toUTCString()}\t${this.className}\t${
      this.message
    }`;
  }

  public toPsv(): string {
    return `${this.timestamp.toUTCString()}|${this.className}|${this.message}`;
  }
}
