import { DOMElement } from "./dom-element";
import { Link } from "../link";
import {
  iAssertionContext,
  iValue,
  HttpMethodVerb,
  KeyValue,
  FindAllOptions,
  FindOptions,
  ValueOptions,
} from "../interfaces";
import { asyncForEach, getFindParams, filterFind } from "../helpers";
import { ValuePromise } from "../value-promise";
import { HttpRequest } from "../http/http-request";

let $: cheerio.Root;

export class HTMLElement<InputType extends cheerio.Element = cheerio.Element>
  extends DOMElement<InputType>
  implements iValue<InputType>
{
  public static async create<T extends cheerio.Element>(
    input: T,
    context: iAssertionContext,
    opts: ValueOptions
  ): Promise<HTMLElement<T>> {
    const element = new HTMLElement(input, context, opts);
    element.opts.tagName = await element._getTagName();
    element.opts.sourceCode = (await element.getOuterHtml()).toString();
    if (name === null) {
      if (element.opts.tagName !== null) {
        element.opts.name = `<${element.tagName}> Element @ ${element.selector}`;
      } else if (element.path) {
        element.opts.name = String(element.path);
      }
    }
    return element;
  }

  protected constructor(
    input: InputType,
    context: iAssertionContext,
    opts?: ValueOptions
  ) {
    super(input, context, { ...{ name: "HTML Element" }, ...opts });
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
  ): ValuePromise<InputType | null> {
    const params = getFindParams(a, b);
    const opts: ValueOptions = {
      name: `${selector} under ${this.name}`,
      path: `${this.path} ${selector}`,
      selector,
    };
    return ValuePromise.execute(async () => {
      if (params.contains || params.matches) {
        // TODO: Implement this
      } else {
        const element = this.cheerio.find(selector)[0];
        if (element) {
          return HTMLElement.create<InputType>(
            element as InputType,
            this.context,
            opts
          );
        }
      }
      return this.valueFactory.createNull(opts);
    });
  }

  public async findAll(
    selector: string,
    a?: string | RegExp | FindAllOptions,
    b?: FindAllOptions
  ): Promise<HTMLElement<InputType>[]> {
    const params = getFindParams(a, b);
    const out: HTMLElement<InputType>[] = [];
    const elements = this.cheerio.find(selector).toArray();
    await asyncForEach(elements, async (element, i) => {
      out.push(
        await HTMLElement.create(element, this.context, {
          name: `${selector}[${i}] under ${this.name}`,
          path: `${this.path} ${selector}[${i}]`,
          selector,
        })
      );
    });
    return filterFind<InputType>(
      out,
      params.contains || params.matches,
      params.opts
    ).map((el) => el as HTMLElement<InputType>);
  }

  public getAncestorOrSelf(selector: string): ValuePromise {
    return ValuePromise.execute(async () => {
      const closest = this.cheerio.closest(selector);
      const opts: ValueOptions = {
        name: `Closest ${selector} of ${this.name}`,
        path: `${this.path}[ancestor-or-self::${selector}]`,
        selector,
      };
      if (closest.length > 0) {
        return HTMLElement.create(closest[0], this.context, opts);
      }
      return this.valueFactory.createNull(opts);
    });
  }

  public getFirstChild(selector: string): ValuePromise {
    return ValuePromise.execute(async () => {
      const child = this.cheerio.children(selector).first()[0];
      return HTMLElement.create(child, this.context, {
        name: `First Child ${selector} of ${this.name}`,
        path: `${this.path}[child::${selector}][1]`,
        selector,
      });
    });
  }

  public getLastChild(selector: string): ValuePromise {
    return ValuePromise.execute(async () => {
      const child = this.cheerio.children(selector).last()[0];
      return HTMLElement.create(child, this.context, {
        name: `First Child ${selector} of ${this.name}`,
        path: `${this.path}[child::${selector}][1]`,
        selector,
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
          selector,
        })
      );
    }
    return out;
  }

  public async getSiblings(
    selector: string
  ): Promise<HTMLElement<cheerio.Element>[]> {
    const children = this.cheerio.siblings(selector).toArray();
    const out: HTMLElement<cheerio.Element>[] = [];
    for (let i = 0; i < children.length; i++) {
      out.push(
        await HTMLElement.create(children[i], this.context, {
          name: `Sibling ${selector} ${i} of ${this.name}`,
          path: `${this.path}[sibling::${selector}][${i}]`,
          selector,
        })
      );
    }
    return out;
  }

  public getFirstSibling(selector: string): ValuePromise {
    return ValuePromise.execute(async () => {
      const child = this.cheerio.siblings(selector).first()[0];
      return HTMLElement.create(child, this.context, {
        name: `First sibling ${selector}} of ${this.name}`,
        path: `${this.path}[sibling::${selector}][1]`,
        selector,
      });
    });
  }

  public getLastSibling(selector: string): ValuePromise {
    return ValuePromise.execute(async () => {
      const child = this.cheerio.siblings(selector).last()[0];
      return HTMLElement.create(child, this.context, {
        name: `Last sibling ${selector}} of ${this.name}`,
        path: `${this.path}[sibling::${selector}][last()]`,
        selector,
      });
    });
  }

  public getAncestor(selector: string = "*"): ValuePromise {
    return ValuePromise.execute(async () => {
      const ancestors = this.cheerio.parentsUntil(selector);
      const opts: ValueOptions = {
        name: `Ancestor of ${this.name}`,
        path: `${this.path}[ancestor::${selector}][0]`,
        selector,
      };
      return ancestors.length > 0
        ? HTMLElement.create(ancestors[0], this.context, opts)
        : this.valueFactory.createNull(opts);
    });
  }

  public getParent(): ValuePromise {
    return ValuePromise.execute(async () => {
      const parent = this.cheerio.parent()[0];
      const opts: ValueOptions = {
        name: `Parent of ${this.name}`,
        path: `${this.path}[..]`,
      };
      if (parent !== null) {
        return HTMLElement.create(parent, this.context, opts);
      }
      return this.valueFactory.createNull(opts);
    });
  }

  public getPreviousSibling(selector: string = "*"): ValuePromise {
    return ValuePromise.execute(async () => {
      const sibling = this.cheerio.prev(selector)[0];
      const opts: ValueOptions = {
        name: `Previous Sibling of ${this.name}`,
        path: `${this.path}[preceding-sibling::${selector}][0]`,
        selector,
      };
      if (sibling) return HTMLElement.create(sibling, this.context, opts);
      return this.valueFactory.createNull(opts);
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
          selector,
        })
      );
    }
    return siblings;
  }

  public getNextSibling(selector: string = "*"): ValuePromise {
    return ValuePromise.execute(async () => {
      const sibling = this.cheerio.next(selector)[0];
      const opts: ValueOptions = {
        name: `Next Sibling of ${this.name}`,
        path: `${this.path}/following-sibling::${selector}[0]`,
        selector,
      };
      if (sibling) return HTMLElement.create(sibling, this.context, opts);
      return this.valueFactory.createNull(opts);
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
          selector,
        })
      );
    }
    return siblings;
  }

  /**
   * Click on this element and then load a new page.
   */
  public click(): ValuePromise {
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
          const form = this.cheerio.closest("form")[0];
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
  public fillForm(attributeName: string, formData: KeyValue): ValuePromise;
  public fillForm(formData: KeyValue): ValuePromise;
  public fillForm(a: string | KeyValue, b?: KeyValue): ValuePromise {
    return ValuePromise.execute(async () => {
      if (!(await this._isFormTag())) {
        throw new Error("This is not a form element.");
      }
      const attributeName: string = typeof a === "string" ? a : "name";
      const formData: KeyValue = (typeof a === "string" ? b : a) || {};
      for (const name in formData) {
        const value = formData[name];
        const selector = `[${attributeName}="${name}"]`;
        const field = this.cheerio.find(selector);
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
  public submit(): ValuePromise {
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
