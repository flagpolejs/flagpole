import { iAssertionContext, iValue } from "./interfaces";
import { PuppeteerElement } from "./puppeteerelement";
import { ExtJSResponse } from ".";
import { JSHandle, EvaluateFn, SerializableOrJSHandle } from "puppeteer";
import { arrayify } from "./util";

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
    return this._context.response as ExtJSResponse;
  }

  private get _isExtComponent(): boolean {
    return this.toType() == "ext";
  }

  public static async create(
    handle: JSHandle,
    context: iAssertionContext,
    name: string,
    path?: string
  ) {
    const element = new ExtJsComponent(handle, context, name, path);
    const componentType = await element._getTagName();
    if (componentType !== null) {
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

  public async call(method: string, ...args: any[]): Promise<iValue> {
    args.forEach((arg, i) => {
      args[i] = JSON.stringify(arg);
    });
    return this._wrapAsValue(
      this.eval(
        (c, method, evalArgs) => c[method].apply(c, evalArgs),
        method,
        args
      ),
      `${this.name}.${method}(${String(args)})`
    );
  }

  public async fireEvent(eventName: string): Promise<iValue> {
    this._completedAction(eventName.toUpperCase(), this.name);
    return this._wrapAsValue(
      this.$.evaluate((c) => c.fireEvent(eventName)),
      `Fired ${eventName} on ${this.name}`
    );
  }

  public async hover(): Promise<void> {
    return this._action("hover", false);
  }

  public async blur(): Promise<any> {
    return this._action("blur");
  }

  public async click(): Promise<any> {
    return this._action("click");
  }

  public async clear(): Promise<void> {
    this.setValue("");
  }

  public async find(selector: string): Promise<iValue> {
    throw "component.find is not yet implemented in Ext";
  }

  public async findAll(selector: string): Promise<iValue[]> {
    throw "component.findAll is not yet implemented in Ext";
  }

  public async type(textToType: string, opts: any) {
    await this.focus();
    await this.setValue(textToType);
    this._completedAction("TYPE", textToType);
    return this.blur();
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

  public async getClosest(selector: string = ".x-component"): Promise<iValue> {
    if (this._isExtComponent && selector == ".x-component") {
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

  protected async _action(
    name: string,
    actionOnDom: boolean = true
  ): Promise<void> {
    actionOnDom
      ? this.eval((c, name) => c.element.dom[name](), name)
      : this.eval((c, name) => c.element[name](), name);
    this._completedAction(name.toUpperCase());
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
    return String(await this.eval((c) => c.getText()));
  }

  protected async _getValue() {
    return this.eval((c) => c.getValue());
  }

  protected async _getData(key: string) {
    return this.eval((c) => c.getData(key));
  }
}
