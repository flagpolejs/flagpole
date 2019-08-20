
const ESC: string = '\x1b[';
const FONT_SUFFIX: string = 'm';

const CURSOR_UP: string = 'A';
const CURSOR_DOWN: string = 'B';
const CURSOR_RIGHT: string = 'C';
const CURSOR_LEFT: string = 'D';
const NEXT_LINE: string = 'E';
const PREV_LINE: string = 'F';
const CURSOR_MOVE_TO_X: string = 'G';
const CURSOR_MOVE_TO: string = 'H';
const CURSOR_REPORT_POS: string = 'R';
const SCROLL_UP: string = 'S';
const SCROLL_DOWN: string = 'T';
const CURSOR_SAVE_POS: string = 's';
const CURSOR_RESTORE_POS: string = 'u';
const CURSOR_QUERY_POS: string = '6n';
const CURSOR_HIDE: string = '?25l';
const CURSOR_SHOW: string = '?25h';
const ERASE_DOWN: string = 'J';
const ERASE_UP: string = '1J';
const ERASE_SCREEN: string = '2J';
const ERASE_END_LINE: string = 'K';
const ERASE_START_LINE: string = '1K';
const ERASE_LINE: string = '2K';


const FG_BLACK: string = '30';
const FG_RED: string = '31';
const FG_GREEN: string = '32';
const FG_YELLOW: string = '33';
const FG_BLUE: string = '34';
const FG_MAGENTA: string = '35';
const FG_CYAN: string = '36';
const FG_WHITE: string = '37';
const FG_GREY: string = '90';

const BG_BLACK: string = '40';
const BG_RED: string = '41';
const BG_GREEN: string = '42';
const BG_YELLOW: string = '43';
const BG_BLUE: string = '44';
const BG_MAGENTA: string = '45';
const BG_CYAN: string = '46';
const BG_WHITE: string = '47';

const FONT_BRIGHT: string = '1';
const FONT_DIM: string = '2';
const FONT_UNDERSCORE: string = '4';
const FONT_BLINK: string = '5';
const FONT_INVERSE: string = '7';
const FONT_HIDDEN: string = '8';

const FONT_RESET: string = '0';
const FONT_END_BOLD: string = '22';
const FONT_END_ITALIC: string = '23';
const FONT_END_UNDERLINED: string = '24';
const FONT_END_INVERSE: string = '27';


export class CliAnsi {

    public write(...args: string[]) {
        args.forEach((arg) => {
            process.stdout.write(arg)
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

    public cursorTo (x: number, y: number): string {
        if (typeof x !== 'number') {
            throw new TypeError('The `x` argument is required');
        }
        if (typeof y !== 'number') {
            return `${ESC}${x + 1}${CURSOR_MOVE_TO_X}`;
        }
        return `${ESC}${y + 1};${x + 1}${CURSOR_MOVE_TO}`;
    };

    public cursorMove (x: number, y: number): string {
        return this.cursorMoveX(x) + this.cursorMoveY(y);
    }

    public cursorMoveX(x: number): string {
        if (x < 0) {
            return `${ESC}${x * -1}${CURSOR_LEFT}`;
        }
        else if (x > 0) {
            return `${ESC}${x}${CURSOR_RIGHT}`;
        }
        return '';
    }

    public cursorMoveY(y: number): string {
        if (y < 0) {
            return `${ESC}${y * -1}${CURSOR_UP}`;
        }
        else if (y > 0) {
            return `${ESC}${y}${CURSOR_DOWN}`;
        }
        return '';
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

    public eraseLines (numLines: number) {
        let clear = '';
        for (let i = 0; i < numLines; i++) {
            clear += this.eraseLine();
            if (i < numLines - 1) {
                clear += this.cursorUp();
            }
        }
        return clear;
    };

}