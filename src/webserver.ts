import * as http from "http";
const fs = require("fs");

export class WebResponse {
  private _response: http.ServerResponse;
  private _output: string = "";

  static createFromTemplate(
    response: http.ServerResponse,
    templatePath: string
  ) {
    return new WebResponse(response, { templatePath: templatePath });
  }

  static createFromInput(response: http.ServerResponse, input: string) {
    return new WebResponse(response, { input: input });
  }

  private constructor(
    response: http.ServerResponse,
    opts: { templatePath?: string; input?: string }
  ) {
    this._response = response;
    if (opts.templatePath) {
      this._output = fs.readFileSync(opts.templatePath, "utf8");
    } else if (opts.input) {
      this._output = opts.input;
    }
  }

  public replace(key: string, value: string): WebResponse {
    this._output = this._output.replace("${" + key + "}", value);
    return this;
  }

  public parse(replace: { [key: string]: string }): WebResponse {
    for (let key in replace) {
      this.replace(key, replace[key]);
    }
    return this;
  }

  public send(replace?: { [key: string]: string }): WebResponse {
    if (typeof replace != "undefined") {
      this.parse(replace);
    }
    this._response.end(this._output);
    return this;
  }
}

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

  constructor(requestHandler: http.RequestListener) {
    this._server = http.createServer(requestHandler);
  }

  public listen(port?: number): Promise<void> {
    if (this.isListening) {
      throw new Error("HTTP Server is already listening.");
    }
    return new Promise((resolve, reject) => {
      if (typeof port != "undefined" && port > 0) {
        this._httpPort = Math.ceil(port);
      }
      this._server
        .listen({ port: this._httpPort }, () => {
          resolve();
        })
        .on("error", (err: string) => {
          if (err) {
            return reject(`Could not listen on port ${this._httpPort}: ${err}`);
          }
        });
    });
  }

  public close(): Promise<void> {
    return new Promise(resolve => {
      if (this.isListening) {
        this._server.close(() => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
