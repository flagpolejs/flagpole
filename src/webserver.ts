
import * as http from 'http';

export class WebServer {

    private _httpPort: number = 3000;
    private _server: http.Server;

    public get isListening(): boolean {
        return this._server.listening;
    }

    public get httpPort(): number {
        return this._httpPort;
    }

    public set httpPort(value: number) {
        this._httpPort = value;
    }

    constructor(requestHandler: (request: http.ServerRequest, response: http.ServerResponse) => void) {
        this._server = http.createServer(requestHandler);
    }

    public listen(port?: number): Promise<void> {
        if (this.isListening) {
            throw new Error('HTTP Server is already listening.');
        }
        return new Promise((resolve, reject) => {
            if (typeof port != 'undefined' && port > 0) {
                this._httpPort = Math.ceil(port);
            }
            this._server.listen(this._httpPort, (err: string) => {
                if (err) {
                    return reject(`Could not listen on port ${this._httpPort}: ${err}`);
                }
                resolve();
            });
        })
    }

    public close(): Promise<void> {
        return new Promise((resolve) => {
            if (this.isListening) {
                this._server.close(() => {
                    resolve();
                });
            }
            else {
                resolve();
            }
        })
    }

}