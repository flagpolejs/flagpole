import { Value } from "../value";
import {
  iValue,
  iAssertionContext,
  iScenario,
  iMessageAndCallback,
  FindOptions,
  FindAllOptions,
} from "../interfaces";
import { Link } from "../link";
import { ResponseType } from "../enums";
import { isPuppeteer } from "../response";
import { runAsync, getMessageAndCallbackFromOverloading } from "../util";
import * as fs from "fs";
import needle = require("needle");
import { HttpRequestOptions } from "../httprequest";

export abstract class DOMElement extends Value {
  public get name(): string {
    return this._name || this._path || "DOM Element";
  }

  protected constructor(
    input: any,
    context: iAssertionContext,
    name?: string | null,
    path?: string
  ) {
    super(input, context, name || "DOM Element");
    this._path = path || "";
  }

  abstract find(selector: string, opts?: FindOptions): Promise<iValue>;
  abstract find(
    selector: string,
    contains: string,
    opts?: FindOptions
  ): Promise<iValue>;
  abstract find(
    selector: string,
    matches: RegExp,
    opts?: FindOptions
  ): Promise<iValue>;
  abstract findAll(selector: string, opts?: FindAllOptions): Promise<iValue[]>;
  abstract findAll(
    selector: string,
    contains: string,
    opts?: FindAllOptions
  ): Promise<iValue[]>;
  abstract findAll(
    selector: string,
    matches: RegExp,
    opts?: FindAllOptions
  ): Promise<iValue[]>;

  protected abstract _getTagName(): Promise<string>;
  protected abstract _getAttribute(key: string): Promise<string | null>;
  protected abstract _getClassName(): Promise<string>;
  protected abstract _getInnerText(): Promise<string>;
  protected abstract _getInnerHtml(): Promise<string>;
  protected abstract _getOuterHtml(): Promise<string>;
  protected abstract _getProperty(key: string): Promise<any>;
  protected abstract _getValue(): Promise<any>;
  protected abstract _getText(): Promise<string>;

  /**
   * Convert element synchronously to string as best we can
   */
  public toString(): string {
    return this._context.response.getRoot().html(this._input);
  }

  /**
   * Get all class names for element
   */
  public async getClassName(): Promise<iValue> {
    return this._wrapAsValue(
      await this._getClassName(),
      `Class Name of ${this.name}`
    );
  }

  /**
   * Get element's innerText
   */
  public async getInnerText(): Promise<iValue> {
    return this._wrapAsValue(
      await this._getInnerText(),
      `Inner Text of ${this.name}`
    );
  }

  /**
   * Get element's innerHtml which will not include the element itself, only its contents
   */
  public async getInnerHtml(): Promise<iValue> {
    return this._wrapAsValue(
      await this._getInnerHtml(),
      `Inner Html of ${this.name}`
    );
  }

  /**
   * Get the HTML of the element and all of its contents
   */
  public async getOuterHtml(): Promise<iValue> {
    return this._wrapAsValue(
      await this._getOuterHtml(),
      `Outer Html of ${this.name}`
    );
  }

  /**
   * Get the attribute with this name or null if it doesn't exist
   *
   * @param key
   */
  public async getAttribute(key: string): Promise<iValue> {
    const name: string = `${this.name} -> ${key}`;
    const attr: string | null = await this._getAttribute(key);
    return this._wrapAsValue(attr, name, this, `${key}="${attr}"`);
  }

  public async getStyleProperty(key: string): Promise<iValue> {
    const name: string = `${this.name} -> style[${key}]`;
    const style: string | null = await this._getAttribute("style");
    let attr: null | string = null;
    if (style) {
      const properties = style.split(";").map((value) => {
        return value.trim();
      });
      properties.some((property) => {
        if (new RegExp(`^{$key}:`).test(property)) {
          attr = property.substring(property.indexOf(":") + 1);
          return true;
        }
        return false;
      });
    }
    return this._wrapAsValue(attr, name, this);
  }

  /**
   * Get the property with this name in the element, or null if it doesn't exist
   * @param key
   */
  public async getProperty(key: string): Promise<iValue> {
    return this._wrapAsValue(
      await this._getProperty(key),
      `${key} of ${this.name}`
    );
  }

  /**
   * Get the value of this element, such as the value of an input field
   */
  public async getValue(): Promise<iValue> {
    return this._wrapAsValue(await this._getValue(), `Value of ${this.name}`);
  }

  /**
   * Get the text content within the element
   */
  public async getText(): Promise<iValue> {
    return this._wrapAsValue(await this._getText(), `Text of ${this.name}`);
  }

  /**
   * Load the URL from this element if it has something to load
   * This is used to create a lambda scenario
   */
  public load(): Promise<void>;
  public load(message: string): Promise<iScenario>;
  public load(callback: Function): Promise<iScenario>;
  public load(scenario: iScenario): Promise<iScenario>;
  public load(message: string, callback: Function): Promise<iScenario>;
  public async load(
    a?: string | Function | iScenario,
    b?: Function
  ): Promise<void | iScenario> {
    const overloaded = getMessageAndCallbackFromOverloading(a, b, this._path);
    const scenario = this._createSubScenario(overloaded);
    this._completedAction("LOAD");
    const link: Link = await this.getLink();
    // If this is a lmabda scenario, define the response type and options
    if (overloaded.scenario === undefined) {
      const scenarioType: ResponseType = await this._getLambdaScenarioType();
      scenario.setResponseType(
        scenarioType,
        this._getLambdaScenarioOpts(scenarioType)
      );
      scenario.next(overloaded.callback);
    }
    // If no message was provided, set a default one
    if (overloaded.message.length == 0) {
      scenario.title = `Load ${link.getUri()}`;
    }
    // Not a a link?
    if (!link.isNavigation()) {
      scenario.skip("Not a navigational link");
    }
    // Execute it
    const uri = link.getUri();
    scenario.open(uri);
    return scenario;
  }

  protected async _isFormTag(): Promise<boolean> {
    return this.isTag("form");
  }

  protected async _isButtonTag(): Promise<boolean> {
    const type: string | null = await this._getAttribute("type");
    return (
      this.isTag("button") ||
      (this.isTag("input") &&
        ["button", "submit", "reset"].indexOf(String(type)) >= 0)
    );
  }

  protected async _isLinkTag(): Promise<boolean> {
    return this.isTag("a") && (await this._getAttribute("href")) !== null;
  }

  protected async _isImageTag(): Promise<boolean> {
    return this.isTag("img") && (await this._getAttribute("src")) !== null;
  }

  protected async _isVideoTag(): Promise<boolean> {
    const src: string | null = await this._getAttribute("src");
    const type: string | null = await this._getAttribute("type");
    return (
      (this.isTag("video") && src !== null) ||
      (this.isTag("source") && src !== null && /video/i.test(type || ""))
    );
  }

  protected async _isAudioTag(): Promise<boolean> {
    const src: string | null = await this._getAttribute("src");
    const type: string | null = await this._getAttribute("type");
    return (
      (this.isTag("audio", "bgsound") && src !== null) ||
      (this.tagName === "source" && src !== null && /audio/i.test(type || ""))
    );
  }

  protected async _isScriptTag(): Promise<boolean> {
    return this.isTag("script") && (await this._getAttribute("src")) !== null;
  }

  protected async _isStylesheetTag(): Promise<boolean> {
    return (
      this.isTag("link") &&
      (await this._getAttribute("href")) !== null &&
      String(await this._getAttribute("rel")).toLowerCase() == "stylesheet"
    );
  }

  protected async _isClickable(): Promise<boolean> {
    return (await this._isLinkTag()) || (await this._isButtonTag());
  }

  protected async _getLambdaScenarioType(): Promise<ResponseType> {
    if ((await this._isFormTag()) || (await this._isClickable())) {
      // If we are loading an html page, stay in our current mode
      return this._context.scenario.responseType;
    } else if (await this._isImageTag()) {
      return "image";
    } else if (await this._isStylesheetTag()) {
      return "stylesheet";
    } else if (await this._isScriptTag()) {
      return "script";
    } else if (await this._isVideoTag()) {
      return "video";
    } else {
      return "resource";
    }
  }

  protected _getLambdaScenarioOpts(newScenarioType: ResponseType): any {
    const newScenarioIsBrowser: boolean = isPuppeteer(newScenarioType);
    const curScenarioIsBrowser: boolean = isPuppeteer(
      this._context.response.responseType
    );
    // Carry over the opts, unless we change from non-browser to browser (or vice versa)
    return newScenarioIsBrowser == curScenarioIsBrowser
      ? this._context.scenario.request.options
      : {};
  }

  protected _createSubScenario(
    overloaded: iMessageAndCallback,
    defaultResponseType: ResponseType = "resource",
    defaultOpts: any = {}
  ): iScenario {
    return overloaded.scenario === undefined
      ? this._context.suite.scenario(
          overloaded.message,
          defaultResponseType,
          defaultOpts
        )
      : overloaded.scenario;
  }

  protected _loadSubScenario(
    overloaded: iMessageAndCallback
  ): Promise<iScenario> {
    return overloaded.scenario === undefined
      ? this.load(overloaded.message, overloaded.callback)
      : this.load(overloaded.scenario);
  }
}
