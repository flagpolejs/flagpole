export declare enum ConsoleColor {
    Reset = "\u001B[0m",
    Bright = "\u001B[1m",
    Dim = "\u001B[2m",
    Underscore = "\u001B[4m",
    Blink = "\u001B[5m",
    Reverse = "\u001B[7m",
    Hidden = "\u001B[8m",
    FgBlack = "\u001B[30m",
    FgRed = "\u001B[31m",
    FgGreen = "\u001B[32m",
    FgYellow = "\u001B[33m",
    FgBlue = "\u001B[34m",
    FgMagenta = "\u001B[35m",
    FgCyan = "\u001B[36m",
    FgWhite = "\u001B[37m",
    BgBlack = "\u001B[40m",
    BgRed = "\u001B[41m",
    BgGreen = "\u001B[42m",
    BgYellow = "\u001B[43m",
    BgBlue = "\u001B[44m",
    BgMagenta = "\u001B[45m",
    BgCyan = "\u001B[46m",
    BgWhite = "\u001B[47m",
}
export declare enum LogLineType {
    Pass = 0,
    Fail = 1,
    Comment = 2,
    Heading = 3,
    Subheading = 4,
    Decoration = 5,
}
export interface iLogLine {
    timestamp: Date;
    color: ConsoleColor;
    message: string;
    type: LogLineType;
    toConsoleString(): string;
    toString(): string;
    toHTML(): string;
    toJson(): string;
    toCsv(): string;
    toTsv(): string;
    toPsv(): string;
    print(): any;
}
export declare abstract class LogLine implements iLogLine {
    timestamp: Date;
    color: ConsoleColor;
    textPrefix: string;
    textSuffix: string;
    message: string;
    type: LogLineType;
    static targetLineLength: number;
    constructor(message: string);
    protected getMergedString(): string;
    protected getClassName(): string;
    print(): void;
    toConsoleString(): string;
    toCsv(): string;
    toTsv(): string;
    toPsv(): string;
    toString(): string;
    toHTML(): string;
    toJson(): any;
}
export declare class HeadingLine extends LogLine implements iLogLine {
    constructor(message: string);
    protected getMergedString(): string;
    toHTML(): string;
}
export declare class SubheadingLine extends LogLine implements iLogLine {
    constructor(message: string);
    toHTML(): string;
}
export declare class DecorationLine extends LogLine implements iLogLine {
    constructor(message: string);
    toHTML(): string;
    toJson(): string;
}
export declare class HorizontalRule extends LogLine implements iLogLine {
    constructor(message?: string);
    protected getMergedString(): string;
    toHTML(): string;
    toJson(): string;
}
export declare class CustomLine extends LogLine implements iLogLine {
    constructor(message: string, color: ConsoleColor);
    toHTML(): string;
    toJson(): string;
}
export declare class LineBreak extends LogLine implements iLogLine {
    constructor();
    toHTML(): string;
    toJson(): string;
}
export declare class CommentLine extends LogLine implements iLogLine {
    textPrefix: string;
    constructor(message: string);
}
export declare class PassLine extends LogLine implements iLogLine {
    textPrefix: string;
    constructor(message: string);
}
export declare class FailLine extends LogLine implements iLogLine {
    textPrefix: string;
    constructor(message: string);
}
