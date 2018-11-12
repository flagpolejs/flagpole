export declare enum LogType {
    Pass = 0,
    Fail = 1,
    Comment = 2,
}
export declare class ConsoleLine {
    color: string;
    message: string;
    type: LogType;
    constructor(message: string, color?: string);
    write(): void;
    toJson(): any;
    static pass(message: string): ConsoleLine;
    static fail(message: string): ConsoleLine;
    static comment(message: string): ConsoleLine;
}
