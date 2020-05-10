import { LogItem } from "./logitem";
import { CommentLine } from "./consoleline";
import { iConsoleLine } from "../interfaces";
import { LineType } from "../enums";

export class LogComment extends LogItem {
  public readonly type: LineType = "comment";
  public readonly className = "comment";

  public toHtml(): string {
    return `
            <li class="${this.className}">
                <span class="message">${this.message}</span>
            </li>
        `;
  }

  public toConsole(): iConsoleLine[] {
    return [new CommentLine(this.message)];
  }
}
