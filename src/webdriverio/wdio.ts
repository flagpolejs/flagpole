import * as webdriverio from "webdriverio";
import { HttpRequest } from "../httprequest";
import { iBrowserControl, iBrowserControlResponse } from "../interfaces";

export class Wdio implements iBrowserControl {
  #launchOpts: webdriverio.RemoteOptions;
  #request: HttpRequest;
  #browser: webdriverio.Browser<"async"> | null = null;

  public async getBrowser(): Promise<webdriverio.Browser<"async">> {
    if (this.#browser === null) {
      this.#browser = await webdriverio.remote(this.#launchOpts);
    }
    return this.#browser;
  }

  public static async launch(opts: webdriverio.RemoteOptions): Promise<Wdio> {
    const wdio = new Wdio(opts);
    return wdio;
  }

  private constructor(opts: webdriverio.RemoteOptions) {
    this.#request = new HttpRequest({});
    this.#launchOpts = opts;
  }

  public async open(request: HttpRequest): Promise<iBrowserControlResponse> {
    this.#request = request;
    const browser = await this.getBrowser();
    await browser.url(request.uri || "");
    return {
      response: {
        url: browser.getUrl(),
      },
      body: "",
      cookies: {},
    };
  }
}
