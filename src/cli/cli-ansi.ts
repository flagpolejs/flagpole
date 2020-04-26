const ESC: string = "\x1b[";

const CURSOR_UP: string = "A";
const CURSOR_DOWN: string = "B";
const CURSOR_RIGHT: string = "C";
const CURSOR_LEFT: string = "D";
const NEXT_LINE: string = "E";
const PREV_LINE: string = "F";
const CURSOR_MOVE_TO_X: string = "G";
const CURSOR_MOVE_TO: string = "H";
const CURSOR_REPORT_POS: string = "R";
const SCROLL_UP: string = "S";
const SCROLL_DOWN: string = "T";
const CURSOR_SAVE_POS: string = "s";
const CURSOR_RESTORE_POS: string = "u";
const CURSOR_QUERY_POS: string = "6n";
const CURSOR_HIDE: string = "?25l";
const CURSOR_SHOW: string = "?25h";
const ERASE_DOWN: string = "J";
const ERASE_UP: string = "1J";
const ERASE_SCREEN: string = "2J";
const ERASE_END_LINE: string = "K";
const ERASE_START_LINE: string = "1K";
const ERASE_LINE: string = "2K";

const FG_BLACK: string = "30m";
const FG_RED: string = "31m";
const FG_GREEN: string = "32m";
const FG_YELLOW: string = "33m";
const FG_BLUE: string = "34m";
const FG_MAGENTA: string = "35m";
const FG_CYAN: string = "36m";
const FG_WHITE: string = "37m";
const FG_RGB: string = "38;2;";
const FG_CUSTOM: string = "38;5;";
const FG_DEFAULT: string = "39m";

const BG_BLACK: string = "40m";
const BG_RED: string = "41m";
const BG_GREEN: string = "42m";
const BG_YELLOW: string = "43m";
const BG_BLUE: string = "44m";
const BG_MAGENTA: string = "45m";
const BG_CYAN: string = "46m";
const BG_WHITE: string = "47m";
const BG_RGB: string = "48;2;";
const BG_CUSTOM: string = "48;5;";
const BG_DEFAULT: string = "49m";

const FONT_BOLD: string = "1m";
const FONT_LIGHT: string = "2m";
const FONT_ITALIC: string = "3m";
const FONT_UNDERLINED: string = "4m";
const FONT_BLINK: string = "5m";
const FONT_FAST_BLINK: string = "6m";
const FONT_INVERSE: string = "7m";
const FONT_HIDDEN: string = "8m";
const FONT_STRIKETHROUGH: string = "9m";
const FONT_BORDER: string = "51m";
const FONT_ROUNDED_BORDER: string = "52m";
const FONT_OVERLINE: string = "53m";

const FONT_RESET: string = "0m";
const FONT_END_BOLD: string = "21m";
const FONT_END_LIGHT: string = "22m";
const FONT_END_ITALIC: string = "23m";
const FONT_END_UNDERLINED: string = "24m";
const FONT_END_BLINK: string = "25m";
const FONT_END_FAST_BLINK: string = "26m";
const FONT_END_INVERSE: string = "27m";
const FONT_END_HIDDEN: string = "28m";
const FONT_END_STRIKETHROUGH: string = "29m";
const FONT_END_BORDER: string = "54m";
const FONT_END_OVERLINE: string = "54m";

export class CliAnsi {
  private getArrayIfLineBreaks(content: string | string[]): string | string[] {
    return typeof content === "string" && content.includes("\n")
      ? content.split("\n")
      : content;
  }

  private getLongestLine(content: string[]): number {
    let longestLine: number = 0;
    content.forEach((line) => {
      if (line.length > longestLine) {
        longestLine = line.length;
      }
    });
    return longestLine;
  }

  public write(...args: string[]) {
    args.forEach((arg) => {
      process.stdout.write(arg);
    });
  }

  public writeLine(...args: string[]) {
    this.write.apply(this, args.concat(["\n"]));
  }

  public writeLines(...args: string[]) {
    args.forEach((arg) => {
      this.writeLine(arg);
    });
  }

  public cursorTo(x: number, y: number): string {
    if (typeof x !== "number") {
      throw new TypeError("The `x` argument is required");
    }
    if (typeof y !== "number") {
      return `${ESC}${x + 1}${CURSOR_MOVE_TO_X}`;
    }
    return `${ESC}${y + 1};${x + 1}${CURSOR_MOVE_TO}`;
  }

  public cursorMove(x: number, y: number): string {
    return this.cursorMoveX(x) + this.cursorMoveY(y);
  }

  public cursorMoveX(x: number): string {
    if (x < 0) {
      return `${ESC}${x * -1}${CURSOR_LEFT}`;
    } else if (x > 0) {
      return `${ESC}${x}${CURSOR_RIGHT}`;
    }
    return "";
  }

  public cursorMoveY(y: number): string {
    if (y < 0) {
      return `${ESC}${y * -1}${CURSOR_UP}`;
    } else if (y > 0) {
      return `${ESC}${y}${CURSOR_DOWN}`;
    }
    return "";
  }

  public cursorUp(n: number = 1): string {
    return `${ESC}${n}${CURSOR_UP}`;
  }

  public cursorDown(n: number = 1): string {
    return `${ESC}${n}${CURSOR_DOWN}`;
  }

  public cursorLeft(n: number = 1): string {
    return `${ESC}${n}${CURSOR_LEFT}`;
  }

  public cursorRight(n: number = 1): string {
    return `${ESC}${n}${CURSOR_RIGHT}`;
  }

  public cursorHome(): string {
    return `${ESC}${CURSOR_LEFT}`;
  }

  public cursorPreviousLine(): string {
    return `${ESC}${PREV_LINE}`;
  }

  public cursorNextLine(): string {
    return `${ESC}${NEXT_LINE}`;
  }

  public cursorHide(): string {
    return `${ESC}${CURSOR_HIDE}`;
  }

  public cursorShow(): string {
    return `${ESC}${CURSOR_SHOW}`;
  }

  public cursorSavePosition(): string {
    return `${ESC}${CURSOR_SAVE_POS}`;
  }

  public cursorRestorePosition(): string {
    return `${ESC}${CURSOR_RESTORE_POS}`;
  }

  public cursorQueryPosition(): string {
    return `${ESC}${CURSOR_QUERY_POS}`;
  }

  public eraseLine(): string {
    return `${ESC}${ERASE_LINE}`;
  }

  public eraseLines(numLines: number) {
    let clear = "";
    for (let i = 0; i < numLines; i++) {
      clear += this.eraseLine();
      if (i < numLines - 1) {
        clear += this.cursorUp();
      }
    }
    return clear;
  }

  public bold(str: string) {
    return `${ESC}${FONT_BOLD}${str}${ESC}${FONT_END_BOLD}`;
  }

  public underlined(str: string) {
    return `${ESC}${FONT_UNDERLINED}${str}${ESC}${FONT_END_UNDERLINED}`;
  }

  public italic(str: string) {
    return `${ESC}${FONT_ITALIC}${str}${ESC}${FONT_END_ITALIC}`;
  }

  public light(str: string) {
    return `${ESC}${FONT_LIGHT}${str}${ESC}${FONT_END_LIGHT}`;
  }

  public blink(str: string) {
    return `${ESC}${FONT_BLINK}${str}${ESC}${FONT_END_BLINK}`;
  }

  public inverse(str: string) {
    return `${ESC}${FONT_INVERSE}${str}${ESC}${FONT_END_INVERSE}`;
  }

  public border(str: string) {
    return `${ESC}${FONT_BORDER}${str}${ESC}${FONT_END_BORDER}`;
  }

  public roundedBorder(str: string) {
    return `${ESC}${FONT_ROUNDED_BORDER}${str}${ESC}${FONT_END_BORDER}`;
  }

  public strikethrough(str: string) {
    return `${ESC}${FONT_STRIKETHROUGH}${str}${ESC}${FONT_END_STRIKETHROUGH}`;
  }

  public hidden(str: string) {
    return `${ESC}${FONT_HIDDEN}${str}${ESC}${FONT_END_HIDDEN}`;
  }

  public center(
    content: string | string[],
    targetLength?: number,
    padChar: string = " "
  ): string {
    content = this.getArrayIfLineBreaks(content);
    if (typeof content === "string") {
      const regex: RegExp = new RegExp(`${ESC}[^m]+m`, "g");
      const len: number = content.replace(regex, "").length;
      targetLength = targetLength || len;
      const padLeft: number = Math.max(0, Math.floor((targetLength - len) / 2));
      const padRight: number = Math.max(0, Math.ceil((targetLength - len) / 2));
      return `${padChar.repeat(padLeft)}${content}${padChar.repeat(padRight)}`;
    } else {
      targetLength = targetLength || this.getLongestLine(content);
      content = content.map((line) => {
        return this.center(line, targetLength, padChar);
      });
      return content.join("\n");
    }
  }

  public left(
    content: string | string[],
    targetLength?: number,
    padChar: string = " "
  ): string {
    content = this.getArrayIfLineBreaks(content);
    if (typeof content === "string") {
      const regex: RegExp = new RegExp(`${ESC}[^m]+m`, "g");
      const len: number = content.replace(regex, "").length;
      targetLength = targetLength || len;
      const padding: number = Math.max(targetLength - len, 1);
      return `${content}${padChar.repeat(padding)}`;
    } else {
      targetLength = targetLength || this.getLongestLine(content);
      content = content.map((line) => {
        return this.left(line, targetLength, padChar);
      });
      return content.join("\n");
    }
  }

  public right(
    content: string | string[],
    targetLength?: number,
    padChar: string = " "
  ): string {
    content = this.getArrayIfLineBreaks(content);
    if (typeof content === "string") {
      const regex: RegExp = new RegExp(`${ESC}[^m]+m`, "g");
      const len: number = content.replace(regex, "").length;
      targetLength = targetLength || len;
      const padding: number = targetLength - len;
      return `${padChar.repeat(padding)}${content}`;
    } else {
      targetLength = targetLength || this.getLongestLine(content);
      content = content.map((line) => {
        return this.right(line, targetLength, padChar);
      });
      return content.join("\n");
    }
  }

  public bgBlue(str: string) {
    return this._bg(BG_BLUE, str);
  }

  public bgBlack(str: string) {
    return this._bg(BG_BLACK, str);
  }

  public bgCyan(str: string) {
    return this._bg(BG_CYAN, str);
  }

  public bgGreen(str: string) {
    return this._bg(BG_GREEN, str);
  }

  public bgMagenta(str: string) {
    return this._bg(BG_MAGENTA, str);
  }

  public bgRed(str: string) {
    return this._bg(BG_RED, str);
  }

  public bgWhite(str: string) {
    return this._bg(BG_WHITE, str);
  }

  public bgYellow(str: string) {
    return this._bg(BG_YELLOW, str);
  }

  public bgRgb(str: string, r: number, g: number, b: number) {
    return `${ESC}${BG_RGB}${r};${g};${b}m${str}${ESC}${BG_DEFAULT}`;
  }

  public bgCustom(str: string, colorNumber: number) {
    return `${ESC}${BG_CUSTOM}${colorNumber}m${str}${ESC}${BG_DEFAULT}`;
  }

  public fgBlue(str: string) {
    return this._fg(FG_BLUE, str);
  }

  public fgBlack(str: string) {
    return this._fg(FG_BLACK, str);
  }

  public fgCyan(str: string) {
    return this._fg(FG_CYAN, str);
  }

  public fgGreen(str: string) {
    return this._fg(FG_GREEN, str);
  }

  public fgMagenta(str: string) {
    return this._fg(FG_MAGENTA, str);
  }

  public fgRed(str: string) {
    return this._fg(FG_RED, str);
  }

  public fgWhite(str: string) {
    return this._fg(FG_WHITE, str);
  }

  public fgYellow(str: string) {
    return this._fg(FG_YELLOW, str);
  }

  public fgRgb(str: string, r: number, g: number, b: number) {
    return `${ESC}${FG_RGB}${r};${g};${b}m${str}${ESC}${FG_DEFAULT}`;
  }

  public fgCustom(str: string, colorNumber: number) {
    return `${ESC}${FG_CUSTOM}${colorNumber}m${str}${ESC}${FG_DEFAULT}`;
  }

  protected _bg(color: string, str: string) {
    return `${ESC}${color}${str}${ESC}${BG_DEFAULT}`;
  }

  protected _fg(color: string, str: string) {
    return `${ESC}${color}${str}${ESC}${FG_DEFAULT}`;
  }
}
