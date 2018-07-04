export enum LogType {
    Pass,
    Fail,
    Comment
}

export class ConsoleLine {

    public color: string = '\x1b[0m';
    public message: string = '';
    public type: LogType = LogType.Comment;

    constructor(message: string, color?: string) {
        this.message = message;
        this.color = color || this.color;
    }

    public write() {
        console.log(this.color, this.message, '\x1b[0m');
    }

    public toJson(): any {
        return {
            type: this.type,
            message: this.message
        }
    }

    static pass(message: string) {
        let line: ConsoleLine = new ConsoleLine(message, "\x1b[32m");
        line.type = LogType.Pass;
        return line;
    }

    static fail(message: string) {
        let line: ConsoleLine =  new ConsoleLine(message, "\x1b[31m");
        line.type = LogType.Fail;
        return line;
    }

    static comment(message: string) {
        let line: ConsoleLine =  new ConsoleLine(message, "\x1b[34m");
        line.type = LogType.Comment;
        return line;
    }

}
