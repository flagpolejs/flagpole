import { iAssertionContext, iValue } from "./interfaces";
import { PuppeteerElement } from "./puppeteerelement";

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
  formpanel: "Ext.form.Panel"
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

  public static async create(
    referencePath: string,
    context: iAssertionContext,
    path: string
  ) {
    const element = new ExtJsComponent(referencePath, context, path, path);
    const componentType: string | null = (await element.getType()).$;
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

  public async getType(): Promise<iValue> {
    return this._wrapAsValue(
      await this._eval(`${this._component}.xtype`),
      `Type of ${this.name}`
    );
  }

  public async getId(): Promise<iValue> {
    return this._wrapAsValue(
      await this._eval(`${this._component}.getId()`),
      `Id of ${this.name}`
    );
  }

  public async getWidth(): Promise<iValue> {
    return this._wrapAsValue(
      await this._eval(`${this._component}.getSize().width`),
      `Width of ${this.name}`
    );
  }

  public async getHeight(): Promise<iValue> {
    return this._wrapAsValue(
      await this._eval(`${this._component}.getSize().height`),
      `Width of ${this.name}`
    );
  }

  public async getSize(): Promise<iValue> {
    return this._wrapAsValue(
      await this._eval(`${this._component}.getSize()`),
      `Size of ${this.name}`
    );
  }

  public async getText(): Promise<iValue> {
    return this._wrapAsValue(
      await this._eval(`${this._component}.getText()`),
      `Text of ${this.name}`
    );
  }

  public async getValue(): Promise<iValue> {
    return this._wrapAsValue(
      await this._eval(`${this._component}.getValue()`),
      `Value of ${this.name}`
    );
  }

  public async setValue(value: string): Promise<iValue> {
    return this._wrapAsValue(
      await this._eval(`${this._component}.setValue(${JSON.stringify(value)})`),
      `Set value of ${this.name}`
    );
  }

  public async setData(value: string): Promise<iValue> {
    return this._wrapAsValue(
      await this._eval(`${this._component}.setData(${JSON.stringify(value)})`),
      `Set data of ${this.name}`
    );
  }

  public async getData(): Promise<iValue> {
    return this._wrapAsValue(
      await this._eval(`${this._component}.getData()`),
      `Data of ${this.name}`
    );
  }

  public async disable(): Promise<iValue> {
    return this._wrapAsValue(
      await this._eval(`${this._component}.disable()`),
      `Disable ${this.name}`
    );
  }

  public async enable(): Promise<iValue> {
    return this._wrapAsValue(
      await this._eval(`${this._component}.enable()`),
      `Enable ${this.name}`
    );
  }

  public async hide(): Promise<iValue> {
    return this._wrapAsValue(
      await this._eval(`${this._component}.Hide()`),
      `Hide ${this.name}`
    );
  }

  public async show(): Promise<iValue> {
    return this._wrapAsValue(
      await this._eval(`${this._component}.show()`),
      `Show ${this.name}`
    );
  }

  public async focus(): Promise<iValue> {
    return this._wrapAsValue(
      await this._eval(`${this._component}.focus()`),
      `Focus on ${this.name}`
    );
  }

  public async isHidden(): Promise<iValue> {
    return this._wrapAsValue(
      await this._eval(`${this._component}.isHidden() || false`),
      `Is ${this.name} hidden?`
    );
  }

  public async isVisible(): Promise<iValue> {
    return this._wrapAsValue(
      await this._eval(`${this._component}.isVisible() || false`),
      `Is ${this.name} visible?`
    );
  }

  public async isEnabled(): Promise<iValue> {
    return this._wrapAsValue(
      await this._eval(`${this._component}.isEnabled() || false`),
      `Is ${this.name} enabled?`
    );
  }

  public async isDisabled(): Promise<iValue> {
    return this._wrapAsValue(
      await this._eval(`${this._component}.isDisabled() || false`),
      `Is ${this.name} hidden?`
    );
  }

  public async getProperty(propertyName: string): Promise<iValue> {
    return this._wrapAsValue(
      await this._eval(`${this._component}.${propertyName}`),
      `${this.name}.${propertyName}`
    );
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
    return this._wrapAsValue(
      await this._eval(`${this._component}.fireEvent("${eventName}")`),
      `Fired ${eventName} on ${this.name}`
    );
  }

  public async click(): Promise<any> {
    return await this._eval(`${this._component}.element.dom.click()`);
  }

  protected async _eval(js: string): Promise<any> {
    if (this._context.page !== null) {
      return await this._context.page.evaluate(js);
    }
    throw new Error("Page was null.");
  }
}
