import { BrowserResponse } from "./browser-response";
import { fetchWithNeedle } from "../adapters/needle";
import { ProtoScenario } from "../scenario";
import { beforeScenarioRequestStarted } from "../decorators/internal";
import { ScenarioDisposition } from "../enums";
import { iBrowserControlResponse } from "./browser-control";
import * as puppeteer from "puppeteer-core";
import { AssertionFailOptional } from "../logging/assertion-result";
import { FlagpoleExecution, HttpResponse, iResponse } from "..";
import { KeyValue } from "../interfaces";

export class BrowserScenario extends ProtoScenario {
  protected createResponse(): iResponse {
    return new BrowserResponse(this);
  }

  protected getRequestAdapter() {
    return fetchWithNeedle;
  }

  @beforeScenarioRequestStarted
  protected _executeHttpRequest() {
    if (this.url === null) {
      throw "Can not execute request with null URL.";
    }
    this.url = this.buildUrl().href;
    this._markRequestAsStarted();
    this._finalUrl = this._request.uri;
    this._executeBrowserRequest();
  }

  protected _getRequestOptions(opts: KeyValue = {}): KeyValue {
    opts.browserOptions = {
      ...this._defaultBrowserOptions,
      ...opts.browserOptions,
    };
    if (FlagpoleExecution.global.headless !== undefined) {
      opts.browserOptions.headless = FlagpoleExecution.global.headless;
    }
    return opts;
  }

  /**
   * Start a browser scenario
   */
  private _executeBrowserRequest() {
    if (!this.browserControl) {
      throw "Not a browser scenario";
    }
    const handleError = (message: string, e: any) => {
      setTimeout(() => {
        this._markScenarioCompleted(message, e, ScenarioDisposition.aborted);
      }, 1000);
    };
    this.browserControl
      .open(this._request)
      .then((next: iBrowserControlResponse) => {
        const puppeteerResponse: puppeteer.Response = next.response;
        if (puppeteerResponse !== null) {
          this._finalUrl = puppeteerResponse.url();
          // Loop through the redirects to populate our array
          puppeteerResponse
            .request()
            .redirectChain()
            .forEach((req) => {
              this._redirectChain.push(req.url());
            });
          // Handle errors
          this.browser?.on("disconnected", (e) =>
            handleError("Puppeteer instance unexpectedly closed.", e)
          );
          this.browserControl?.page?.on("close", (e) =>
            handleError("Puppeteer closed unexpectedly.", e)
          );
          this.browserControl?.page?.on("error", (e) =>
            handleError("Puppeteer got an unexpected error.", e)
          );
          this.browserControl?.page?.on("pageerror", (e) =>
            this._pushToLog(
              new AssertionFailOptional(
                "Puppeteer got an unexpected page error.",
                e
              )
            )
          );
          // Finishing processing the response
          this._processResponse(
            HttpResponse.fromPuppeteer(
              puppeteerResponse,
              next.body,
              next.cookies
            )
          );
        } else {
          this._markScenarioCompleted(
            `Failed to load ${this._request.uri}`,
            null,
            ScenarioDisposition.aborted
          );
        }
        return;
      })
      .catch((err) =>
        this._markScenarioCompleted(
          `Failed to load ${this._request.uri}`,
          err,
          ScenarioDisposition.aborted
        )
      );
  }
}
