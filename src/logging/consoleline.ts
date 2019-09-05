import { oneLine } from 'common-tags';
import { CliAnsi } from '../cli/cli-ansi';
import { iConsoleLine } from '../interfaces';
import { ConsoleColor, ConsoleLineType } from '../enums';

const Ansi = new CliAnsi();

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
        this.color = ConsoleColor.FgYellow;
        this.type = ConsoleLineType.Subheading;
    }

    public toString(): string {
        let text: string = super.toString().trim();
        return ` ${Ansi.fgYellow(Ansi.underlined(text))} \n`;
    }

}

export class SectionHeadingLine extends ConsoleLine implements iConsoleLine {

    constructor(message: string) {
        super(message);
        this.color = ConsoleColor.FgBrightWhite;
        this.type = ConsoleLineType.Subheading;
    }

    public toString(): string {
        let text: string = super.toString().trim();
        return `      ${Ansi.fgWhite(Ansi.bold(text))}`;
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
            ${Ansi.bgRgb(Ansi.fgBlack(' ' + this.textPrefix + ' '), 150, 150, 150)}
            ${Ansi.fgRgb(this.message, 120, 120, 120)}
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
            ${Ansi.bgGreen(Ansi.fgWhite(' ' + this.textPrefix + ' '))}
            ${this.message}
            ${ConsoleColor.Reset} 
        `;
    }

}

export class ActionCompletedLine extends PassLine implements iConsoleLine {

    protected _verb: string;
    protected _noun: string;

    constructor(verb: string, noun: string) {
        super(`${verb} ${noun}`);
        this._verb = verb;
        this._noun = noun;
    }

    public toConsoleString(): string {
        return oneLine`
            ${ConsoleColor.Reset} 
            ${Ansi.bgGreen(Ansi.fgWhite(' ' + this.textPrefix + ' '))}
            ${Ansi.bgRgb(` ${this._verb} `, 65, 65, 65)}
            ${Ansi.fgRgb(this._noun, 120, 120, 120)}
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
            ${Ansi.bgRed(Ansi.fgWhite(' ' + this.textPrefix + ' '))}
            ${this.message}
            ${ConsoleColor.Reset}
        `;
    }

}

export class ActionFailedLine extends FailLine implements iConsoleLine {

    protected _verb: string;
    protected _noun: string;

    constructor(verb: string, noun: string) {
        super(`${verb} ${noun}`);
        this._verb = verb;
        this._noun = noun;
    }

    public toConsoleString(): string {
        return oneLine`
            ${ConsoleColor.Reset} 
            ${Ansi.bgRed(Ansi.fgWhite(' ' + this.textPrefix + ' '))}
            ${Ansi.bgRgb(` ${this._verb} `, 65, 65, 65)}
            ${Ansi.fgRgb(this._noun, 120, 120, 120)}
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
        this.textSuffix = '[Optional]';
    }

    public toConsoleString(): string {
        return oneLine`
            ${ConsoleColor.Reset} 
            ${Ansi.bgMagenta(Ansi.fgWhite(' ' + this.textPrefix + ' '))}
            ${this.message} [Optional]
            ${ConsoleColor.Reset}
        `;
    }

}

export class WarningLine extends ConsoleLine implements iConsoleLine {

    public textPrefix: string = '!';

    constructor(message: string) {
        super(message);
        this.color = ConsoleColor.FgMagenta;
        this.type = ConsoleLineType.Comment;
    }

    public toConsoleString(): string {
        return oneLine`
            ${ConsoleColor.Reset} 
            ${Ansi.bgMagenta(Ansi.fgWhite(' ' + this.textPrefix + ' '))}
            ${this.message}
            ${ConsoleColor.Reset}
        `;
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
            ${Ansi.bgWhite(Ansi.fgBlack(' ' + this.textPrefix + ' '))}
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
                `${ConsoleColor.Highlight}$1${ConsoleColor.Unhighlight}`
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