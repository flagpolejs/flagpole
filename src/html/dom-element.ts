import { Value } from "../value";
import { iValue } from "../interfaces/ivalue";
import { iScenario } from "../interfaces/iscenario";
import { Link } from "../link";
import { getMessageAndCallbackFromOverloading } from "../util";
import { ValuePromise } from "../value-promise";
import { ImageScenario } from "../visual/image-scenario";
import { ResourceScenario } from "../resource/resource-scenario";
import { FindAllOptions, FindOptions } from "../interfaces/find-options";
import { ClassConstructor } from "../interfaces/generic-types";
import { MessageAndCallback } from "../interfaces/message-and-callback";
import { ValueOptions } from "../interfaces/value-options";
import { AssertionContext } from "..";

export abstract class DOMElement extends Value {
  protected constructor(
    input: any,
    context: AssertionContext,
    opts: ValueOptions
  ) {
    super(input, context, { name: "DOM Element", ...opts });
  }

  abstract find(selector: string, opts?: FindOptions): ValuePromise;
  abstract find(
    selector: string,
    contains: string,
    opts?: FindOptions
  ): ValuePromise;
  abstract find(
    selector: string,
    matches: RegExp,
    opts?: FindOptions
  ): ValuePromise;
  abstract findAll(
    selector: string,
    opts?: FindAllOptions
  ): Promise<iValue<any>[]>;
  abstract findAll(
    selector: string,
    contains: string,
    opts?: FindAllOptions
  ): Promise<iValue<any>[]>;
  abstract findAll(
    selector: string,
    matches: RegExp,
    opts?: FindAllOptions
  ): Promise<iValue<any>[]>;

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
    return this.context.response.getRoot().html(this.$);
  }

  /**
   * Get all class names for element
   */
  public getClassName(): ValuePromise {
    return ValuePromise.execute(async () => {
      return this.context.wrapValue(await this._getClassName(), {
        name: `Class Name of ${this.name}`,
      });
    });
  }

  /**
   * Get element's innerText
   */
  public getInnerText(): ValuePromise {
    return ValuePromise.execute(async () => {
      return this.context.wrapValue(await this._getInnerText(), {
        name: `Inner Text of ${this.name}`,
      });
    });
  }

  /**
   * Get element's innerHtml which will not include the element itself, only its contents
   */
  public getInnerHtml(): ValuePromise {
    return ValuePromise.execute(async () => {
      return this.context.wrapValue(await this._getInnerHtml(), {
        name: `Inner Html of ${this.name}`,
      });
    });
  }

  /**
   * Get the HTML of the element and all of its contents
   */
  public getOuterHtml(): ValuePromise {
    return ValuePromise.execute(async () => {
      return this.context.wrapValue(await this._getOuterHtml(), {
        name: `Outer Html of ${this.name}`,
      });
    });
  }

  /**
   * Get the attribute with this name or null if it doesn't exist
   *
   * @param key
   */
  public getAttribute(key: string): ValuePromise {
    return ValuePromise.execute(async () => {
      const name: string = `${this.name} -> ${key}`;
      const attr: string | null = await this._getAttribute(key);
      return this.context.wrapValue(attr, {
        name,
        sourceCode: `${key}="${attr}"`,
      });
    });
  }

  public getStyleProperty(key: string): ValuePromise {
    return ValuePromise.execute(async () => {
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
      return this.context.wrapValue(attr, { name });
    });
  }

  /**
   * Get the property with this name in the element, or null if it doesn't exist
   * @param key
   */
  public getProperty(key: string): ValuePromise {
    return ValuePromise.execute(async () => {
      return this.context.wrapValue(await this._getProperty(key), {
        name: `${key} of ${this.name}`,
      });
    });
  }

  /**
   * Get the value of this element, such as the value of an input field
   */
  public getValue(): ValuePromise {
    return ValuePromise.execute(async () =>
      this.context.wrapValue(await this._getValue(), {
        name: `Value of ${this.name}`,
      })
    );
  }

  /**
   * Get the text content within the element
   */
  public getText(): ValuePromise {
    return ValuePromise.execute(async () =>
      this.context.wrapValue(await this._getText(), {
        name: `Text of ${this.name}`,
      })
    );
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
    const overloaded = getMessageAndCallbackFromOverloading(a, b, this.path);
    const scenario = await this._createSubScenario(overloaded);
    this._completedAction("LOAD");
    const link: Link = await this.getLink();
    // If this is a lmabda scenario, define the response type and options
    if (overloaded.scenario === undefined) {
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

  protected async _getLambdaScenarioType(): Promise<
    ClassConstructor<iScenario>
  > {
    if ((await this._isFormTag()) || (await this._isClickable())) {
      // If we are loading an html page, stay in our current mode
      return this.context.scenario.type;
    } else if (await this._isImageTag()) {
      return ImageScenario;
    } else {
      return ResourceScenario;
    }
  }

  protected async _createSubScenario(
    overloaded: MessageAndCallback
  ): Promise<iScenario> {
    const scenarioType = await this._getLambdaScenarioType();
    const opts = this.context.scenario.request.options;
    return overloaded.scenario === undefined
      ? this.context.suite.scenario(overloaded.message, scenarioType, opts)
      : overloaded.scenario;
  }

  protected _loadSubScenario(
    overloaded: MessageAndCallback
  ): Promise<iScenario> {
    return overloaded.scenario === undefined
      ? this.load(overloaded.message, overloaded.callback)
      : this.load(overloaded.scenario);
  }
}
