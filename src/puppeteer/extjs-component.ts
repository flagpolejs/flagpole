import { iAssertionContext, iValue } from "../interfaces";
import { PuppeteerElement } from "./puppeteer-element";
import {
  JSHandle,
  EvaluateFn,
  SerializableOrJSHandle,
  ElementHandle,
} from "puppeteer-core";
import { toArray, asyncMap } from "../util";
import { ExtJSResponse } from "./extjs-response";
import * as ext from "./extjs-helper";
import { wrapAsValue } from "../helpers";
import { BrowserElement } from "./browser-element";
import { ValuePromise } from "../value-promise";

const visible: EvaluateFn = (c) => c.isVisible(true);
const hidden: EvaluateFn = (c) => c.isHidden(true);

export const ExtJsComponentTypes = {
  actionsheet: "Ext.ActionSheet",
  audio: "Ext.Audio",
  button: "Ext.Button",
  image: "Ext.Img",
  label: "Ext.Label",
  loadmask: "Ext.LoadMask",
  panel: "Ext.Panel",
  segmentedbutton: "Ext.SegmentedButton",
  sheet: "Ext.Sheet",
  spacer: "Ext.Spacer",
  titlebar: "Ext.TitleBar",
  toolbar: "Ext.Toolbar",
  video: "Ext.Video",
  carousel: "Ext.carousel.Carousel",
  navigationview: "Ext.navigation.View",
  datepicker: "Ext.picker.Date",
  picker: "Ext.picker.Picker",
  slider: "Ext.slider.Slider",
  thumb: "Ext.slider.Thumb",
  tabpanel: "Ext.tab.Panel",
  viewport: "Ext.viewport.Default",
  dataview: "Ext.dataview.DataView",
  list: "Ext.dataview.List",
  nestedlist: "Ext.dataview.NestedList",
  checkboxfield: "Ext.field.Checkbox",
  datepickerfield: "Ext.field.DatePicker",
  emailfield: "Ext.field.Email",
  hiddenfield: "Ext.field.Hidden",
  numberfield: "Ext.field.Number",
  passwordfield: "Ext.field.Password",
  radiofield: "Ext.field.Radio",
  searchfield: "Ext.field.Search",
  selectfield: "Ext.field.Select",
  sliderfield: "Ext.field.Slider",
  spinnerfield: "Ext.field.Spinner",
  textfield: "Ext.field.Text",
  textareafield: "Ext.field.TextArea",
  togglefield: "Ext.field.Toggle",
  treelist: "Ext.list.Tree",
  urlfield: "Ext.field.Url",
  fieldset: "Ext.form.FieldSet",
  formpanel: "Ext.form.Panel",
};

export class ExtJsComponent extends PuppeteerElement implements iValue {
  protected _input: JSHandle;
  protected _path: string;

  public get $(): JSHandle {
    return this._input;
  }

  public get path(): string {
    return this._path;
  }

  public get name(): string {
    return this._name || this._path || "ExtJs Component";
  }

  private get _response(): ExtJSResponse {
    // @ts-ignore
    return this._context.response as ExtJSResponse;
  }

  private get _isExtComponent(): boolean {
    return this.toType() == "ext";
  }

  public static async create(
    handle: JSHandle,
    context: iAssertionContext,
    name: string,
    path: string
  ) {
    const element = new ExtJsComponent(handle, context, name, path);
    const componentType = await element._getTagName();
    if (!element._name && componentType !== null) {
      element._name = `<${componentType}> Component @ ${element.path}`;
    }
    return element;
  }

  private constructor(
    handle: JSHandle,
    context: iAssertionContext,
    name: string,
    path?: string
  ) {
    super(handle, context, name, path || name);
    this._path = path || name;
    this._input = handle;
  }

  public focus(): ValuePromise {
    return this._action("focus");
  }

  public hover(): ValuePromise {
    return this._action("hover");
  }

  public blur(): ValuePromise {
    return this._action("blur");
  }

  public click(): ValuePromise {
    return ValuePromise.execute(async () => {
      const out = this._action("click");
      return new Promise((resolve) => {
        setTimeout(() => resolve(out), 100);
      });
    });
  }

  public getAncestor(selector: string): ValuePromise {
    return ValuePromise.execute(async () => {
      const result = await ext.up(this.$, selector);
      return ext.jsHandleToComponent(
        result,
        this.context,
        `${selector} above ${this.name}`,
        `${this.path}.up(${selector})`
      );
    });
  }

  public getFirstChild(selector: string): ValuePromise {
    return ValuePromise.execute(async () => {
      const result = await ext.child(this.$, selector);
      return ext.jsHandleToComponent(
        result,
        this.context,
        `Child ${selector} ${this.name}`,
        `${this.path}.child(${selector})`
      );
    });
  }

  public getLastChild(selector: string): ValuePromise {
    return ValuePromise.execute(async () => {
      const result = await this.getChildren(selector);
      return result[result.length - 1];
    });
  }

  public async getAncestors(selector: string): Promise<iValue[]> {
    const result = await ext.ancestors(this.$, selector);
    return ext.jsHandleArrayToComponents(
      result,
      this.context,
      `${selector} above ${this.name}`,
      `${this.path}.ancestors(${selector})`
    );
  }

  public find(selector: string): ValuePromise {
    return ValuePromise.execute(async () => {
      const name = `${selector} under ${this.name}`;
      const path = `${this.path} ${selector}`;
      const result = await ext.down(this.$, selector);
      if (result !== null) {
        return ext.jsHandleToComponent(result, this.context, name, path);
      }
      const el = await ext.queryDomElementWithinComponent(this.$, selector);
      if (el !== null) {
        return BrowserElement.create(
          el as ElementHandle,
          this.context,
          name,
          path
        );
      }
      return wrapAsValue(this.context, null, name, path);
    });
  }

  public async findAll(selector: string): Promise<iValue[]> {
    const result = await ext.queryWithinComponent(this.$, selector);
    //console.log(await result.evaluate((r) => r.length));
    return ext.jsHandleArrayToComponents(
      result,
      this.context,
      selector,
      selector
    );
  }

  public clear(): ValuePromise {
    return ValuePromise.execute(async () => {
      await this.focus();
      await this.setValue("");
      await this.blur();
      this._completedAction("CLEAR");
      return this;
    });
  }

  public type(textToType: string, opts: any): ValuePromise {
    return ValuePromise.execute(async () => {
      await this.focus();
      await this.setValue(textToType);
      this._completedAction(
        "TYPE",
        (await this._isPasswordField())
          ? textToType.replace(/./g, "*")
          : textToType
      );
      return this.blur();
    });
  }

  public pressEnter(): ValuePromise {
    return this._action("action");
  }

  public waitForVisible(timeout?: number): ValuePromise {
    return this._waitForIt(visible, "visible", timeout);
  }

  public waitForHidden(timeout?: number): ValuePromise {
    return this._waitForIt(hidden, "hidden", timeout);
  }

  public async isVisible(): Promise<boolean> {
    return await this.$.evaluate(visible);
  }

  public async isHidden(): Promise<boolean> {
    return await this.$.evaluate(hidden);
  }

  public setValue(text: string): ValuePromise {
    return ValuePromise.execute(async () => {
      await this.eval((c, text) => {
        if (c.setValue) {
          c.setValue(text);
        }
        if (c.setCriteriaValue) {
          c.setCriteriaValue(text);
        }
      }, text);
      return this;
    });
  }

  public getParent(): ValuePromise {
    return ValuePromise.execute(async () => {
      const result = await ext.parent(this.$);
      return ext.jsHandleToComponent(
        result,
        this.context,
        `Parent of ${this.name}`,
        `${this.path}.getParent()`
      );
    });
  }

  public async getSiblings(selector: string = "*"): Promise<iValue[]> {
    const id = await ext.id(this.$);
    const parent = await ext.parent(this.$);
    if (parent === null) {
      return [];
    }
    const parentId = await ext.id(parent);
    const children = await ext.query(this._page, `#${parentId} > ${selector}`);
    const filtered = await ext.filter(children, (c, id) => c.getId() != id, id);
    return asyncMap(
      filtered,
      async (sibling, i) =>
        await ext.jsHandleToComponent(
          sibling,
          this.context,
          `Sibling of ${this.name}`,
          `${this.path} ~ ${selector} [${i}]`
        )
    );
  }

  public getFirstSibling(selector: string = "*"): ValuePromise {
    return ValuePromise.execute(async () => {
      return (await this.getSiblings(selector))[0];
    });
  }

  public getLastSibling(selector: string = "*"): ValuePromise {
    return ValuePromise.execute(async () => {
      const siblings = await this.getSiblings(selector);
      return siblings[siblings.length - 1];
    });
  }

  public async getChildren(selector: string = "*"): Promise<iValue[]> {
    const id = await ext.id(this.$);
    return ext.jsHandleArrayToComponents(
      await ext.query(this._page, `#${id} > ${selector}`),
      this.context,
      `Children ${selector} of ${this.name}`,
      this.path
    );
  }

  public getNextSibling(selector: string): ValuePromise {
    return ValuePromise.execute(async () => {
      const id = String(await this.eval((c) => c.nextSibling(selector)));
      const component = await this._response.getComponentById(id);
      return (
        component || this._wrapAsValue(null, `Next Sibling of ${this.name}`)
      );
    });
  }

  public getPreviousSibling(selector: string): ValuePromise {
    return ValuePromise.execute(async () => {
      const id = String(await this.eval((c) => c.previousSibling(selector)));
      const component = await this._response.getComponentById(id);
      return (
        component || this._wrapAsValue(null, `Previous Sibling of ${this.name}`)
      );
    });
  }

  public async eval(
    js: EvaluateFn<any>,
    ...args: SerializableOrJSHandle[]
  ): Promise<any> {
    return this.$.evaluate.apply(this.$, [js, ...args]);
  }

  public selectOption(valuesToSelect: string | string[]): ValuePromise {
    return ValuePromise.execute(async () => {
      // TODO: Support multi-select. Right now this will only support a singlular selection
      valuesToSelect = toArray<string>(valuesToSelect);
      this._completedAction("SELECT", valuesToSelect.join(", "));
      const ableToSetValue = await this.eval((c, valuesToSelect) => {
        let value = "";
        const displayField = c.getDisplayField();
        const valueField = c.getValueField();
        const searchValue = valuesToSelect[0];
        const store = c.getStore();
        // Search & set by value
        const valueResult = store.queryBy(valueField, searchValue);
        if (valueResult && valueResult.indices) {
          value = Object.keys(valueResult.indices)[0];
        }
        // If we didn't find it by value, search & set by display text
        if (!value.length) {
          const displayResult = store.queryBy(displayField, searchValue);
          if (displayResult && displayResult.indices) {
            value = Object.keys(displayResult.indices)[0];
          }
        }
        // Set value
        if (value.length) {
          c.setValue(value);
          return true;
        }
        return false;
      }, valuesToSelect);
      this._context
        .assert(`Select values on ${this.name}`, ableToSetValue)
        .equals(true);
      return this;
    });
  }

  public scrollTo(): ValuePromise {
    return ValuePromise.execute(async () => {
      await this.eval((c) => c.element.dom.scrollIntoView());
      return this;
    });
  }

  protected _action(eventName: string): ValuePromise {
    return ValuePromise.execute(async () => {
      eventName = eventName.toLowerCase();
      await this.eval((c, eventName) => {
        c[eventName] && c[eventName]();
        c.element && c.element[eventName] && c.element[eventName]();
        c.element.dom && c.element.dom[eventName] && c.element.dom[eventName]();
        c.fireEvent(eventName);
      }, eventName);
      this._completedAction(eventName.toUpperCase());
      return this;
    });
  }

  protected async _getClassName(): Promise<string> {
    return String(await this.eval((c) => c.element.dom.className));
  }

  protected _getAttribute(key: string): Promise<string> {
    return this.eval((c) => c.element.getAttribute(key));
  }

  protected async _getTagName(): Promise<string> {
    this._tagName = String(await this.eval((c) => c.xtype));
    return this._tagName;
  }

  protected async _getInnerText() {
    return String(await this.eval((c) => c.element.dom.innerText));
  }

  protected async _getInnerHtml() {
    return String(await this.eval((c) => c.element.dom.innerHTML));
  }

  protected async _getOuterHtml() {
    return String(await this.eval((c) => c.element.dom.outerHTML));
  }

  protected async _getText() {
    const result = await this.eval((c) => {
      if (c.getText) {
        return c.getText();
      }
      if (c.getLabel) {
        return c.getLabel();
      }
      if (c.getTitle) {
        return c.getTitle();
      }
      if (c.getDisplayValue) {
        return c.getDisplayValue();
      }
      if (c.element?.dom?.innerText) {
        return c.element.dom.innerText;
      }
      return "";
    });
    return String(result);
  }

  protected async _getValue() {
    return this.eval((c) => {
      if (c.getValue) {
        return c.getValue();
      }
      if (c.getCriteriaValue) {
        return c.getCriteriaValue();
      }
      return null;
    });
  }

  protected async _isPasswordField(): Promise<boolean> {
    return this.eval(
      (c) => c.inputElement.dom.getAttribute("type") == "password"
    );
  }
}
