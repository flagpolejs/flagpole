import { SimplifiedResponse } from "./response";
export declare class Mock implements SimplifiedResponse {
    url: string;
    statusCode: number;
    body: string;
    headers: Array<any>;
    protected constructor(url: string, body: string);
    static loadLocalFile(relativePath: string): Promise<Mock>;
}
