import { oneLine } from "common-tags";
import Ansi, { FG_MAGENTA, FG_GREEN, FG_YELLOW } from "cli-ansi";
import { iConsoleLine } from "../interfaces";
import { ConsoleLineType } from "../enums";

export abstract class ConsoleLine implements iConsoleLine {
  public timestamp: Date;
  public textPrefix: string = "";
  public textSuffix: string = "";
  public message: string = "";
  public fg: [number, number, number] = [255, 255, 255];
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
    return Ansi.fgRgb(this.toString(), this.fg[0], this.fg[1], this.fg[2]);
  }
}

export class HeadingLine extends ConsoleLine implements iConsoleLine {
  constructor(message: string) {
    super(message);
    this.fg = [255, 255, 0];
    this.type = ConsoleLineType.Heading;
  }

  public toString(): string {
    let text: string = super.toString().trim();
    let padLength: number = Math.ceil(
      (ConsoleLine.targetLineLength - text.length) / 2
    );
    return oneLine`
            ${"=".repeat(padLength)}
            ${text}
            ${"=".repeat(padLength)}
        `;
  }
}

export class SubheadingLine extends ConsoleLine implements iConsoleLine {
  constructor(message: string) {
    super(message);
    this.fg = [255, 255, 0];
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
    this.fg = [255, 255, 255];
    this.type = ConsoleLineType.Subheading;
  }

  public toString(): string {
    let text: string = super.toString().trim();
    return `      ${Ansi.fgWhite(Ansi.bold(text))}`;
  }
}

export class CustomLine extends ConsoleLine implements iConsoleLine {
  constructor(message: string, fg: [number, number, number]) {
    super(message);
    this.fg = fg;
    this.type = ConsoleLineType.Comment;
  }
}

export class LineBreak extends ConsoleLine implements iConsoleLine {
  constructor() {
    super(" ");
    this.type = ConsoleLineType.Decoration;
  }
}

export class CommentLine extends ConsoleLine implements iConsoleLine {
  public textPrefix: string = "»";

  constructor(message: string) {
    super(message);
    this.fg = [0, 255, 255];
    this.type = ConsoleLineType.Comment;
  }

  public toConsoleString(): string {
    return oneLine`
            ${Ansi.bgRgb(
              Ansi.fgBlack(" " + this.textPrefix + " "),
              150,
              150,
              150
            )}
            ${Ansi.fgRgb(this.message, 120, 120, 120)}
        `;
  }
}

export class PassLine extends ConsoleLine implements iConsoleLine {
  public textPrefix: string = "✔";

  constructor(message: string) {
    super(message);
    this.fg = [0, 255, 0];
    this.type = ConsoleLineType.Pass;
  }

  public toConsoleString(): string {
    return oneLine`
            ${Ansi.bgGreen(Ansi.fgWhite(" " + this.textPrefix + " "))}
            ${this.message}
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
            ${Ansi.bgGreen(Ansi.fgWhite(" " + this.textPrefix + " "))}
            ${Ansi.bgRgb(` ${this._verb} `, 65, 65, 65)}
            ${Ansi.fgRgb(this._noun, 120, 120, 120)}
        `;
  }
}

export class FailLine extends ConsoleLine implements iConsoleLine {
  public textPrefix: string = "✕";

  constructor(message: string) {
    super(message);
    this.fg = [255, 0, 0];
    this.type = ConsoleLineType.Fail;
  }

  public toConsoleString(): string {
    return oneLine`
            ${Ansi.bgRed(Ansi.fgWhite(" " + this.textPrefix + " "))}
            ${this.message}
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
            ${Ansi.bgRed(Ansi.fgWhite(" " + this.textPrefix + " "))}
            ${Ansi.bgRgb(` ${this._verb} `, 65, 65, 65)}
            ${Ansi.fgRgb(this._noun, 120, 120, 120)}
        `;
  }
}

export class OptionalFailLine extends ConsoleLine implements iConsoleLine {
  public textPrefix: string = "✕";

  constructor(message: string) {
    super(message);
    this.fg = [255, 100, 100];
    this.type = ConsoleLineType.Comment;
    this.textSuffix = "[Optional]";
  }

  public toConsoleString(): string {
    return oneLine`
            ${Ansi.bgMagenta(Ansi.fgWhite(" " + this.textPrefix + " "))}
            ${this.message} [Optional]
        `;
  }
}

export class WarningLine extends ConsoleLine implements iConsoleLine {
  public textPrefix: string = "!";

  constructor(message: string) {
    super(message);
    this.fg = [255, 100, 100];
    this.type = ConsoleLineType.Comment;
  }

  public toConsoleString(): string {
    return oneLine`
            ${Ansi.bgMagenta(Ansi.fgWhite(" " + this.textPrefix + " "))}
            ${this.message}
        `;
  }
}

export class DetailLine extends ConsoleLine implements iConsoleLine {
  public textPrefix: string = "…";

  constructor(message: string) {
    super(message);
    this.fg = [255, 255, 0];
    this.type = ConsoleLineType.Comment;
  }

  public toConsoleString(): string {
    return oneLine`
            ${Ansi.bgWhite(Ansi.fgBlack(" " + this.textPrefix + " "))}
            ${this.message}
        `;
  }
}

export class SourceCodeBlock extends ConsoleLine implements iConsoleLine {
  public textPrefix: string = "         ";

  protected highlight: string | null = null;

  constructor(message: string, highlight?: string) {
    super(message);
    this.fg = [255, 255, 255];
    this.type = ConsoleLineType.Comment;
    this.highlight = highlight || null;
  }

  public toConsoleString(): string {
    const lines: string[] = this._codeHighlight(this.message).split("\n");
    let out: string = `\n`;
    lines.forEach((line: string) => {
      out += `${this.textPrefix}${line}\n`;
    });
    return out;
  }

  protected _codeHighlight(source: string): string {
    // Highlight the text
    if (this.highlight !== null) {
      const regex = new RegExp(`(${this.highlight})`, "ig");
      source = source.replace(
        regex,
        `${Ansi.startInverse}$1${Ansi.endInverse}`
      );
    }
    // Color the code
    source = source
      .replace(
        / ([a-z-]+)=/gi,
        ` ${Ansi.esc(FG_MAGENTA)}$1${Ansi.startFgRgb(this.fg)}=`
      )
      .replace(
        /="([^"]+)"/gi,
        `="${Ansi.esc(FG_GREEN)}$1${Ansi.startFgRgb(this.fg)}"`
      )
      .replace(
        /='([^']+)"/gi,
        `='${Ansi.esc(FG_GREEN)}$1${Ansi.startFgRgb(this.fg)}'`
      )
      .replace(
        /<([a-z-]+) /gi,
        `<${Ansi.esc(FG_YELLOW)}$1${Ansi.startFgRgb(this.fg)} `
      )
      .replace(
        /<(\/[a-z-]+)>/gi,
        `<${Ansi.esc(FG_YELLOW)}$1${Ansi.startFgRgb(this.fg)}>`
      );
    // Donezo
    return source;
  }
}
