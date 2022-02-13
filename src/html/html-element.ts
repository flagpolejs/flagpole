import { DOMElement } from "./dom-element";
import { Link } from "../link";
import { asyncForEach } from "../util";
import { getFindParams, filterFind } from "../helpers";
import { ValuePromise } from "../value-promise";
import { HttpRequest } from "../http/http-request";
import { FindAllOptions, FindOptions } from "../interfaces/find-options";
import { KeyValue } from "../interfaces/generic-types";
import { HttpMethodVerb } from "../interfaces/http";
import { iValue } from "../interfaces/ivalue";
import { ValueOptions } from "../interfaces/value-options";
import { AssertionContext } from "..";

let $: cheerio.Root;

export type CheerioElement = cheerio.Element | cheerio.Cheerio | null;

export class HTMLElement<
  InputType extends CheerioElement = CheerioElement
> extends DOMElement<InputType> {
  public static async create(
    input: CheerioElement,
    context: AssertionContext,
    opts: ValueOptions
  ) {
    const element = new this(input, context, opts);
    element.opts.tagName = await element._getTagName();
    element.opts.sourceCode = (await element.getOuterHtml()).toString();
    if (!opts.name) {
      if (element.opts.tagName) {
        element.opts.name = `<${element.tagName}> Element @ ${element.path}`;
      }
    }
    return element;
  }

  constructor(input: InputType, context: AssertionContext, opts: ValueOptions) {
    super(input, context, {
      name: "HTML Element",
      ...opts,
    });
    $ = context.response.getRoot();
  }

  protected get cheerio(): cheerio.Cheerio {
    return $(this.$);
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
  ): ValuePromise<CheerioElement, HTMLElement> {
    return ValuePromise.execute(async () => {
      const params = getFindParams(a, b);
      const name: string = `${selector} under ${this.name}`;
      const path: string = `${this.path} ${selector}`;
      if (params.contains || params.matches) {
      } else {
        const element = this.cheerio.find(selector).eq(0);
        if (element?.length) {
          return HTMLElement.create(element, this.context, { name, path });
        }
      }
      return HTMLElement.create(null, this.context, { name });
    });
  }

  public async findAll(
    selector: string,
    a?: string | RegExp | FindAllOptions,
    b?: FindAllOptions
  ): Promise<HTMLElement[]> {
    const params = getFindParams(a, b);
    const out: HTMLElement[] = [];
    const elements: cheerio.Element[] = this.cheerio.find(selector).toArray();
    await asyncForEach(elements, async (element, i) => {
      return out.push(
        await HTMLElement.create(element, this.context, {
          name: `${selector}[${i}] under ${this.name}`,
          path: `${this.path} ${selector}[${i}]`,
        })
      );
    });
    return filterFind<CheerioElement, HTMLElement>(
      out,
      params.contains || params.matches,
      params.opts
    );
  }

  public getAncestorOrSelf(
    selector: string
  ): ValuePromise<CheerioElement, HTMLElement> {
    const closest = this.cheerio.closest(selector);
    const name: string = `Closest ${selector} of ${this.name}`;
    const path: string = `${this.path}[ancestor-or-self::${selector}]`;
    const el = closest.length > 0 ? closest[0] : null;
    return this.valueFactory.createPromise<CheerioElement, HTMLElement>(
      el,
      { name, path },
      HTMLElement
    );
  }

  public getFirstChild(
    selector: string
  ): ValuePromise<CheerioElement, HTMLElement> {
    return ValuePromise.execute(async () => {
      const child = this.cheerio.children(selector).first();
      return HTMLElement.create(child, this.context, {
        name: `First Child ${selector} of ${this.name}`,
        path: `${this.path}[child::${selector}][1]`,
      });
    });
  }

  public getLastChild(
    selector: string
  ): ValuePromise<CheerioElement, HTMLElement> {
    return ValuePromise.execute(async () => {
      const child = this.cheerio.children(selector).last();
      return HTMLElement.create(child, this.context, {
        name: `First Child ${selector} of ${this.name}`,
        path: `${this.path}[child::${selector}][1]`,
      });
    });
  }

  public async getChildren(selector: string = "*"): Promise<HTMLElement[]> {
    const children = this.cheerio.children(selector);
    const out: HTMLElement[] = [];
    for (let i = 0; i < children.length; i++) {
      out.push(
        await HTMLElement.create(children[i], this.context, {
          name: `Child ${selector} ${i} of ${this.name}`,
          path: `${this.path}[child::${selector}][${i}]`,
        })
      );
    }
    return out;
  }

  public async getSiblings(selector: string): Promise<HTMLElement[]> {
    const children = this.cheerio.siblings(selector).toArray();
    const out: HTMLElement[] = [];
    for (let i = 0; i < children.length; i++) {
      out.push(
        await HTMLElement.create(children[i], this.context, {
          name: `Sibling ${selector} ${i} of ${this.name}`,
          path: `${this.path}[sibling::${selector}][${i}]`,
        })
      );
    }
    return out;
  }

  public getFirstSibling(
    selector: string
  ): ValuePromise<CheerioElement, HTMLElement> {
    return ValuePromise.execute(async () => {
      const child = this.cheerio.siblings(selector).first();
      return HTMLElement.create(child, this.context, {
        name: `First sibling ${selector}} of ${this.name}`,
        path: `${this.path}[sibling::${selector}][1]`,
      });
    });
  }

  public getLastSibling(
    selector: string
  ): ValuePromise<CheerioElement, HTMLElement> {
    return ValuePromise.execute(async () => {
      const child = this.cheerio.siblings(selector).last();
      return HTMLElement.create(child, this.context, {
        name: `Last sibling ${selector}} of ${this.name}`,
        path: `${this.path}[sibling::${selector}][last()]`,
      });
    });
  }

  public getAncestor(selector: string = "*"): ValuePromise<any, iValue> {
    const ancestors = this.cheerio.parentsUntil(selector);
    const name: string = `Ancestor of ${this.name}`;
    const path: string = `${this.path}[ancestor::${selector}][0]`;
    const el: CheerioElement = ancestors.length > 0 ? ancestors[0] : null;
    return this.valueFactory.createPromise(el, { name, path });
  }

  public getParent(): ValuePromise<CheerioElement, HTMLElement> {
    return ValuePromise.execute(async () => {
      const parent = this.cheerio.parent();
      const name: string = `Parent of ${this.name}`;
      const path: string = `${this.path}[..]`;
      return HTMLElement.create(parent, this.context, { name, path });
    });
  }

  public getPreviousSibling(
    selector: string = "*"
  ): ValuePromise<CheerioElement, HTMLElement> {
    return ValuePromise.execute(async () => {
      const siblings = this.cheerio.prev(selector);
      const name: string = `Previous Sibling of ${this.name}`;
      const path: string = `${this.path}[preceding-sibling::${selector}][0]`;
      return HTMLElement.create(
        siblings.length > 0 ? siblings[0] : null,
        this.context,
        { name, path }
      );
    });
  }

  public async getPreviousSiblings(
    selector: string = "*"
  ): Promise<HTMLElement[]> {
    const siblingElements = this.cheerio.prevAll(selector);
    const siblings: HTMLElement[] = [];
    for (let i = 0; i < siblingElements.length; i++) {
      siblings.push(
        await HTMLElement.create(siblingElements[i], this.context, {
          name: `Previous Sibling ${i} of ${this.name}`,
          path: `${this.path}[preceding-sibling::${selector}][${i}]`,
        })
      );
    }
    return siblings;
  }

  public getNextSibling(
    selector: string = "*"
  ): ValuePromise<CheerioElement, HTMLElement> {
    return ValuePromise.execute(async () => {
      const siblings = this.cheerio.next(selector);
      const name: string = `Next Sibling of ${this.name}`;
      const path: string = `${this.path}/following-sibling::${selector}[0]`;
      return HTMLElement.create(
        siblings.length > 0 ? siblings[0] : null,
        this.context,
        { name, path }
      );
    });
  }

  public async getNextSiblings(selector: string = "*"): Promise<HTMLElement[]> {
    const siblingElements = this.cheerio.nextAll(selector);
    const siblings: HTMLElement[] = [];
    for (let i = 0; i < siblingElements.length; i++) {
      siblings.push(
        await HTMLElement.create(siblingElements[i], this.context, {
          name: `Next Sibling ${i} of ${this.name}`,
          path: `${this.path}[following-sibling::${selector}][${i}]`,
        })
      );
    }
    return siblings;
  }

  /**
   * Click on this element and then load a new page.
   */
  public click(): ValuePromise<InputType, this> {
    return ValuePromise.execute(async () => {
      // If this is a link tag, treat it the same as load
      if (await this._isLinkTag()) {
        const link = await this.getLink();
        if (link.isNavigation()) {
          this._completedAction("CLICK");
          this.context.response.navigate(
            new HttpRequest({
              uri: link.getUri(),
              method: "get",
            })
          );
          return this;
        }
      }
      // Is this a button?
      else if (await this._isButtonTag()) {
        const type: iValue<any> = await this.getAttribute("type");
        if (type.isNull() || type.toString().toLowerCase() == "submit") {
          // Grab the form and submit it
          const form = (this.$ as cheerio.Cheerio).closest("form");
          const formEl = await HTMLElement.create(form, this.context, {
            name: `Parent form of ${this.name}`,
            path: this.path,
          });
          this._completedAction("CLICK");
          formEl.submit();
          return this;
        }
      }
      this.context.logFailure(`${this.name} is not a clickable element.`);
      return this;
    });
  }

  /**
   * Fill out the form with this data.
   *
   * @param formData
   */
  public fillForm(
    attributeName: string,
    formData: KeyValue
  ): ValuePromise<InputType, this>;
  public fillForm(formData: KeyValue): ValuePromise<InputType, this>;
  public fillForm(a: string | KeyValue, b?: KeyValue) {
    return ValuePromise.execute(async () => {
      if (!(await this._isFormTag())) {
        throw new Error("This is not a form element.");
      }
      const attributeName: string = typeof a === "string" ? a : "name";
      const formData: KeyValue = (typeof a === "string" ? b : a) || {};
      const form = this.cheerio;
      for (const name in formData) {
        const value = formData[name];
        const selector = `[${attributeName}="${name}"]`;
        const field = form.find(selector);
        if (field.length == 0) {
          this.context.logOptionalFailure(
            `Could not set form field ${name} to ${value}, because the field did not exist.`,
            selector
          );
        } else {
          field.val(value);
        }
      }
      this._completedAction("FILL");
      return this;
    });
  }

  /**
   * If this is a form element, submit the form
   */
  public submit(): ValuePromise<InputType, this> {
    return ValuePromise.execute(async () => {
      if (!(await this._isFormTag())) {
        throw new Error("You can only use .submit() with a form element.");
      }
      const link: Link = await this.getLink();
      // If there is a URL we can submit the form to
      if (link.isNavigation()) {
        const method = ((await this._getAttribute("method")) || "get")
          .toString()
          .toLowerCase();
        if (method == "get") {
          link.setQueryString(this.cheerio.serializeArray());
        }
        const request = new HttpRequest({
          uri: link.getUri(),
          method: method as HttpMethodVerb,
        });
        if (method != "get") {
          const formDataArray: {
            name: string;
            value: string;
          }[] = this.cheerio.serializeArray();
          const formData: any = {};
          formDataArray.forEach(function (input: any) {
            formData[input.name] = input.value;
          });
          request.setFormData(formData);
        }
        this._completedAction("SUBMIT");
        this.context.response.navigate(request);
        return this;
      }
      this.context.logFailure(
        `This element could not be submitted: ${this.name}`
      );
      return this;
    });
  }

  protected async _getText(): Promise<string> {
    return this.cheerio.text();
  }

  protected async _getValue(): Promise<any> {
    return this.cheerio.val();
  }

  protected async _getProperty(key: string): Promise<any> {
    return this.cheerio.prop(key);
  }

  protected async _getInnerText() {
    return this.cheerio.text();
  }

  protected async _getInnerHtml() {
    return this.cheerio.html() || "";
  }

  protected async _getOuterHtml() {
    return this.context.response.getRoot().html(this.$);
  }

  protected async _getClassName(): Promise<string> {
    return typeof this.cheerio.get(0).attribs["class"] !== "undefined"
      ? this.cheerio.get(0).attribs["class"]
      : null;
  }

  protected async _getTagName(): Promise<string> {
    return this.cheerio.get(0).tagName.toLowerCase();
  }

  protected async _getAttribute(key: string): Promise<string | null> {
    return typeof this.cheerio.get(0).attribs[key] !== "undefined"
      ? this.cheerio.get(0).attribs[key]
      : null;
  }
}
