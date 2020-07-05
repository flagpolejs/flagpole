import { iAssertionContext, iValue } from "./interfaces";
import { PuppeteerElement } from "./puppeteerelement";
import { ExtJSResponse } from ".";

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
  protected _path: string;

  public get path(): string {
    return this._path;
  }

  public get name(): string {
    return this._name || this._path || "ExtJs Component";
  }

  protected get _component(): string {
    return `window.${this._input}`;
  }

  private get _response(): ExtJSResponse {
    return this._context.response as ExtJSResponse;
  }

  public static async create(
    referencePath: string,
    context: iAssertionContext,
    path: string
  ) {
    const element = new ExtJsComponent(referencePath, context, path, path);
    const componentType: string | null = (await element.getTagName()).$;
    if (componentType !== null) {
      element._name = `<${componentType}> Component @ ${path}`;
    }
    return element;
  }

  private constructor(
    input: any,
    context: iAssertionContext,
    name?: string | null,
    path?: string
  ) {
    super(input, context, name || "ExtJs Component");
    this._path = path || "";
  }

  protected async _getInnerText() {
    return String(await this._eval(`${this._component}.element.dom.innerText`));
  }

  protected async _getInnerHtml() {
    return String(await this._eval(`${this._component}.element.dom.innerHTML`));
  }

  protected async _getOuterHtml() {
    return String(await this._eval(`${this._component}.element.dom.outerHTML`));
  }

  public async getText(): Promise<iValue> {
    return this._wrapAsValue(
      String(await this._eval(`${this._component}.getText()`)),
      `Text of ${this.name}`
    );
  }

  public async getValue(): Promise<iValue> {
    return this._wrapAsValue(
      await this._eval(`${this._component}.getValue()`),
      `Value of ${this.name}`
    );
  }

  public async getData(key: string): Promise<iValue> {
    return this._wrapAsValue(
      await this._eval(`${this._component}.getData("${key}")`),
      `Data of ${this.name}`
    );
  }

  public async focus(): Promise<any> {
    return this._action("focus");
  }

  public async call(method: string, ...args: any[]): Promise<iValue> {
    args.forEach((arg, i) => {
      args[i] = JSON.stringify(arg);
    });
    return this._wrapAsValue(
      await this._eval(`${this._component}.${method}(${args.join(",")})`),
      `${this.name}.${method}(${String(args)})`
    );
  }

  public async fireEvent(eventName: string): Promise<iValue> {
    this._completedAction(eventName.toUpperCase(), this.name);
    return this._wrapAsValue(
      await this._eval(`${this._component}.fireEvent("${eventName}")`),
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

  public async type(textToType: string, opts: any) {
    await this.focus();
    await this.setValue(textToType);
    return this.blur();
  }

  public setValue(text: string) {
    return this._eval(`${this._component}.setValue("${text}")`);
  }

  public async getParent(): Promise<ExtJsComponent | iValue> {
    const id = String(await this._eval(`${this._component}.parent.id`));
    const component = await this._response.getComponentById(id);
    return component || this._wrapAsValue(null, `Parent of ${this.name}`);
  }

  public async getNextSibling(
    selector: string
  ): Promise<ExtJsComponent | iValue> {
    const id = String(
      await this._eval(`${this._component}.nextSibling("${selector}")`)
    );
    const component = await this._response.getComponentById(id);
    return component || this._wrapAsValue(null, `Next Sibling of ${this.name}`);
  }

  public async getPreviousSibling(
    selector: string
  ): Promise<ExtJsComponent | iValue> {
    const id = String(
      await this._eval(`${this._component}.previousSibling("${selector}")`)
    );
    const component = await this._response.getComponentById(id);
    return (
      component || this._wrapAsValue(null, `Previous Sibling of ${this.name}`)
    );
  }

  protected async _action(
    name: string,
    actionOnDom: boolean = true
  ): Promise<void> {
    await this._eval(
      actionOnDom
        ? `${this._component}.element.dom.${name}()`
        : `${this._component}.element.${name}()`
    );
    this._completedAction(name.toUpperCase());
  }

  protected async _getClassName(): Promise<string> {
    return String(await this._eval(`${this._component}.element.dom.className`));
  }

  protected _getAttribute(key: string): Promise<string> {
    return this._eval(`${this._component}.element.getAttribute("${key}")`);
  }

  protected _getTagName(): Promise<string> {
    return this._eval(`${this._component}.xtype`);
  }
}
