import { SimplifiedResponse } from "./response";


export class Mock implements SimplifiedResponse {

    public url: string;
    public statusCode: number = 200;
    public body: string = '';
    public headers: Array<any> = [];

    protected constructor(url: string, body: string) {
        this.url = url;
        this.body = body;
    }

    static loadLocalFile(relativePath: string): Promise<Mock> {
        let fs = require('fs');
        let path: string = __dirname + '/' + relativePath;
        return new Promise((resolve, reject) => {
            fs.readFile(path, function (err, data) {
                if (err) {
                    return reject(err);
                }
                resolve(new Mock(
                    path,
                    data.toString()
                ));
            });
        });
    }

}