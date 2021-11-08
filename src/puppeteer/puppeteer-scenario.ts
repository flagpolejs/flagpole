import {
  BrowserControl,
  BrowserOptions,
  FlagpoleExecution,
  HttpRequest,
  HttpResponse,
} from "..";
import { ScenarioDisposition } from "../enums";
import { iBrowserControlResponse } from "./browser-control";
import * as puppeteer from "puppeteer-core";
import { AssertionFailOptional } from "../logging/assertionresult";
import { Browser } from "puppeteer-core";
import { ProtoScenario } from "../scenario";

export abstract class PuppeteerScenario extends ProtoScenario {
  protected _browserControl: BrowserControl | null = null;
  protected _defaultBrowserOptions: BrowserOptions = {
    headless: true,
    recordConsole: true,
    outputConsole: false,
  };

  public get browserControl(): BrowserControl | null {
    if (this._browserControl === null) {
      this._browserControl = new BrowserControl();
    }
    return this._browserControl;
  }

  public get browser(): Browser | null {
    return this._browserControl?.browser || null;
  }

  protected _createRequest(opts: any = {}): HttpRequest {
    const request = new HttpRequest(this._getDefaultRequestOptions());
    // Overrides from command line
    const overrides: any = {};
    if (FlagpoleExecution.global.headless !== undefined) {
      overrides.headless = FlagpoleExecution.global.headless;
    }
    // Set browser options
    request.setOptions({
      browserOptions: {
        ...this._defaultBrowserOptions, // Flagpole defaults
        ...opts, // What was in the code
        ...overrides, // What was in the command line
      },
    });
    return request;
  }

  protected _destroySession() {
    // Close the browser window
    this.browserControl?.close();
  }

  protected _executeHttpRequest() {
    if (this.url === null) {
      throw "Can not execute request with null URL.";
    }
    this.url = this.buildUrl().href;
    this._markRequestAsStarted();
    this._finalUrl = this._request.uri;
    this._executeBrowserRequest();
  }

  /**
   * Start a browser scenario
   */
  protected _executeBrowserRequest() {
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
