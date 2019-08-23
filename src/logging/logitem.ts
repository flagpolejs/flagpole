import { iConsoleLine, CustomLine, ConsoleColor } from './consoleline';

export enum LogItemType {
    Result,
    Comment,
    Heading,
    SummaryData
}

export interface iLogItem {
    type: LogItemType
    className: string
    message: string,
    passed: boolean
    failed: boolean
    isOptional: boolean,
    timestamp: Date
    toConsole(): iConsoleLine[]
    toJson(): any
    toCsv(): string
    toPsv(): string
    toTsv(): string
    toHtml(): string
}

export abstract class LogItem implements iLogItem {

    public abstract readonly type: LogItemType;
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
    public readonly timestamp: Date

    constructor(message: string) {
        this.timestamp = new Date();
        this.message = String(message);
    }

    public toString(): string {
        return `${this.message}`;
    }

    public toConsole(): iConsoleLine[] {
        return [
            new CustomLine(this.message, ConsoleColor.FgWhite)
        ];
    }

    public toHtml(): string {
        return `
            <li class="${this.className}">
                <span class="message">${this.message}</span>
            </li>
        `;
    }

    public toJson(): any {
        return {
            timestamp: this.timestamp,
            type: this.className,
            message: this.message
        }
    }

    public toCsv(): string {
        return `"${this.timestamp.toUTCString()}","${this.className}",` +
            // CSV escapes a double quote with two double quotes
            `"${String(this.message).replace(/"/g, '""')}"`;
    }

    public toTsv(): string {
        return `${this.timestamp.toUTCString()}\t${this.className}\t${this.message}`;
    }

    public toPsv(): string {
        return `${this.timestamp.toUTCString()}|${this.className}|${this.message}`;
    }

}

