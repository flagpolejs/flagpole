import { PuppeteerElement } from "./puppeteerelement";
import {
  iValue,
  iAssertionContext,
  iBounds,
  ScreenshotOpts,
  KeyValue,
  iScenario,
} from "../interfaces";
import { ElementHandle, BoxModel, JSHandle, Page } from "puppeteer-core";
import {
  asyncForEach,
  toType,
  getMessageAndCallbackFromOverloading,
  arrayify,
} from "../util";

export class BrowserElement extends PuppeteerElement implements iValue {
  protected _input: ElementHandle;

  public get $(): ElementHandle {
    return this._input;
  }

  public static create(
    input: ElementHandle,
    context: iAssertionContext,
    name: string,
    path?: string
  ): Promise<BrowserElement> {
    return new Promise((resolve) => {
      const element = new BrowserElement(input, context, name, path);
      if (name === null) {
        element._name = String(path);
      }
      Promise.all([element._getTagName(), element._getSourceCode()]).then(
        () => {
          resolve(element);
        }
      );
    });
  }

  protected constructor(
    input: ElementHandle,
    context: iAssertionContext,
    name: string,
    path?: string
  ) {
    super(input, context, name, path);
    this._input = input;
    this._path = path || "";
  }

  public async find(selector: string): Promise<iValue> {
    const element: ElementHandle | null = await this.$.$(selector);
    const name: string = `${selector} under ${this.name}`;
    const path: string = `${this.path} ${selector}`;
    if (element !== null) {
      return BrowserElement.create(element, this._context, name, path);
    }
    return this._wrapAsValue(null, name);
  }

  public async findAll(selector: string): Promise<BrowserElement[]> {
    const elements: ElementHandle[] = await this.$.$$(selector);
    const out: BrowserElement[] = [];
    await asyncForEach(elements, async (element: ElementHandle, i: number) => {
      out.push(
        await BrowserElement.create(
          element,
          this._context,
          `${selector}[${i}] under ${this.name}`,
          `${this.path} ${selector}[${i}]`
        )
      );
    });
    return out;
  }

  public async getClosest(selector: string = "*"): Promise<iValue> {
    const closest: ElementHandle[] = await this.$.$x(
      `ancestor-or-self::${selector}`
    );
    const name: string = `Closest ${selector} of ${this.name}`;
    const path: string = `${this.path}[ancestor-or-self::${selector}]`;
    if (closest.length > 0) {
      return BrowserElement.create(closest[0], this._context, name, path);
    }
    return this._wrapAsValue(null, name, this);
  }

  public async getChildren(selector: string = "*"): Promise<iValue[]> {
    const children: ElementHandle[] = await this.$.$x(`child::${selector}`);
    const out: BrowserElement[] = [];
    await asyncForEach(children, async (child: ElementHandle, i: number) => {
      const name: string = `Child ${selector} ${i} of ${this.name}`;
      const path: string = `${this.path}[child::${selector}][${i}]`;
      out.push(await BrowserElement.create(child, this._context, name, path));
    });
    return out;
  }

  public async getParent(): Promise<iValue> {
    const parents: ElementHandle[] = await this.$.$x("..");
    const name: string = `Parent of ${this.name}`;
    const path: string = `${this.path}[..]`;
    if (parents.length > 0) {
      return BrowserElement.create(parents[0], this._context, name, path);
    }
    return this._wrapAsValue(null, name, this);
  }

  public async getSiblings(selector: string = "*"): Promise<iValue[]> {
    const prevSiblings: ElementHandle[] = await this.$.$x(
      `preceding-sibling::${selector}`
    );
    const nextSiblings: ElementHandle[] = await this.$.$x(
      `following-sibling::${selector}`
    );
    const siblings: BrowserElement[] = [];
    await asyncForEach(
      prevSiblings.concat(nextSiblings),
      async (sibling: ElementHandle, i: number) => {
        const name: string = `Sibling ${i} of ${this.name}`;
        const path: string = `${this.path}[sibling::${selector}][${i}]`;
        siblings.push(
          await BrowserElement.create(sibling, this._context, name, path)
        );
      }
    );
    return siblings;
  }

  public async getPreviousSibling(selector: string = "*"): Promise<iValue> {
    const siblings: ElementHandle[] = await this.$.$x(
      `preceding-sibling::${selector}`
    );
    const name: string = `Previous Sibling of ${this.name}`;
    const path: string = `${this.path}[preceding-sibling::${selector}][0]`;
    if (siblings.length > 0) {
      return BrowserElement.create(siblings[0], this._context, name, path);
    }
    return this._wrapAsValue(null, name, this);
  }

  public async getPreviousSiblings(selector: string = "*"): Promise<iValue[]> {
    const siblingElements: ElementHandle[] = await this.$.$x(
      `preceding-sibling::${selector}`
    );
    const siblings: BrowserElement[] = [];
    await asyncForEach(
      siblingElements,
      async (sibling: ElementHandle, i: number) => {
        const name: string = `Previous Sibling ${i} of ${this.name}`;
        const path: string = `${this.path}[preceding-sibling::${selector}][${i}]`;
        siblings.push(
          await BrowserElement.create(sibling, this._context, name, path)
        );
      }
    );
    return siblings;
  }

  public async getNextSibling(
    selector: string = "*"
  ): Promise<BrowserElement | iValue> {
    const siblings: ElementHandle[] = await this.$.$x(
      `following-sibling::${selector}`
    );
    const name: string = `Next Sibling of ${this.name}`;
    const path: string = `${this.path}[following-sibling::${selector}][0]`;
    if (siblings.length > 0) {
      return BrowserElement.create(siblings[0], this._context, name, path);
    }
    return this._wrapAsValue(null, name, this);
  }

  public async getNextSiblings(selector: string = "*"): Promise<iValue[]> {
    const siblingElements: ElementHandle[] = await this.$.$x(
      `following-sibling::${selector}`
    );
    const siblings: BrowserElement[] = [];
    await asyncForEach(
      siblingElements,
      async (sibling: ElementHandle, i: number) => {
        const name: string = `Next Sibling ${i} of ${this.name}`;
        const path: string = `${this.path}[following-sibling::${selector}][${i}]`;
        siblings.push(
          await BrowserElement.create(sibling, this._context, name, path)
        );
      }
    );
    return siblings;
  }

  public async getBounds(boxType: string = "border"): Promise<iBounds | null> {
    if (this._context.page == null) {
      throw new Error("Page is null.");
    }
    const allowedTypes: string[] = ["content", "padding", "border", "margin"];
    if (allowedTypes.indexOf(boxType) < 0) {
      throw new Error(
        `${boxType} is not a valid box type. Must be one of the following: ${allowedTypes.join(
          ", "
        )}.`
      );
    }
    const boxModel: BoxModel | null = await this._input.boxModel();
    if (boxModel !== null) {
      return {
        x: boxModel[boxType][0].x,
        y: boxModel[boxType][0].y,
        width: boxModel.width,
        height: boxModel.height,
        points: boxModel[boxType],
      };
    }
    return null;
  }

  public async focus(): Promise<any> {
    if (this._context.page == null) {
      throw new Error("Page is null.");
    }
    await this._input.focus();
    this._completedAction("FOCUS");
  }

  public async blur(): Promise<any> {
    if (this._context.page == null) {
      throw new Error("Page is null.");
    }
    await this._input.evaluate((node) => node.parentElement?.focus());
    this._completedAction("BLUR");
  }

  public async hover(): Promise<void> {
    await this._input.hover();
    this._completedAction("HOVER");
  }

  public async tap(): Promise<void> {
    if (this._context.page == null) {
      throw new Error("Page is null.");
    }
    await this._input.tap();
    this._completedAction("TAP");
  }

  public async press(key: string, opts?: any): Promise<void> {
    if (this._context.page == null) {
      throw new Error("Page is null.");
    }
    await this._input.press(key, opts || {});
    this._completedAction("PRESS", key);
  }

  public async type(textToType: string, opts: any = {}): Promise<void> {
    if (this._context.page == null) {
      throw new Error("Page is null.");
    }
    await this._input.type(textToType, opts);
    this._completedAction(
      "TYPE",
      (await this.isPasswordField())
        ? textToType.replace(/./g, "*")
        : textToType
    );
  }

  public async clear(): Promise<void> {
    if (this._context.page == null) {
      throw new Error("Page is null.");
    }
    await this._input.click({ clickCount: 3 });
    await this._context.page.keyboard.press("Backspace");
    this._completedAction("CLEAR");
  }

  public async fillForm(
    attributeName: string,
    formData: KeyValue
  ): Promise<iValue>;
  public async fillForm(formData: KeyValue): Promise<iValue>;
  public async fillForm(a: string | KeyValue, b?: KeyValue): Promise<iValue> {
    const isForm: boolean = await this._isFormTag();
    if (this._context.page == null) {
      throw new Error("Page is null.");
    }
    if (!isForm) {
      throw new Error("This is not a form element.");
    }
    const page: Page | null = this._context.page;
    if (page === null) {
      throw new Error("Page is null");
    }
    const attributeName: string = typeof a === "string" ? a : "name";
    const formData: KeyValue = (typeof a === "string" ? b : a) || {};
    for (let name in formData) {
      const value: any = formData[name];
      const selector: string = `${this._path} [${attributeName}="${name}"]`;
      const inputs: ElementHandle[] = await page.$$(selector);
      if (inputs.length > 0) {
        const input: ElementHandle = inputs[0];
        const tagName: string = String(
          await (await input.getProperty("tagName")).jsonValue()
        ).toLowerCase();
        const inputType: string = String(
          await (await input.getProperty("type")).jsonValue()
        ).toLowerCase();
        // Some sites need you to focus on the element first
        await page.focus(selector);
        // Dropdowns
        if (tagName == "select") {
          await page.select(selector, value);
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
              let checkbox: ElementHandle = inputs[i];
              let isChecked: boolean = !!(await (
                await checkbox.getProperty("checked")
              ).jsonValue());
              let checkboxValue: string = String(
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
            await this._context.clearThenType(selector, value);
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
  }

  public async submit(): Promise<void> {
    if (!this._isFormTag()) {
      throw new Error("You can only use .submit() with a form element.");
    }
    if (this._context.page === null) {
      throw new Error("Page was null");
    }
    await this._context.page.evaluate((form) => form.submit(), this.$);
    this._completedAction("SUBMIT");
  }

  public async click(): Promise<void> {
    this._completedAction("CLICK");
    return this.$.click();
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
    return this._input.screenshot({
      path: localFilePath || opts.path,
      encoding: "binary",
      omitBackground: opts.omitBackground || false,
    });
  }

  public async selectOption(valuesToSelect: string | string[]): Promise<void> {
    valuesToSelect = arrayify<string>(valuesToSelect);
    this._completedAction("SELECT", valuesToSelect.join(", "));
    const valuesSelected = await this.$.select.apply(this.$, valuesToSelect);
    this._context
      .assert(
        `Select values on ${this.name}`,
        valuesToSelect.length == valuesSelected.length
      )
      .equals(true);
  }

  public async pressEnter(): Promise<void> {
    await this.$.press("Enter");
    this._completedAction("ENTER");
  }

  public async scrollTo(): Promise<void> {
    await this.$.evaluate((e) => e.scrollIntoView());
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

  protected async _getData(key: string) {
    return (await this._input.getProperty(key)).jsonValue();
  }

  protected async _getValue() {
    return (await this._input.getProperty("value")).jsonValue();
  }

  protected async _getText() {
    const textNode = await this._input.getProperty("textContent");
    return String(await textNode.jsonValue());
  }

  protected async _getClassName(): Promise<string> {
    const classNode = await this._input.getProperty("className");
    return String(await classNode.jsonValue());
  }

  protected async _getTagName(): Promise<string> {
    const handle: JSHandle = await this._input.getProperty("tagName");
    const value: string = String(await handle.jsonValue());
    this._tagName = value.toLowerCase();
    return value;
  }

  protected async _getAttribute(key: string): Promise<string> {
    const handle: JSHandle = await this._input.getProperty(key);
    return String(await handle.jsonValue());
  }

  protected async isPasswordField(): Promise<boolean> {
    return (await this.getAttribute("type")).$ == "password";
  }
}
