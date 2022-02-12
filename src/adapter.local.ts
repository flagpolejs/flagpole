import { readFile } from "fs-extra";
import { Adapter } from "./adapter";
import { HttpRequest } from "./http/http-request";
import { HttpResponse } from "./http/http-response";

export class LocalAdapter implements Adapter {
  public async fetch(req: HttpRequest): Promise<HttpResponse> {
    const path: string = `${__dirname}/${req.uri}`;
    const data = await readFile(path);
    return new HttpResponse({
      body: data.toString(),
    });
  }
}
