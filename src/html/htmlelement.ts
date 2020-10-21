import { DOMElement } from "./domelement";
import { Link } from "../link";
import {
  iAssertionContext,
  iValue,
  KeyValue,
  FindOptions,
  FindAllOptions,
} from "../interfaces";
import { asyncForEach } from "../util";
import { getFindParams, filterFind } from "../helpers";
import { HttpMethodVerb } from "../httprequest";
import { HttpRequest } from "../httprequest";
import * as cheerio from "cheerio";
import { ValuePromise } from "../value-promise";

let $: cheerio.Root;

export class HTMLElement extends DOMElement implements iValue {
  protected _path: string;
  protected _input: cheerio.Cheerio | cheerio.Element;

  public get $(): cheerio.Cheerio | cheerio.Element {
    return this._input;
  }

  protected get el(): cheerio.Cheerio {
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
  public find(
    selector: string,
    a?: string | RegExp | FindOptions,
    b?: FindOptions
  ): ValuePromise {
    return ValuePromise.execute(async () => {
      const params = getFindParams(a, b);
      const name: string = `${selector} under ${this.name}`;
      const path: string = `${this.path} ${selector}`;
      if (params.contains || params.matches) {
      } else {
        const element = this.el.find(selector).eq(0);
        if (element !== null) {
          return HTMLElement.create(element, this._context, name, path);
        }
      }
      return this._wrapAsValue(null, name);
    });
  }

  public async findAll(
    selector: string,
    a?: string | RegExp | FindAllOptions,
    b?: FindAllOptions
  ): Promise<iValue[]> {
    const params = getFindParams(a, b);
    const out: iValue[] = [];
    const elements = this.el.find(selector).toArray();
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
    return filterFind(out, params.contains || params.matches, params.opts);
  }

  public async getAncestorOrSelf(selector: string): Promise<iValue> {
    const closest = this.el.closest(selector);
    const name: string = `Closest ${selector} of ${this.name}`;
    const path: string = `${this.path}[ancestor-or-self::${selector}]`;
    if (closest.length > 0) {
      return HTMLElement.create(closest[0], this._context, name, path);
    }
    return this._wrapAsValue(null, name, this);
  }

  public async getFirstChild(selector: string): Promise<iValue> {
    const child = this.el.children(selector).first();
    return HTMLElement.create(
      child,
      this._context,
      `First Child ${selector} of ${this.name}`,
      `${this.path}[child::${selector}][1]`
    );
  }

  public async getLastChild(selector: string): Promise<iValue> {
    const child = this.el.children(selector).last();
    return HTMLElement.create(
      child,
      this._context,
      `First Child ${selector} of ${this.name}`,
      `${this.path}[child::${selector}][1]`
    );
  }

  public async getChildren(selector: string = "*"): Promise<HTMLElement[]> {
    const children = this.el.children(selector);
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

  public async getSiblings(selector: string): Promise<iValue[]> {
    const children = this.el.siblings(selector);
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

  public async getFirstSibling(selector: string): Promise<iValue> {
    const child = this.el.siblings(selector).first();
    return HTMLElement.create(
      child,
      this._context,
      `First sibling ${selector}} of ${this.name}`,
      `${this.path}[sibling::${selector}][1]`
    );
  }

  public async getLastSibling(selector: string): Promise<iValue> {
    const child = this.el.siblings(selector).last();
    return HTMLElement.create(
      child,
      this._context,
      `Last sibling ${selector}} of ${this.name}`,
      `${this.path}[sibling::${selector}][last()]`
    );
  }

  public async getAncestor(
    selector: string = "*"
  ): Promise<HTMLElement | iValue> {
    const ancestors = this.el.parentsUntil(selector);
    const name: string = `Ancestor of ${this.name}`;
    const path: string = `${this.path}[ancestor::${selector}][0]`;
    return ancestors.length > 0
      ? HTMLElement.create(ancestors[0], this._context, name, path)
      : this._wrapAsValue(null, name, this);
  }

  public async getParent(): Promise<HTMLElement | iValue> {
    const parent = this.el.parent();
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
    const siblings = this.el.prev(selector);
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
    const siblingElements = this.el.prevAll(selector);
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
    const siblings = this.el.next(selector);
    const name: string = `Next Sibling of ${this.name}`;
    const path: string = `${this.path}/following-sibling::${selector}[0]`;
    if (siblings.length > 0) {
      return HTMLElement.create(siblings[0], this._context, name, path);
    }
    return this._wrapAsValue(null, name, this);
  }

  public async getNextSiblings(selector: string = "*"): Promise<HTMLElement[]> {
    const siblingElements = this.el.nextAll(selector);
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
  public async click(): Promise<iValue> {
    // If this is a link tag, treat it the same as load
    if (await this._isLinkTag()) {
      const link = await this.getLink();
      if (link.isNavigation()) {
        const request = new HttpRequest({
          uri: link.getUri(),
          method: "get",
        });
        this._completedAction("CLICK");
        this.context.response.init(await request.fetch());
        return this;
      }
    }
    // Is this a button?
    else if (await this._isButtonTag()) {
      const type: iValue = await this.getAttribute("type");
      if (type.isNull() || type.toString().toLowerCase() == "submit") {
        // Grab the form and submit it
        const form = (this._input as cheerio.Cheerio).closest("form");
        const formEl = await HTMLElement.create(
          form,
          this._context,
          `Parent form of ${this.name}`,
          this.path
        );
        this._completedAction("CLICK");
        formEl.submit();
        return this;
      }
    }
    this.context.logFailure(`${this.name} is not a clickable element.`);
    return this;
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
    const form = this.el;
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
  public async submit(): Promise<iValue> {
    if (!this._isFormTag()) {
      throw new Error("You can only use .submit() with a form element.");
    }
    const link: Link = await this.getLink();
    // If there is a URL we can submit the form to
    if (link.isNavigation()) {
      const method = ((await this._getAttribute("method")) || "get")
        .toString()
        .toLowerCase();
      if (method == "get") {
        link.setQueryString(this.el.serializeArray());
      }
      const request = new HttpRequest({
        uri: link.getUri(),
        method: method as HttpMethodVerb,
      });
      if (method != "get") {
        const formDataArray: {
          name: string;
          value: string;
        }[] = this.el.serializeArray();
        const formData: any = {};
        formDataArray.forEach(function (input: any) {
          formData[input.name] = input.value;
        });
        request.setFormData(formData);
      }
      this._completedAction("SUBMIT");
      this.context.response.init(await request.fetch());
      return this;
    }
    this.context.logFailure(
      `This element could not be submitted: ${this.name}`
    );
    return this;
  }

  protected async _getText(): Promise<string> {
    return this.el.text();
  }

  protected async _getValue(): Promise<any> {
    return this.el.val();
  }

  protected async _getProperty(key: string): Promise<any> {
    return this.el.prop(key);
  }

  protected async _getInnerText() {
    return this.el.text();
  }

  protected async _getInnerHtml() {
    return this.el.html() || "";
  }

  protected async _getOuterHtml() {
    return this._context.response.getRoot().html(this._input);
  }

  protected async _getClassName(): Promise<string> {
    return typeof this.el.get(0).attribs["class"] !== "undefined"
      ? this.el.get(0).attribs["class"]
      : null;
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
