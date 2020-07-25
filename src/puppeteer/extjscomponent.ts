import { iAssertionContext, iValue } from "../interfaces";
import { PuppeteerElement } from "./puppeteerelement";
import { JSHandle, EvaluateFn, SerializableOrJSHandle } from "puppeteer-core";
import { arrayify } from "../util";
import { ExtJSResponse } from "./extjsresponse";

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

  public async focus(): Promise<any> {
    return this._action("focus");
  }

  public async hover(): Promise<void> {
    return this._action("hover");
  }

  public async blur(): Promise<any> {
    return this._action("blur");
  }

  public async click(): Promise<any> {
    return this._action("click");
  }

  public async find(selector: string): Promise<iValue> {
    throw "component.find is not yet implemented in Ext";
  }

  public async findAll(selector: string): Promise<iValue[]> {
    throw "component.findAll is not yet implemented in Ext";
  }

  public async clear(): Promise<void> {
    await this.setValue("");
    this._completedAction("CLEAR");
  }

  public async type(textToType: string, opts: any) {
    await this.focus();
    await this.setValue(textToType);
    this._completedAction(
      "TYPE",
      (await this.isPasswordField())
        ? textToType.replace(/./g, "*")
        : textToType
    );
    return this.blur();
  }

  public async pressEnter(): Promise<void> {
    return this._action("action");
  }

  public async isVisible(): Promise<boolean> {
    return !!(await this.eval((c) => c.isVisible(true)));
  }

  public async isHidden(): Promise<boolean> {
    return !!(await this.eval((c) => c.isHidden(true)));
  }

  public setValue(text: string) {
    return this.eval((c, text) => c.setValue(text), text);
  }

  public async getParent(): Promise<ExtJsComponent | iValue> {
    const id = String(await this.eval((c) => c.parent.id));
    const component = await this._response.getComponentById(id);
    return component || this._wrapAsValue(null, `Parent of ${this.name}`);
  }

  public async getNextSibling(
    selector: string
  ): Promise<ExtJsComponent | iValue> {
    const id = String(await this.eval((c) => c.nextSibling(selector)));
    const component = await this._response.getComponentById(id);
    return component || this._wrapAsValue(null, `Next Sibling of ${this.name}`);
  }

  public async getPreviousSibling(
    selector: string
  ): Promise<ExtJsComponent | iValue> {
    const id = String(await this.eval((c) => c.previousSibling(selector)));
    const component = await this._response.getComponentById(id);
    return (
      component || this._wrapAsValue(null, `Previous Sibling of ${this.name}`)
    );
  }

  public async eval(
    js: EvaluateFn<any>,
    ...args: SerializableOrJSHandle[]
  ): Promise<any> {
    return this.$.evaluate.apply(this.$, [js, ...args]);
  }

  public async getClosest(
    selector: string = "[data-componentid]"
  ): Promise<iValue> {
    if (this._isExtComponent && selector == "[data-componentid]") {
      return this;
    }
    return super.getClosest(selector);
  }

  public async selectOption(valuesToSelect: string | string[]): Promise<void> {
    // TODO: Support multi-select. Right now this will only support a singlular selection
    valuesToSelect = arrayify<string>(valuesToSelect);
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
  }

  public async scrollTo(): Promise<void> {
    this.eval((c) => c.element.dom.scrollIntoView());
  }

  protected async _action(eventName: string): Promise<void> {
    eventName = eventName.toLowerCase();
    await this.eval((c, eventName) => {
      c[eventName] && c[eventName]();
      c.element && c.element[eventName] && c.element[eventName]();
      c.element.dom && c.element.dom[eventName] && c.element.dom[eventName]();
      c.fireEvent(eventName);
    }, eventName);
    this._completedAction(eventName.toUpperCase());
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
      if (c.element?.dom?.innerText) {
        return c.element.dom.innerText;
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
      return "";
    });
    return String(result);
  }

  protected async _getValue() {
    return this.eval((c) => c.getValue());
  }

  protected async isPasswordField(): Promise<boolean> {
    return this.eval(
      (c) => c.inputElement.dom.getAttribute("type") == "password"
    );
  }
}
