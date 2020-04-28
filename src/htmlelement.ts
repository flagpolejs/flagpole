import { DOMElement } from "./domelement";
import { Link } from "./link";
import { ResponseType } from "./enums";
import { iAssertionContext, iScenario, iValue, KeyValue } from "./interfaces";
import { asyncForEach, getMessageAndCallbackFromOverloading } from "./util";
import { HttpMethodVerb } from "./httprequest";

const cheerio: CheerioAPI = require("cheerio");
let $: CheerioStatic;

export class HTMLElement extends DOMElement implements iValue {
  protected _path: string;
  protected _input: Cheerio | CheerioElement;

  public get $(): Cheerio | CheerioElement {
    return this._input;
  }

  protected get el(): Cheerio {
    return $(this._input);
  }

  public static async create(
    input: any,
    context: iAssertionContext,
    name: string | null = null,
    path?: string
  ): Promise<HTMLElement> {
    const element = new HTMLElement(input, context, name, path);
    element._tagName = await element._getTagName();
    element._sourceCode = (await element.getOuterHtml()).toString();
    if (name === null) {
      if (element._tagName !== null) {
        element._name = `<${element.tagName}> Element @ ${path}`;
      } else if (path) {
        element._name = String(path);
      }
    }
    return element;
  }

  protected constructor(
    input: any,
    context: iAssertionContext,
    name?: string | null,
    path?: string
  ) {
    super(input, context, name || "HTML Element");
    this._path = path || "";
    this._input = input;
    $ = context.response.getRoot();
  }

  /**
   * Find for first element at this selector path
   *
   * @param selector
   */
  public async find(selector: string): Promise<iValue> {
    const element: Cheerio = this.el.find(selector).eq(0);
    const name: string = `${selector} under ${this.name}`;
    const path: string = `${this.path} ${selector}`;
    if (element !== null) {
      return HTMLElement.create(element, this._context, name, path);
    }
    return this._wrapAsValue(null, name);
  }

  public async findAll(selector: string): Promise<HTMLElement[]> {
    const elements: CheerioElement[] = this.el.find(selector).toArray();
    const out: HTMLElement[] = [];
    await asyncForEach(elements, async (element, i) => {
      return out.push(
        await HTMLElement.create(
          element,
          this._context,
          `${selector}[${i}] under ${this.name}`,
          `${this.path} ${selector}[${i}]`
        )
      );
    });
    return out;
  }

  public async getClosest(
    selector: string = "*"
  ): Promise<HTMLElement | iValue> {
    const closest: Cheerio = await this.el.closest(selector);
    const name: string = `Closest ${selector} of ${this.name}`;
    const path: string = `${this.path}[ancestor-or-self::${selector}]`;
    if (closest.length > 0) {
      return HTMLElement.create(closest[0], this._context, name, path);
    }
    return this._wrapAsValue(null, name, this);
  }

  public async getChildren(selector: string = "*"): Promise<HTMLElement[]> {
    const children: Cheerio = await this.el.children(selector);
    const out: HTMLElement[] = [];
    for (let i = 0; i < children.length; i++) {
      out.push(
        await HTMLElement.create(
          children[i],
          this._context,
          `Child ${selector} ${i} of ${this.name}`,
          `${this.path}[child::${selector}][${i}]`
        )
      );
    }
    return out;
  }

  public async getSiblings(selector: string = "*"): Promise<HTMLElement[]> {
    const children: Cheerio = await this.el.siblings(selector);
    const out: HTMLElement[] = [];
    for (let i = 0; i < children.length; i++) {
      out.push(
        await HTMLElement.create(
          children[i],
          this._context,
          `Sibling ${selector} ${i} of ${this.name}`,
          `${this.path}[sibling::${selector}][${i}]`
        )
      );
    }
    return out;
  }

  public async getParent(): Promise<HTMLElement | iValue> {
    const parent: Cheerio = this.el.parent();
    const name: string = `Parent of ${this.name}`;
    const path: string = `${this.path}[..]`;
    if (parent !== null) {
      return HTMLElement.create(parent, this._context, name, path);
    }
    return this._wrapAsValue(null, name, this);
  }

  public async getPreviousSibling(
    selector: string = "*"
  ): Promise<HTMLElement | iValue> {
    const siblings: Cheerio = await this.el.prev(selector);
    const name: string = `Previous Sibling of ${this.name}`;
    const path: string = `${this.path}[preceding-sibling::${selector}][0]`;
    if (siblings.length > 0) {
      return HTMLElement.create(siblings[0], this._context, name, path);
    }
    return this._wrapAsValue(null, name, this);
  }

  public async getPreviousSiblings(
    selector: string = "*"
  ): Promise<HTMLElement[]> {
    const siblingElements: Cheerio = await this.el.prevAll(selector);
    const siblings: HTMLElement[] = [];
    for (let i = 0; i < siblingElements.length; i++) {
      siblings.push(
        await HTMLElement.create(
          siblingElements[i],
          this._context,
          `Previous Sibling ${i} of ${this.name}`,
          `${this.path}[preceding-sibling::${selector}][${i}]`
        )
      );
    }
    return siblings;
  }

  public async getNextSibling(
    selector: string = "*"
  ): Promise<HTMLElement | iValue> {
    const siblings: Cheerio = await this.el.next(selector);
    const name: string = `Next Sibling of ${this.name}`;
    const path: string = `${this.path}[following-sibling::${selector}][0]`;
    if (siblings.length > 0) {
      return HTMLElement.create(siblings[0], this._context, name, path);
    }
    return this._wrapAsValue(null, name, this);
  }

  public async getNextSiblings(selector: string = "*"): Promise<HTMLElement[]> {
    const siblingElements: Cheerio = await this.el.nextAll(selector);
    const siblings: HTMLElement[] = [];
    for (let i = 0; i < siblingElements.length; i++) {
      siblings.push(
        await HTMLElement.create(
          siblingElements[i],
          this._context,
          `Next Sibling ${i} of ${this.name}`,
          `${this.path}[following-sibling::${selector}][${i}]`
        )
      );
    }
    return siblings;
  }

  /**
   * Click on this element and then load a new page. For HTML/DOM scenarios this creates a new scenario
   */
  public async click(): Promise<void>;
  public async click(message: string): Promise<iScenario>;
  public async click(callback: Function): Promise<iScenario>;
  public async click(scenario: iScenario): Promise<iScenario>;
  public async click(message: string, callback: Function): Promise<iScenario>;
  public async click(
    a?: string | Function | iScenario,
    b?: Function
  ): Promise<iScenario | void> {
    const overloaded = getMessageAndCallbackFromOverloading(a, b, this._path);
    // If this is a link tag, treat it the same as load
    if (await this._isLinkTag()) {
      // Load a sub scenario
      if (a || b) {
        this._completedAction("CLICK");
        return this._loadSubScenario(overloaded);
      }
      // Click and replace the current response context (like we'd do in Puppeteer)
      else {
        throw new Error(
          "Calling the element.click() method with no arguements is not yet supported for HTML/DOM type request."
        );
      }
    }
    // Is this a button?
    else if (await this._isButtonTag()) {
      const type: iValue = await this.getAttribute("type");
      if (type.isNull() || type.toString().toLowerCase() == "submit") {
        // Grab the form and submit it
        const form = (<Cheerio>this._input).closest("form");
        const formEl = await HTMLElement.create(
          form,
          this._context,
          `Parent form of ${this.name}`,
          this.path
        );
        this._completedAction("CLICK");
        return overloaded.scenario === undefined
          ? formEl.submit(overloaded.message, overloaded.callback)
          : formEl.submit(overloaded.scenario);
      }
    }
    throw new Error(`${this.name} is not a clickable element.`);
  }

  /**
   * Fill out the form with this data.
   *
   * @param formData
   */
  public async fillForm(
    attributeName: string,
    formData: KeyValue
  ): Promise<iValue>;
  public async fillForm(formData: KeyValue): Promise<iValue>;
  public async fillForm(a: string | KeyValue, b?: KeyValue): Promise<iValue> {
    if (!(await this._isFormTag())) {
      throw new Error("This is not a form element.");
    }
    const attributeName: string = typeof a === "string" ? a : "name";
    const formData: KeyValue = (typeof a === "string" ? b : a) || {};
    const form: Cheerio = this.el;
    for (let name in formData) {
      const value = formData[name];
      form.find(`[${attributeName}="${name}"]`).val(value);
    }
    this._completedAction("FILL");
    return this;
  }

  /**
   * If this is a form element, submit the form
   */
  public async submit(): Promise<void>;
  public async submit(message: string): Promise<iScenario>;
  public async submit(callback: Function): Promise<iScenario>;
  public async submit(scenario: iScenario): Promise<iScenario>;
  public async submit(message: string, callback: Function): Promise<iScenario>;
  public async submit(
    a?: string | Function | iScenario,
    b?: Function
  ): Promise<iScenario | void> {
    if (!this._isFormTag()) {
      throw new Error("You can only use .submit() with a form element.");
    }
    if (a || b) {
      const link: Link = await this._getLink();
      const overloaded = getMessageAndCallbackFromOverloading(a, b, this._path);
      const scenarioType: ResponseType = await this._getLambdaScenarioType();
      const opts: any = await this._getLambdaScenarioOpts(scenarioType);
      const scenario: iScenario = this._createSubScenario(
        overloaded,
        scenarioType,
        opts
      );
      const method = ((await this._getAttribute("method")) || "get")
        .toString()
        .toLowerCase();
      // If there is a URL we can submit the form to
      if (link.isNavigation()) {
        if (method == "get") {
          link.setQueryString(this.el.serializeArray());
        } else {
          const formDataArray: {
            name: string;
            value: string;
          }[] = this.el.serializeArray();
          const formData: any = {};
          formDataArray.forEach(function (input: any) {
            formData[input.name] = input.value;
          });
          scenario.setFormData(formData);
        }
        scenario.setMethod(<HttpMethodVerb>method);
        scenario.next(overloaded.callback);
        scenario.open(link.getUri());
        this._completedAction("SUBMIT");
      }
      // Not a valid URL to submit form to
      else {
        scenario.skip("Nothing to submit");
      }
      return scenario;
    }
  }

  protected async _getTagName(): Promise<string> {
    return this.el.get(0).tagName.toLowerCase();
  }

  protected async _getAttribute(key: string): Promise<string | null> {
    return typeof this.el.get(0).attribs[key] !== "undefined"
      ? this.el.get(0).attribs[key]
      : null;
  }
}
