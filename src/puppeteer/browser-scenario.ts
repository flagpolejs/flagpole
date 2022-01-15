import { BrowserResponse } from "./browser-response";
import { fetchWithNeedle } from "../needle";
import { ProtoScenario } from "../scenario";
import { beforeScenarioRequestStarted } from "../decorators/internal";
import { ScenarioDisposition } from "../interfaces/enums";
import { iBrowserControlResponse, BrowserControl } from "./browser-control";
import * as puppeteer from "puppeteer-core";
import { AssertionFailOptional } from "../logging/assertion-result";
import { FlagpoleExecution } from "../flagpole-execution";
import { KeyValue } from "../interfaces/generic-types";
import { HttpResponse } from "../http-response";
import { runAsync } from "../util";
import { Browser, Page } from "puppeteer-core";
import { BrowserOptions } from "./browser-opts";

export class BrowserScenario extends ProtoScenario {
  public readonly adapter = fetchWithNeedle;
  public readonly response = new BrowserResponse(this);
  public readonly defaultRequestOptions: BrowserOptions = {
    headless: true,
    recordConsole: true,
    outputConsole: false,
  };

  protected _browserControl: BrowserControl | null = null;

  public get browserControl(): BrowserControl | null {
    if (this._browserControl === null) {
      this._browserControl = new BrowserControl();
    }
    return this._browserControl;
  }

  public get browser(): Browser | null {
    return this._browserControl?.browser || null;
  }

  public get page(): Page | null {
    return this.browserControl !== null ? this.browserControl.page : null;
  }

  @beforeScenarioRequestStarted
  protected _executeHttpRequest() {
    if (this.url === null) {
      throw "Can not execute request with null URL.";
    }
    this.url = this.buildUrl().href;
    this._markRequestAsStarted();
    this._finalUrl = this.request.uri;
    this._executeBrowserRequest();
  }

  protected _getRequestOptions(opts: KeyValue = {}): KeyValue {
    opts.browserOptions = {
      ...this.defaultRequestOptions,
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
      .open(this.request)
      .then((next: iBrowserControlResponse) => {
        const response: puppeteer.Response = next.response;
        if (response !== null) {
          this._finalUrl = response.url();
          // Loop through the redirects to populate our array
          response
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
            HttpResponse.fromOpts({
              status: [response.status(), response.statusText()],
              headers: response.headers(),
              body: next.body,
              cookies: next.cookies || {},
            })
          );
        } else {
          this._markScenarioCompleted(
            `Failed to load ${this.request.uri}`,
            null,
            ScenarioDisposition.aborted
          );
        }
        return;
      })
      .catch((err) =>
        this._markScenarioCompleted(
          `Failed to load ${this.request.uri}`,
          err,
          ScenarioDisposition.aborted
        )
      );
  }

  protected async _markScenarioCompleted(
    message: string | null = null,
    details: string | null = null,
    disposition: ScenarioDisposition = ScenarioDisposition.completed
  ): Promise<BrowserScenario> {
    // Only run this once
    if (!this.hasFinished) {
      super._markScenarioCompleted(message, details, disposition);
      // Close the browser window
      // Important! Don't close right away, some things may need to finish that were async
      runAsync(() => {
        this.browserControl?.close();
      }, 100);
    }
    return this;
  }
}
