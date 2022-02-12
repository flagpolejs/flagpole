import { LogItem } from "./log-item";
import { CommentLine, ConsoleLine } from "./console-line";
import { LineType } from "../interfaces/line-type";

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

  public toConsole(): ConsoleLine[] {
    return [new CommentLine(this.message)];
  }
}
