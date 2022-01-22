import { asyncForEach, toType, toArray, asyncMap } from "../helpers";
import csstoxpath from "csstoxpath";
import { iBounds } from "../interfaces/ibounds";
import { KeyValue } from "../interfaces/generic-types";
import { ScreenshotOpts } from "../interfaces/screenshot";
import {
  JSHandle,
  ElementHandle,
  EvaluateFn,
  Page,
  PageFnOptions,
  SerializableOrJSHandle,
  BoxModel,
} from "puppeteer-core";
import { DOMElement } from "../html/dom-element";
import { ValuePromise } from "../value-promise";
import { BrowserScenario } from "./browser-scenario";
import { iValue, ValueOptions } from "../interfaces";
import { AssertionContext, BrowserResponse } from "..";

type ElementInput = ElementHandle<Element>;

export class BrowserElement<InputType extends ElementInput = ElementInput>
  extends DOMElement<InputType>
  implements iValue<InputType>
{
  public constructor(
    public readonly $: InputType,
    public readonly context: AssertionContext<BrowserScenario, BrowserResponse>,
    opts: ValueOptions
  ) {
    super($, context, opts);
  }

  public static async create<T extends ElementInput>(
    input: T,
    context: AssertionContext<BrowserScenario, BrowserResponse>,
    opts: ValueOptions
  ): Promise<BrowserElement> {
    const element = new BrowserElement(input, context, opts);
    await Promise.all([element._getTagName(), element._getSourceCode()]);
    return element;
  }

  public find(selector: string): ValuePromise<InputType | null> {
    const name = `${selector} under ${this.name}`;
    const path = `${this.selector} ${selector}`;
    return ValuePromise.execute(async () => {
      const element = await this.$.$(selector);
      if (element !== null) {
        const value = BrowserElement.create<InputType>(
          element as InputType,
          this.context,
          {
            name,
            path,
          }
        );
      }
      return this.valueFactory.createNull(name);
    });
  }

  public async findAll(selector: string): Promise<BrowserElement<InputType>[]> {
    const elements = await this.$.$$(selector);
    const out: BrowserElement<InputType>[] = [];
    await asyncForEach(elements, async (element, i) => {
      const el = await BrowserElement.create<InputType>(element, this.context, {
        name: `${selector}[${i}] under ${this.name}`,
        path: `${this.path} ${selector}[${i}]`,
        selector,
      });
      out.push(el as BrowserElement<InputType>);
    });
    return out;
  }

  public async getAncestors(selector: string): Promise<iValue[]> {
    return this._elementHandlesToValueArray(
      await this._xQuery("ancestor::", selector),
      `Ancestors ${selector} of ${this.name}`,
      `${this.path}[ancestor::${selector}]`
    );
  }

  public getAncestorOrSelf(selector: string): ValuePromise {
    return ValuePromise.execute(async () => {
      return this._elementHandlesToFirstValue(
        await this._xQuery("ancestor-or-self::", selector, "[1]"),
        `Ansestor or self ${selector} of ${this.name}`,
        `ancestor-or-self::${selector}[1]`
      );
    });
  }

  public getFirstChild(selector?: string): ValuePromise {
    return ValuePromise.execute(async () => {
      return this._elementHandlesToFirstValue(
        await this._xQuery("child::", selector, "[1]"),
        `Child ${selector} of ${this.name}`,
        `child::${selector}[1]`
      );
    });
  }

  public getLastChild(selector?: string): ValuePromise {
    return ValuePromise.execute(async () => {
      return this._elementHandlesToFirstValue(
        await this._xQuery("child::", selector, "[last()]"),
        `Last child ${selector} of ${this.name}`,
        `child::${selector}[last()]`
      );
    });
  }

  public getFirstSibling(selector?: string): ValuePromise {
    return ValuePromise.execute(async () => {
      const siblings = await this.getSiblings(selector);
      return siblings[0];
    });
  }

  public getLastSibling(selector?: string): ValuePromise {
    return ValuePromise.execute(async () => {
      const siblings = await this.getSiblings(selector);
      return siblings[siblings.length - 1];
    });
  }

  public getChildOrSelf(selector?: string): ValuePromise {
    return ValuePromise.execute(async () => {
      const self = await this._xQuery("self::", selector);
      const elements = self.length
        ? self
        : await this._xQuery("child::", selector);
      return this._elementHandlesToFirstValue(
        elements,
        `Child or self ${selector} of ${this.name}`,
        `self or child::${selector}[0]`
      );
    });
  }

  public getDescendantOrSelf(selector?: string): ValuePromise {
    return ValuePromise.execute(async () => {
      return this._elementHandlesToFirstValue(
        await this._xQuery("descendant-or-self::", selector),
        `Descendant or self ${selector} of ${this.name}`,
        `descendant-or-self::${selector}[0]`
      );
    });
  }

  public async getDescendants(selector?: string): Promise<iValue[]> {
    return this._elementHandlesToValueArray(
      await this._xQuery("descendant::", selector),
      `Descendants ${selector} of ${this.name}`,
      `${this.selector}[descendant::${selector}]`
    );
  }

  public getAncestor(selector: string = "*"): ValuePromise {
    return ValuePromise.execute(async () => {
      const closest: ElementHandle[] = await this._xQuery(
        "ancestor::",
        selector
      );
      const name: string = `Ancestor ${selector} of ${this.name}`;
      const path: string = `${this.selector}[ancestor::${selector}]`;
      return closest.length > 0
        ? BrowserElement.create(closest[0], this.context, {
            name,
            selector: path,
          })
        : this.valueFactory.createNull(name);
    });
  }

  public async getChildren(selector: string = "*"): Promise<iValue[]> {
    const children: ElementHandle[] = await this._xQuery("child::", selector);
    const out: BrowserElement[] = [];
    await asyncForEach(children, async (child: ElementHandle, i: number) => {
      const opts: ValueOptions = {
        name: `Child ${selector} ${i} of ${this.name}`,
        path: `${this.path}[child::${selector}][${i}]`,
      };
      out.push(await BrowserElement.create(child, this.context, opts));
    });
    return out;
  }

  public getParent(): ValuePromise {
    return ValuePromise.execute(async () => {
      const parent: ElementHandle = await this.$.$x("..")[0];
      const opts: ValueOptions = {
        name: `Parent of ${this.name}`,
        path: `${this.path}[..]`,
      };
      if (parent) return BrowserElement.create(parent, this.context, opts);
      return this.valueFactory.createNull(opts);
    });
  }

  public async getSiblings(selector: string = "*"): Promise<iValue[]> {
    const prevSiblings: ElementHandle[] = await this._xQuery(
      "preceding-sibling::",
      selector
    );
    const nextSiblings: ElementHandle[] = await this._xQuery(
      "following-sibling::",
      selector
    );
    const siblings: BrowserElement[] = [];
    await asyncForEach(
      prevSiblings.concat(nextSiblings),
      async (sibling: ElementHandle, i: number) => {
        const opts: ValueOptions = {
          name: `Sibling ${i} of ${this.name}`,
          path: `${this.path}[sibling::${selector}][${i}]`,
        };
        siblings.push(await BrowserElement.create(sibling, this.context, opts));
      }
    );
    return siblings;
  }

  public getPreviousSibling(selector: string = "*"): ValuePromise {
    return ValuePromise.execute(async () => {
      const siblings: ElementHandle[] = await this._xQuery(
        "preceding-sibling::",
        selector
      );
      const opts: ValueOptions = {
        name: `Previous Sibling of ${this.name}`,
        path: `${this.path}[preceding-sibling::${selector}][0]`,
      };
      if (siblings.length > 0) {
        return BrowserElement.create(siblings[0], this.context, opts);
      }
      return this.valueFactory.createNull(opts);
    });
  }

  public async getPreviousSiblings(selector: string = "*"): Promise<iValue[]> {
    const siblingElements: ElementHandle[] = await this._xQuery(
      "preceding-sibling::",
      selector
    );
    const siblings: BrowserElement[] = [];
    await asyncForEach(
      siblingElements,
      async (sibling: ElementHandle, i: number) => {
        const opts: ValueOptions = {
          name: `Previous Sibling ${i} of ${this.name}`,
          path: `${this.path}[preceding-sibling::${selector}][${i}]`,
        };
        siblings.push(await BrowserElement.create(sibling, this.context, opts));
      }
    );
    return siblings;
  }

  public getNextSibling(selector: string = "*"): ValuePromise {
    return ValuePromise.execute(async () => {
      const siblings: ElementHandle[] = await this._xQuery(
        "following-sibling::",
        selector
      );
      const opts: ValueOptions = {
        name: `Next Sibling of ${this.name}`,
        path: `${this.path}[following-sibling::${selector}][0]`,
      };
      if (siblings.length > 0) {
        return BrowserElement.create(siblings[0], this.context, opts);
      }
      return this.valueFactory.createNull(opts);
    });
  }

  public async getNextSiblings(selector: string = "*"): Promise<iValue[]> {
    const siblingElements: ElementHandle[] = await this._xQuery(
      "following-sibling::",
      selector
    );
    const siblings: BrowserElement[] = [];
    await asyncForEach(
      siblingElements,
      async (sibling: ElementHandle, i: number) => {
        const opts: ValueOptions = {
          name: `Next Sibling ${i} of ${this.name}`,
          path: `${this.path}/following-sibling::${selector}[${i}]`,
        };
        siblings.push(await BrowserElement.create(sibling, this.context, opts));
      }
    );
    return siblings;
  }

  public async getBounds(boxType: string = "border"): Promise<iBounds | null> {
    const allowedTypes: string[] = ["content", "padding", "border", "margin"];
    if (allowedTypes.indexOf(boxType) < 0) {
      throw new Error(
        `${boxType} is not a valid box type. Must be one of the following: ${allowedTypes.join(
          ", "
        )}.`
      );
    }
    const boxModel: BoxModel | null = await this.$.boxModel();
    if (boxModel !== null) {
      return {
        x: boxModel[boxType][0].x,
        y: boxModel[boxType][0].y,
        width: boxModel.width,
        height: boxModel.height,
        left: boxModel[boxType][0].x,
        right: boxModel[boxType][0].x + boxModel.width,
        top: boxModel[boxType][0].y,
        bottom: boxModel[boxType][0].y + boxModel.height,
        middle: {
          x: boxModel[boxType][0].x + boxModel.width / 2,
          y: boxModel[boxType][0].y + boxModel.height / 2,
        },
        points: boxModel[boxType],
      };
    }
    return null;
  }

  public focus(): ValuePromise {
    return ValuePromise.execute(async () => {
      await this.$.focus();
      this._completedAction("FOCUS");
      return this;
    });
  }

  public blur(): ValuePromise {
    return ValuePromise.execute(async () => {
      await this.$.evaluate((node) => node.parentElement?.focus());
      this._completedAction("BLUR");
      return this;
    });
  }

  public hover(): ValuePromise {
    return ValuePromise.execute(async () => {
      await this.$.hover();
      this._completedAction("HOVER");
      return this;
    });
  }

  public tap(): ValuePromise {
    return ValuePromise.execute(async () => {
      await this.$.tap();
      this._completedAction("TAP");
      return this;
    });
  }

  public press(key: string, opts?: any): ValuePromise {
    return ValuePromise.execute(async () => {
      await this.$.press(key, opts || {});
      this._completedAction("PRESS", key);
      return this;
    });
  }

  public type(textToType: string, opts: any = {}): ValuePromise {
    return ValuePromise.execute(async () => {
      await this.$.type(textToType, opts);
      this._completedAction(
        "TYPE",
        (await this._isPasswordField())
          ? textToType.replace(/./g, "*")
          : textToType
      );
      return this;
    });
  }

  public clear(): ValuePromise {
    return ValuePromise.execute(async () => {
      await this.$.click({ clickCount: 3 });
      await this._page.keyboard.press("Backspace");
      this._completedAction("CLEAR");
      return this;
    });
  }

  public fillForm(attributeName: string, formData: KeyValue): ValuePromise;
  public fillForm(formData: KeyValue): ValuePromise;
  public fillForm(a: string | KeyValue, b?: KeyValue): ValuePromise {
    return ValuePromise.execute(async () => {
      const isForm: boolean = await this._isFormTag();
      if (!isForm) {
        throw new Error("This is not a form element.");
      }
      const attributeName: string = typeof a === "string" ? a : "name";
      const formData: KeyValue = (typeof a === "string" ? b : a) || {};
      for (const name in formData) {
        const value: any = formData[name];
        const selector: string = `${this.path} [${attributeName}="${name}"]`;
        const inputs: ElementHandle[] = await this._page.$$(selector);
        if (inputs.length == 0) {
          this.context.logOptionalFailure(
            `Could not set form field ${name} to ${value}, because the field did not exist.`,
            selector
          );
        } else {
          const input: ElementHandle = inputs[0];
          const tagName: string = String(
            await (await input.getProperty("tagName")).jsonValue()
          ).toLowerCase();
          const inputType: string = String(
            await (await input.getProperty("type")).jsonValue()
          ).toLowerCase();
          // Some sites need you to focus on the element first
          await this._page.focus(selector);
          // Dropdowns
          if (tagName == "select") {
            await this._page.select(selector, value);
          }
          // Input boxes
          else if (tagName == "input") {
            // Radio or checkbox we need to click on the items
            if (inputType == "radio" || inputType == "checkbox") {
              // Turn it into an array, to support multiple checked boxes
              const multiValues: any[] =
                toType(value) == "array" ? value : [value];
              // Loop through each checkbox/radio element with this name
              for (let i = 0; i < inputs.length; i++) {
                const checkbox: ElementHandle = inputs[i];
                const isChecked: boolean = !!(await (
                  await checkbox.getProperty("checked")
                ).jsonValue());
                const checkboxValue: string = String(
                  await (await checkbox.getProperty("value")).jsonValue()
                );
                // Toggle it by clicking
                if (
                  // This is one of our values, and it's not checked yet
                  (multiValues.indexOf(checkboxValue) >= 0 && !isChecked) ||
                  // This is not one of our values, but it is checked
                  (multiValues.indexOf(checkboxValue) < 0 && isChecked)
                ) {
                  await checkbox.click();
                }
              }
            } else if (
              inputType == "button" ||
              inputType == "submit" ||
              inputType == "reset"
            ) {
              // Do nothing for now (maybe should click??)
            } else {
              await this.context.clearThenType(selector, value);
            }
          }
          // Button elements
          else if (tagName == "button") {
            // Do nothing for now (maybe should click??)
          }
        }
        this._completedAction("FILL");
      }
      return this;
    });
  }

  public submit(): ValuePromise {
    return ValuePromise.execute(async () => {
      if (!this._isFormTag()) {
        throw new Error("You can only use .submit() with a form element.");
      }
      const scenario = this.context.scenario as BrowserScenario;
      if (scenario.page === null) {
        throw new Error("Page was null");
      }
      await scenario.page.evaluate((form) => form.submit(), this.$);
      this._completedAction("SUBMIT");
      return this;
    });
  }

  public click(): ValuePromise {
    return ValuePromise.execute(async () => {
      this._completedAction("CLICK");
      await this.$.click();
      return this;
    });
  }

  public screenshot(): Promise<Buffer>;
  public screenshot(localFilePath: string): Promise<Buffer>;
  public screenshot(
    localFilePath: string,
    opts: ScreenshotOpts
  ): Promise<Buffer>;
  public screenshot(opts: ScreenshotOpts): Promise<Buffer>;
  public screenshot(
    a?: string | ScreenshotOpts,
    b?: ScreenshotOpts
  ): Promise<Buffer> {
    const localFilePath = typeof a == "string" ? a : undefined;
    const opts: ScreenshotOpts = (typeof a !== "string" ? a : b) || {};
    return this.$.screenshot({
      path: localFilePath || opts.path,
      encoding: "binary",
      omitBackground: opts.omitBackground || false,
    });
  }

  public selectOption(valuesToSelect: string | string[]): ValuePromise {
    return ValuePromise.execute(async () => {
      valuesToSelect = toArray<string>(valuesToSelect);
      this._completedAction("SELECT", valuesToSelect.join(", "));
      const valuesSelected = await this.$.select.apply(this.$, valuesToSelect);
      this.context
        .assert(
          `Select values on ${this.name}`,
          valuesToSelect.length == valuesSelected.length
        )
        .equals(true);
      return this;
    });
  }

  public pressEnter(): ValuePromise {
    return ValuePromise.execute(async () => {
      await this.$.press("Enter");
      this._completedAction("ENTER");
      return this;
    });
  }

  public scrollTo(): ValuePromise {
    return ValuePromise.execute(async () => {
      await this.$.evaluate((e) => e.scrollIntoView());
      return this;
    });
  }

  public async isHidden(): Promise<boolean> {
    return !(await this.isVisible());
  }

  public async isVisible(): Promise<boolean> {
    const isVisibleHandle = await this._page.evaluateHandle((e) => {
      const style = window.getComputedStyle(e);
      return (
        style &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        style.opacity !== "0"
      );
    }, this.$);
    const visible = await isVisibleHandle.jsonValue();
    const box = await this.$.boxModel();
    return !!visible && !!box;
  }

  protected async _getInnerText() {
    return String(await this._eval((e) => e.innerText, this.$));
  }

  protected async _getInnerHtml() {
    return String(await this._eval((e) => e.innerHTML, this.$));
  }

  protected async _getOuterHtml() {
    return String(await this._eval((e) => e.outerHTML, this.$));
  }

  protected async _getValue() {
    return (await this.$.getProperty("value")).jsonValue();
  }

  protected async _getText() {
    const textNode = await this.$.getProperty("textContent");
    return String(await textNode.jsonValue());
  }

  protected async _getClassName(): Promise<string> {
    const classNode = await this.$.getProperty("className");
    return String(await classNode.jsonValue());
  }

  protected async _getTagName(): Promise<string> {
    const handle: JSHandle = await this.$.getProperty("tagName");
    const value: string = String(await handle.jsonValue());
    this.opts.tagName = value.toLowerCase();
    return value;
  }

  protected async _getAttribute(key: string): Promise<string | null> {
    const value = await this._page.evaluate(
      (el, key) => el.getAttribute(key),
      this.$,
      key
    );
    //const handle: JSHandle = await this.$.getProperty(key);
    //const value = await attr.jsonValue();
    return value === null ? null : String(value);
  }

  protected async _isPasswordField(): Promise<boolean> {
    return (await this.getAttribute("type")).$ == "password";
  }

  protected _elementHandlesToFirstValue(
    elements: ElementHandle[],
    name: string,
    path: string
  ): ValuePromise {
    return ValuePromise.execute(async () => {
      const opts: ValueOptions = { name, path };
      return elements.length > 0
        ? await BrowserElement.create(elements[0], this.context, opts)
        : this.valueFactory.createNull(opts);
    });
  }

  protected async _elementHandlesToValueArray(
    elements: ElementHandle<Element>[],
    name: string,
    path: string
  ) {
    const out: iValue[] = [];
    await asyncMap(
      elements,
      async (child: ElementHandle, i: number) =>
        await BrowserElement.create(child, this.context, {
          name: `${name} [${i}]`,
          selector: `${path} [${i}]`,
        })
    );
    return out;
  }

  protected _xQuery(
    prefix: string,
    selector: string = "*",
    suffix: string = ""
  ) {
    const path = `${prefix}${csstoxpath(selector)}${suffix}`;
    return this.$.$x(path);
  }

  protected get _page(): Page {
    const scenario = this.context.scenario as BrowserScenario;
    if (scenario.page === null) {
      throw "Puppeteer page object was not found.";
    }
    return scenario.page;
  }

  public toString(): string {
    return String(this.sourceCode);
  }

  public clearThenType(
    textToType: string,
    opts: any = {}
  ): ValuePromise<InputType> {
    return ValuePromise.execute(async () => {
      await this.clear();
      await this.type(textToType, opts);
      return this;
    });
  }

  public async eval(js: string): Promise<any> {
    return this._eval(js);
  }

  public waitForFunction(
    js: EvaluateFn<any>,
    timeout: number,
    ...args: SerializableOrJSHandle[]
  ): ValuePromise<InputType>;
  public waitForFunction(
    js: EvaluateFn<any>,
    opts?: PageFnOptions,
    ...args: SerializableOrJSHandle[]
  ): ValuePromise<InputType>;
  public waitForFunction(
    js: EvaluateFn<any>,
    a?: PageFnOptions | number,
    ...args: SerializableOrJSHandle[]
  ): ValuePromise<InputType> {
    return ValuePromise.execute(async () => {
      const opts: PageFnOptions =
        typeof a == "number" ? { timeout: a } : a || {};
      try {
        await this._page.waitForFunction.apply(this._page, [
          js,
          opts,
          ...[this.$, ...args],
        ]);
        this._completedAction("WAIT", this.name);
      } catch {
        this._failedAction("WAIT", this.name);
      }
      return this;
    });
  }

  protected async _getSourceCode(): Promise<string> {
    this.opts.sourceCode = await this._getOuterHtml();
    return this.sourceCode;
  }

  protected _eval(js: EvaluateFn<any>, arg?: any): Promise<any> {
    return this._page.evaluate(js, arg);
  }

  protected async _getProperty(key: string) {
    const property = await this.$.getProperty(key);
    return property.jsonValue();
  }

  protected _waitForIt(
    fn: EvaluateFn,
    verb: string,
    timeout?: number
  ): ValuePromise<InputType> {
    return ValuePromise.execute(async () => {
      try {
        await this._waitForFunction(fn, timeout);
        this._completedAction(verb.toUpperCase(), this.name);
      } catch (e) {
        this._failedAction(verb.toUpperCase(), this.name);
      }
      return this;
    });
  }

  protected async _waitForFunction(
    fn: EvaluateFn,
    timeout?: number
  ): Promise<this> {
    const opts = {
      timeout: timeout,
    };
    await this._page.waitForFunction(fn, opts, this.$);
    return this;
  }
}
