import { LogItem } from "./log-item";
import { CommentLine } from "./console-line";
import { iConsoleLine, LineType } from "../interfaces/iconsole-log";

export class LogComment extends LogItem {
  public readonly type: LineType = LineType.comment;
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
