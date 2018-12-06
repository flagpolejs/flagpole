"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const flagpole_1 = require("./flagpole");
var ConsoleColor;
(function (ConsoleColor) {
    ConsoleColor["Reset"] = "\u001B[0m";
    ConsoleColor["Bright"] = "\u001B[1m";
    ConsoleColor["Dim"] = "\u001B[2m";
    ConsoleColor["Underscore"] = "\u001B[4m";
    ConsoleColor["Blink"] = "\u001B[5m";
    ConsoleColor["Reverse"] = "\u001B[7m";
    ConsoleColor["Hidden"] = "\u001B[8m";
    ConsoleColor["FgBlack"] = "\u001B[30m";
    ConsoleColor["FgRed"] = "\u001B[31m";
    ConsoleColor["FgGreen"] = "\u001B[32m";
    ConsoleColor["FgYellow"] = "\u001B[33m";
    ConsoleColor["FgBlue"] = "\u001B[34m";
    ConsoleColor["FgMagenta"] = "\u001B[35m";
    ConsoleColor["FgCyan"] = "\u001B[36m";
    ConsoleColor["FgWhite"] = "\u001B[37m";
    ConsoleColor["BgBlack"] = "\u001B[40m";
    ConsoleColor["BgRed"] = "\u001B[41m";
    ConsoleColor["BgGreen"] = "\u001B[42m";
    ConsoleColor["BgYellow"] = "\u001B[43m";
    ConsoleColor["BgBlue"] = "\u001B[44m";
    ConsoleColor["BgMagenta"] = "\u001B[45m";
    ConsoleColor["BgCyan"] = "\u001B[46m";
    ConsoleColor["BgWhite"] = "\u001B[47m";
})(ConsoleColor = exports.ConsoleColor || (exports.ConsoleColor = {}));
var LogLineType;
(function (LogLineType) {
    LogLineType[LogLineType["Pass"] = 0] = "Pass";
    LogLineType[LogLineType["Fail"] = 1] = "Fail";
    LogLineType[LogLineType["Comment"] = 2] = "Comment";
    LogLineType[LogLineType["Heading"] = 3] = "Heading";
    LogLineType[LogLineType["Subheading"] = 4] = "Subheading";
    LogLineType[LogLineType["Decoration"] = 5] = "Decoration";
})(LogLineType = exports.LogLineType || (exports.LogLineType = {}));
class LogLine {
    constructor(message) {
        this.color = ConsoleColor.FgWhite;
        this.textPrefix = '';
        this.textSuffix = '';
        this.message = '';
        this.type = LogLineType.Comment;
        this.timestamp = new Date();
        this.message = message;
    }
    getMergedString() {
        return (this.textPrefix + ' ' + this.message + ' ' + this.textSuffix);
    }
    getClassName() {
        return LogLineType[this.type];
    }
    print() {
        if (!_1.Flagpole.quietMode) {
            let line = '';
            let style = _1.Flagpole.getOutput();
            if (style == flagpole_1.FlagpoleOutput.text) {
                line = this.toString();
            }
            else if (style == flagpole_1.FlagpoleOutput.html) {
                line = this.toHTML();
            }
            else if (style == flagpole_1.FlagpoleOutput.json) {
                let json = this.toJson();
                if (typeof json != 'string') {
                    line = JSON.stringify(json);
                }
            }
            else if (style == flagpole_1.FlagpoleOutput.csv) {
                line = this.toCsv();
            }
            else if (style == flagpole_1.FlagpoleOutput.tsv) {
                line = this.toTsv();
            }
            else if (style == flagpole_1.FlagpoleOutput.psv) {
                line = this.toPsv();
            }
            else {
                line = this.toConsoleString();
            }
            if (line.length > 0) {
                console.log(line);
            }
        }
    }
    toConsoleString() {
        return this.color + this.getMergedString() + ConsoleColor.Reset;
    }
    toCsv() {
        return '"' + this.timestamp.toUTCString() + '","' + this.getClassName() + '","' +
            this.textPrefix + '","' + this.message + '","' + this.textSuffix + '"';
    }
    toTsv() {
        return this.timestamp.toUTCString() + "\t" + this.getClassName() + "\t" +
            this.textPrefix + "\t" + this.message + "\t" + this.textSuffix;
    }
    toPsv() {
        return this.timestamp.toUTCString() + "|" + this.getClassName() + "|" +
            this.textPrefix + "|" + this.message + "|" + this.textSuffix;
    }
    toString() {
        return this.getMergedString();
    }
    toHTML() {
        return '<li class="' + this.getClassName() + '">' + this.message +
            (this.textSuffix.length > 0 ? ' <span class="note">' + this.textSuffix + '</span>' : '') +
            "</li>\n";
    }
    toJson() {
        return {
            type: this.getClassName(),
            message: this.message
        };
    }
}
LogLine.targetLineLength = 72;
exports.LogLine = LogLine;
class HeadingLine extends LogLine {
    constructor(message) {
        super(message);
        this.color = ConsoleColor.FgYellow;
        this.type = LogLineType.Heading;
    }
    getMergedString() {
        let text = super.getMergedString().trim();
        let padLength = Math.ceil((LogLine.targetLineLength - text.length) / 2);
        return ' '.repeat(padLength) + text + ' '.repeat(padLength);
    }
    toHTML() {
        return '<h2 class="' + this.getClassName() + '">' + this.message + '</h2>';
    }
}
exports.HeadingLine = HeadingLine;
class SubheadingLine extends LogLine {
    constructor(message) {
        super(message);
        this.color = ConsoleColor.FgWhite;
        this.type = LogLineType.Subheading;
    }
    toHTML() {
        return '<h3 class="' + this.getClassName() + '">' + this.message + '</h2>';
    }
}
exports.SubheadingLine = SubheadingLine;
class DecorationLine extends LogLine {
    constructor(message) {
        super(message);
        this.color = ConsoleColor.FgYellow;
        this.type = LogLineType.Decoration;
    }
    toHTML() {
        return '<div class="' + this.getClassName() + '">' + this.message + '</div>';
    }
    toJson() {
        return '';
    }
}
exports.DecorationLine = DecorationLine;
class HorizontalRule extends LogLine {
    constructor(message = '=') {
        super(message);
        this.color = ConsoleColor.FgYellow;
        this.type = LogLineType.Decoration;
    }
    getMergedString() {
        let text = this.message;
        let reps = Math.ceil(LogLine.targetLineLength / text.length);
        return text.repeat(reps);
    }
    toHTML() {
        return '<hr class="decoration" />';
    }
    toJson() {
        return '';
    }
}
exports.HorizontalRule = HorizontalRule;
class CustomLine extends LogLine {
    constructor(message, color) {
        super(message);
        this.color = color;
        this.type = LogLineType.Comment;
    }
    toHTML() {
        return '<div class="' + this.getClassName() + '">' + this.message + '</div>';
    }
    toJson() {
        return '';
    }
}
exports.CustomLine = CustomLine;
class LineBreak extends LogLine {
    constructor() {
        super(' ');
        this.type = LogLineType.Decoration;
    }
    toHTML() {
        return '<br />';
    }
    toJson() {
        return '';
    }
}
exports.LineBreak = LineBreak;
class CommentLine extends LogLine {
    constructor(message) {
        super(message);
        this.textPrefix = '  »  ';
        this.color = ConsoleColor.FgCyan;
        this.type = LogLineType.Comment;
    }
}
exports.CommentLine = CommentLine;
class PassLine extends LogLine {
    constructor(message) {
        super(message);
        this.textPrefix = '  ✔  ';
        this.color = ConsoleColor.FgGreen;
        this.type = LogLineType.Pass;
    }
}
exports.PassLine = PassLine;
class FailLine extends LogLine {
    constructor(message) {
        super(message);
        this.textPrefix = '  ✕  ';
        this.color = ConsoleColor.FgRed;
        this.type = LogLineType.Fail;
    }
}
exports.FailLine = FailLine;
