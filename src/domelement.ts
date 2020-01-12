import { Value } from "./value";
import {
  iValue,
  iAssertionContext,
  iScenario,
  iMessageAndCallback
} from "./interfaces";
import { Link } from "./link";
import { ResponseType } from "./enums";
import { isPuppeteer } from "./response";
import { runAsync, getMessageAndCallbackFromOverloading } from "./util";
import * as rp from "request-promise";
import * as fs from "fs";

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

  public abstract async find(selector: string): Promise<iValue>;
  public abstract async findAll(selector: string): Promise<iValue[]>;

  protected abstract async _getTagName(): Promise<string>;
  protected abstract async _getAttribute(key: string): Promise<string | null>;

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
      typeof this._input.get(0).attribs["class"] !== "undefined"
        ? this._input.get(0).attribs["class"]
        : null,
      `Class Name of ${this.name}`
    );
  }

  /**
   * Does this element have the given class?
   *
   * @param className
   */
  public async hasClassName(className: string): Promise<iValue> {
    return this._wrapAsValue(
      this._input.hasClass(className),
      `${this.name} has class ${className}`
    );
  }

  /**
   * Get element's innerText
   */
  public async getInnerText(): Promise<iValue> {
    return this._wrapAsValue(this._input.text(), `Inner Text of ${this.name}`);
  }

  /**
   * Get element's innerHtml which will not include the element itself, only its contents
   */
  public async getInnerHtml(): Promise<iValue> {
    return this._wrapAsValue(this._input.html(), `Inner Html of ${this.name}`);
  }

  /**
   * Get the HTML of the element and all of its contents
   */
  public async getOuterHtml(): Promise<iValue> {
    return this._wrapAsValue(
      this._context.response.getRoot().html(this._input),
      `Outer Html of ${this.name}`
    );
  }

  /**
   * Does this element have an atribute with this name?
   *
   * @param key
   */
  public async hasAttribute(key: string): Promise<iValue> {
    return this._wrapAsValue(
      (await this._getAttribute(key)) != null,
      `${this.name} has attribute ${key}`,
      this
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
    console.log(this.tagName);
    console.log(style);
    let attr: null | string = null;
    if (style) {
      const properties = style.split(";").map(value => {
        return value.trim();
      });
      properties.some(property => {
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
   * Does this element have a property with this name?
   *
   * @param key
   */
  public async hasProperty(key: string): Promise<iValue> {
    return this._wrapAsValue(
      !(await this.getProperty(key)).isNull(),
      `Does ${this.name} have property ${key}?`
    );
  }

  /**
   * Get the property with this name in the element, or null if it doesn't exist
   * @param key
   */
  public async getProperty(key: string): Promise<iValue> {
    const name: string = `${key} of ${this.name}`;
    return this._wrapAsValue(this._input.prop(key), name);
  }

  /**
   * Does this element have data with this key?
   *
   * @param key
   */
  public async hasData(key: string): Promise<iValue> {
    return this._wrapAsValue(
      !(await this.getData(key)).isNull(),
      `${this.name} has data ${key}`
    );
  }

  /**
   * Get the data with this key in the element, or null
   * @param key
   */
  public async getData(key: string): Promise<iValue> {
    const name: string = `Data of ${this.name}`;
    return this._wrapAsValue(this._input.data(key), name);
  }

  /**
   * Get the value of this element, such as the value of an input field
   */
  public async getValue(): Promise<iValue> {
    const name: string = `Value of ${this.name}`;
    return this._wrapAsValue(this._input.val(), name);
  }

  /**
   * Get the text content within the element
   */
  public async getText(): Promise<iValue> {
    const name: string = `Text of ${this.name}`;
    return this._wrapAsValue(this._input.text(), name, this);
  }

  /**
   * Download the file that is linked by this element... return the
   * contents and/or save it to a file
   *
   * @param opts
   */
  public download(): Promise<Buffer | string | null>;
  public download(localFilePath: string): Promise<Buffer | string | null>;
  public download(
    localFilePath: string,
    opts: {}
  ): Promise<Buffer | string | null>;
  public download(opts: {}): Promise<Buffer | string | null>;
  public async download(a?: any, b = {}): Promise<Buffer | string | null> {
    const localFilePath: string | null = typeof a == "string" ? a : null;
    const opts = typeof a == "object" && a !== null ? a : b;
    const link = await this._getLink();
    if (link.isNavigation()) {
      const response = rp(link.getUri(), opts);
      if (localFilePath) {
        fs.writeFileSync(localFilePath, response);
      }
      return response;
    }
    return null;
  }

  /**
   * This is a shorthand object to get binary, which in turn calls download.
   * That way you don't have to remember the encoding:null step in opts
   *
   * @param opts
   */
  public downloadBinary(): Promise<Buffer | null>;
  public downloadBinary(localFilePath: string): Promise<Buffer | null>;
  public downloadBinary(
    localFilePath: string,
    opts: {}
  ): Promise<Buffer | null>;
  public downloadBinary(opts: {}): Promise<Buffer | null>;
  public async downloadBinary(a?: any, b = {}): Promise<Buffer | null> {
    const localFilePath: string | null = typeof a == "string" ? a : null;
    const opts = {
      ...(typeof a == "object" && a !== null ? a : b),
      ...{ encoding: null }
    };
    const buffer =
      localFilePath !== null
        ? this.download(localFilePath, opts)
        : this.download(opts);
    //@ts-ignore
    return typeof buffer !== "string" ? buffer : null;
  }

  /**
   * Load the URL from this element if it has something to load
   * This is used to create a lambda scenario
   */
  public load(): iScenario;
  public load(message: string): iScenario;
  public load(callback: Function): iScenario;
  public load(scenario: iScenario): iScenario;
  public load(message: string, callback: Function): iScenario;
  public load(a?: string | Function | iScenario, b?: Function): iScenario {
    const overloaded = getMessageAndCallbackFromOverloading(a, b, this._path);
    const scenario = this._createSubScenario(overloaded);
    this._completedAction("LOAD");
    runAsync(async () => {
      const link: Link = await this._getLink();
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
      // Execute it
      link.isNavigation()
        ? scenario.open(link.getUri())
        : scenario.skip("Not a navigational link");
    }, 10);
    return scenario;
  }

  protected async _isFormTag(): Promise<boolean> {
    return this.tagName == "form";
  }

  protected async _isButtonTag(): Promise<boolean> {
    const type: string | null = await this._getAttribute("type");
    return (
      this.tagName === "button" ||
      (this.tagName === "input" &&
        ["button", "submit", "reset"].indexOf(String(type)) >= 0)
    );
  }

  protected async _isLinkTag(): Promise<boolean> {
    return this.tagName === "a" && (await this._getAttribute("href")) !== null;
  }

  protected async _isImageTag(): Promise<boolean> {
    return this.tagName === "img" && (await this._getAttribute("src")) !== null;
  }

  protected async _isVideoTag(): Promise<boolean> {
    const src: string | null = await this._getAttribute("src");
    const type: string | null = await this._getAttribute("type");
    return (
      (this.tagName === "video" && src !== null) ||
      (this.tagName === "source" && src !== null && /video/i.test(type || ""))
    );
  }

  protected async _isAudioTag(): Promise<boolean> {
    const src: string | null = await this._getAttribute("src");
    const type: string | null = await this._getAttribute("type");
    return (
      (this.tagName === "audio" && src !== null) ||
      (this.tagName === "bgsound" && src !== null) ||
      (this.tagName === "source" && src !== null && /audio/i.test(type || ""))
    );
  }

  protected async _isScriptTag(): Promise<boolean> {
    return (
      this.tagName === "script" && (await this._getAttribute("src")) !== null
    );
  }

  protected async _isStylesheetTag(): Promise<boolean> {
    return (
      this.tagName === "link" &&
      (await this._getAttribute("href")) !== null &&
      String(await this._getAttribute("rel")).toLowerCase() == "stylesheet"
    );
  }

  protected async _isClickable(): Promise<boolean> {
    return (await this._isLinkTag()) || (await this._isButtonTag());
  }

  protected async _getUrl(): Promise<string | null> {
    if (this.tagName !== null) {
      if (
        ["img", "script", "video", "audio", "object", "iframe"].indexOf(
          this.tagName
        ) >= 0
      ) {
        return await this._getAttribute("src");
      } else if (["a", "link"].indexOf(this.tagName) >= 0) {
        return await this._getAttribute("href");
      } else if (["form"].indexOf(this.tagName) >= 0) {
        return (
          (await this._getAttribute("action")) || this._context.scenario.url
        );
      } else if (["source"].indexOf(this.tagName) >= 0) {
        return await this._getAttribute("src");
      }
    }
    return null;
  }

  protected async _getLambdaScenarioType(): Promise<ResponseType> {
    if ((await this._isFormTag()) || (await this._isClickable())) {
      // If we are loading an html page, stay in our current mode
      return this._context.scenario.responseType;
    } else if (await this._isImageTag()) {
      return ResponseType.image;
    } else if (await this._isStylesheetTag()) {
      return ResponseType.stylesheet;
    } else if (await this._isScriptTag()) {
      return ResponseType.script;
    } else if (await this._isVideoTag()) {
      return ResponseType.video;
    } else {
      return ResponseType.resource;
    }
  }

  protected async _getLink(): Promise<Link> {
    const srcPath: string | null = await this._getUrl();
    return new Link(srcPath || "", this._context);
  }

  protected _getLambdaScenarioOpts(newScenarioType: ResponseType): any {
    const newScenarioIsBrowser: boolean = isPuppeteer(newScenarioType);
    const curScenarioIsBrowser: boolean = isPuppeteer(
      this._context.response.responseType
    );
    // Carry over the opts, unless we change from non-browser to browser (or vice versa)
    return newScenarioIsBrowser == curScenarioIsBrowser
      ? this._context.scenario.requestOptions
      : {};
  }

  protected _createSubScenario(
    overloaded: iMessageAndCallback,
    defaultResponseType: ResponseType = ResponseType.resource,
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

  protected _loadSubScenario(overloaded: iMessageAndCallback): iScenario {
    return overloaded.scenario === undefined
      ? this.load(overloaded.message, overloaded.callback)
      : this.load(overloaded.scenario);
  }
}
