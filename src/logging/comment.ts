import { LogItem, LogItemType } from './logitem';
import { iConsoleLine, CommentLine } from './consoleline';


export class LogComment extends LogItem {

    public readonly type = LogItemType.Comment;
    public readonly className = "comment";

    public toHtml(): string {
        return `
            <li class="${this.className}">
                <span class="message">${this.message}</span>
            </li>
        `;
    }

    public toConsole(): iConsoleLine[] {
        return [
            new CommentLine(this.message)
        ]
    }

}