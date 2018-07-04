"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var LogType;
(function (LogType) {
    LogType[LogType["Pass"] = 0] = "Pass";
    LogType[LogType["Fail"] = 1] = "Fail";
    LogType[LogType["Comment"] = 2] = "Comment";
})(LogType = exports.LogType || (exports.LogType = {}));
class ConsoleLine {
    constructor(message, color) {
        this.color = '\x1b[0m';
        this.message = '';
        this.type = LogType.Comment;
        this.message = message;
        this.color = color || this.color;
    }
    write() {
        console.log(this.color, this.message, '\x1b[0m');
    }
    toJson() {
        return {
            type: this.type,
            message: this.message
        };
    }
    static pass(message) {
        let line = new ConsoleLine(message, "\x1b[32m");
        line.type = LogType.Pass;
        return line;
    }
    static fail(message) {
        let line = new ConsoleLine(message, "\x1b[31m");
        line.type = LogType.Fail;
        return line;
    }
    static comment(message) {
        let line = new ConsoleLine(message, "\x1b[34m");
        line.type = LogType.Comment;
        return line;
    }
}
exports.ConsoleLine = ConsoleLine;
