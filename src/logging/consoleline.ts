import { stripIndents, oneLine } from 'common-tags';

export enum ConsoleColor {

    Bold = "\u001b[1m",
    Underlined = "\u001b[4m",
    Reversed = "\u001b[7m",

    Reset = "\x1b[0m",
    Bright = "\x1b[1m",
    Dim = "\x1b[2m",
    Underscore = "\x1b[4m",
    UnderscoreEnd = "\x1b[24m",
    Blink = "\x1b[5m",
    Reverse = "\x1b[7m",
    Unreverse = "\x1b[27m",
    Hidden = "\x1b[8m",

    FgBlack = "\x1b[30m",
    FgRed = "\x1b[31m",
    FgGreen = "\x1b[32m",
    FgYellow = "\x1b[33m",
    FgBlue = "\x1b[34m",
    FgMagenta = "\x1b[35m",
    FgCyan = "\x1b[36m",
    FgWhite = "\x1b[37m",
    FgGray = "\x1b[90m",

    FgBrightBlack = "\x1b[30;1m",
    FgBrightRed = "\x1b[31;1m",
    FgBrightGreen = "\x1b[32;1m",
    FgBrightYellow = "\x1b[33;1m",
    FgBrightBlue = "\x1b[34;1m",
    FgBrightMagenta = "\x1b[35;1m",
    FgBrightCyan = "\x1b[36;1m",
    FgBrightWhite = "\x1b[37;1m",

    BgBlack = "\x1b[40m",
    BgRed = "\x1b[41m",
    BgGreen = "\x1b[42m",
    BgYellow = "\x1b[43m",
    BgBlue = "\x1b[44m",
    BgMagenta = "\x1b[45m",
    BgCyan = "\x1b[46m",
    BgWhite = "\x1b[47m",

    BgBrightBlack = "\x1b[40;1m",
    BgBrightRed = "\x1b[41;1m",
    BgBrightGreen = "\x1b[42;1m",
    BgBrightYellow = "\x1b[43;1m",
    BgBrightBlue = "\x1b[44;1m",
    BgBrightMagenta = "\x1b[45;1m",
    BgBrightCyan = "\x1b[46;1m",
    BgBrightWhite = "\x1b[47;1m"

}

export enum ConsoleLineType {
    Pass,
    Fail,
    Comment,
    Detail,
    Heading,
    Subheading,
    Decoration
}

export interface iConsoleLine {
    timestamp: Date
    color: ConsoleColor
    message: string
    type: ConsoleLineType
    toConsoleString(): string
    toString(): string
}

export abstract class ConsoleLine implements iConsoleLine {

    public timestamp: Date;
    public color: ConsoleColor = ConsoleColor.FgWhite;
    public textPrefix: string = '';
    public textSuffix: string = '';
    public message: string = '';
    public type: ConsoleLineType = ConsoleLineType.Comment;

    static targetLineLength: number = 72;

    constructor(message: string) {
        this.timestamp = new Date();
        this.message = message;
    }

    public toString(): string {
        return `${this.textPrefix} ${this.message} ${this.textSuffix}`;
    }

    protected getClassName(): string {
        return ConsoleLineType[this.type];
    }

    public toConsoleString(): string {
        return this.color + this.toString() + ConsoleColor.Reset;
    }

}

export class HeadingLine extends ConsoleLine implements iConsoleLine {

    constructor(message: string) {
        super(message);
        this.color = ConsoleColor.FgBrightYellow;
        this.type = ConsoleLineType.Heading;
    }

    public toString(): string {
        let text: string = super.toString().trim();
        let padLength: number = Math.ceil((ConsoleLine.targetLineLength - text.length) / 2);
        return oneLine`
            ${this.color}${'='.repeat(padLength)}
            ${text}
            ${'='.repeat(padLength)}
            ${ConsoleColor.Reset}
        `;
    }

}

export class SubheadingLine extends ConsoleLine implements iConsoleLine {

    constructor(message: string) {
        super(message);
        this.color = ConsoleColor.FgWhite;
        this.type = ConsoleLineType.Subheading;
    }

}

export class DecorationLine extends ConsoleLine implements iConsoleLine {

    constructor(message: string) {
        super(message);
        this.color = ConsoleColor.FgYellow;
        this.type = ConsoleLineType.Decoration;
    }

}

export class HorizontalRule extends ConsoleLine implements iConsoleLine {

    constructor(message: string = '=') {
        super(message);
        this.color = ConsoleColor.FgYellow;
        this.type = ConsoleLineType.Decoration;
    }

    public toString(): string {
        let text: string = this.message.trim();
        let reps: number = Math.ceil(ConsoleLine.targetLineLength / text.length);
        return text.repeat(reps);
    }

    public toConsoleString(): string {
        return '';
    }

}

export class CustomLine extends ConsoleLine implements iConsoleLine {

    constructor(message: string, color: ConsoleColor) {
        super(message);
        this.color = color;
        this.type = ConsoleLineType.Comment;
    }

}

export class LineBreak extends ConsoleLine implements iConsoleLine {

    constructor() {
        super(' ');
        this.type = ConsoleLineType.Decoration;
    }

}

export class CommentLine extends ConsoleLine implements iConsoleLine {

    public textPrefix: string = '»';

    constructor(message: string) {
        super(message);
        this.color = ConsoleColor.FgCyan;
        this.type = ConsoleLineType.Comment;
    }

    public toConsoleString(): string {
        return oneLine`
            ${ConsoleColor.Reset} 
            ${ConsoleColor.BgWhite}${ConsoleColor.FgBlack}
            ${this.textPrefix}
            ${ConsoleColor.Reset}
            ${this.message}
            ${ConsoleColor.Reset}
        `;
    }

}

export class PassLine extends ConsoleLine implements iConsoleLine {

    public textPrefix: string = '✔';

    constructor(message: string) {
        super(message);
        this.color = ConsoleColor.FgGreen;
        this.type = ConsoleLineType.Pass;
    }

    public toConsoleString(): string {
        return oneLine`
            ${ConsoleColor.Reset} 
            ${ConsoleColor.BgGreen}${ConsoleColor.FgWhite}
            ${this.textPrefix}
            ${ConsoleColor.Reset}
            ${this.message}
            ${ConsoleColor.Reset} 
        `;
    }

}

export class FailLine extends ConsoleLine implements iConsoleLine {

    public textPrefix: string = '✕';

    constructor(message: string) {
        super(message);
        this.color = ConsoleColor.FgRed;
        this.type = ConsoleLineType.Fail;
    }

    public toConsoleString(): string {
        return oneLine`
            ${ConsoleColor.Reset} 
            ${ConsoleColor.BgRed}${ConsoleColor.FgWhite}
            ${this.textPrefix}
            ${ConsoleColor.Reset}
            ${this.message}
            ${ConsoleColor.Reset}
        `;
    }

}

export class OptionalFailLine extends ConsoleLine implements iConsoleLine {

    public textPrefix: string = '✕';

    constructor(message: string) {
        super(message);
        this.color = ConsoleColor.FgMagenta;
        this.type = ConsoleLineType.Comment;
        this.textSuffix = '[Optional]'
    }

    public toConsoleString(): string {
        return oneLine`
            ${ConsoleColor.Reset} 
            ${ConsoleColor.BgMagenta}${ConsoleColor.FgWhite}
            ${this.textPrefix}
            ${ConsoleColor.Reset}
            ${this.message} [Optional]
            ${ConsoleColor.Reset}
        `;
    }

}

export class WarningLine extends ConsoleLine implements iConsoleLine {

    public textPrefix: string = '  !   Warning: ';

    constructor(message: string) {
        super(message);
        this.color = ConsoleColor.FgBrightYellow;
        this.type = ConsoleLineType.Comment;
    }

}

export class DetailLine extends ConsoleLine implements iConsoleLine {

    public textPrefix: string = '…';

    constructor(message: string) {
        super(message);
        this.color = ConsoleColor.FgYellow;
        this.type = ConsoleLineType.Comment;
    }

    public toConsoleString(): string {
        return oneLine`
            ${ConsoleColor.Reset} 
            ${ConsoleColor.BgWhite}${ConsoleColor.FgBlack}
            ${this.textPrefix}
            ${ConsoleColor.Reset}
            ${this.message}
            ${ConsoleColor.Reset}
        `;
    }

}

export class SourceCodeBlock extends ConsoleLine implements iConsoleLine {

    public textPrefix: string = '         ';

    protected highlight: string | null = null;

    constructor(message: string, highlight?: string) {
        super(message);
        this.color = ConsoleColor.FgWhite;
        this.type = ConsoleLineType.Comment;
        this.highlight = highlight || null;
    }

    public toConsoleString(): string {
        const lines: string[] = this._codeHighlight(this.message)
            .split("\n");
        let out: string = `${this.color}\n`;
        lines.forEach((line: string) => {
            out += `${this.textPrefix}${line}\n`;
        });
        out += `${ConsoleColor.Reset}\n`
        return out;
    }

    protected _codeHighlight(source: string): string {
        // Highlight the text
        if (this.highlight !== null) {
            const regex = new RegExp(`(${this.highlight})`, 'ig');
            source = source.replace(
                regex,
                `${ConsoleColor.Reverse}$1${ConsoleColor.Unreverse}`
            );
        }
        // Color the code
        source = source
            .replace(/ ([a-z-]+)=/ig, ` ${ConsoleColor.FgMagenta}$1${this.color}=`)
            .replace(/="([^"]+)"/ig, `="${ConsoleColor.FgGreen}$1${this.color}"`)
            .replace(/='([^']+)"/ig, `='${ConsoleColor.FgGreen}$1${this.color}'`)
            .replace(/<([a-z-]+) /ig, `<${ConsoleColor.FgYellow}$1${this.color} `)
            .replace(/<(\/[a-z-]+)>/ig, `<${ConsoleColor.FgYellow}$1${this.color}>`);
        // Donezo
        return source;
    }

}