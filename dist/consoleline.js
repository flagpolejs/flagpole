"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ConsoleLine {
    constructor(message, color) {
        this.color = '\x1b[0m';
        this.message = '';
        this.message = message;
        this.color = color || this.color;
    }
    write() {
        console.log(this.color, this.message, '\x1b[0m');
    }
}
exports.ConsoleLine = ConsoleLine;
