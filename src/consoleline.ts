export class ConsoleLine {

    public color: string = '\x1b[0m';
    public message: string = '';

    constructor(message: string, color?: string) {
        this.message = message;
        this.color = color || this.color;
    }

    public write() {
        console.log(this.color, this.message, '\x1b[0m');
    }

}
