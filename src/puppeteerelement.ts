import { Value, iValue } from './value';
import { JSHandle, Page, ElementHandle } from 'puppeteer';
import { AssertionContext } from './assertioncontext';
import { Flagpole } from '.';
import { DOMElement } from './domelement';

export class PuppeteerElement extends DOMElement implements iValue {

    protected _input: ElementHandle;

    public get $(): ElementHandle {
        return this._input;
    }

    public static async create(input: any, context: AssertionContext, name: string | null = null, path?: string): Promise<PuppeteerElement> {
        const element = new PuppeteerElement(input, context, name, path);
        if (name === null) {
            const tagName: string | null = await element._getTagName();
            if (tagName !== null) {
                element._name = `<${tagName}> Element @ ${path}`;
            }
            else if (path) {
                element._name = String(path);
            }
        }
        // I have no idea why I have to do this setTimeout, but it dies without it
        setTimeout(async () => {
            element._sourceCode = (await element.getOuterHtml()).toString();
        }, 0);
        return element;
    }

    protected constructor(input: any, context: AssertionContext, name?: string | null, path?: string) {
        super(input, context, name, path);
        this._input = input;
        this._path = path || '';
    }

    public toString(): string {
        return String(this.path);
    }

    public async getClassName(): Promise<Value> {
        const classHandle: JSHandle = await this._input.getProperty('className');
        return this._wrapAsValue(
            await classHandle.jsonValue(), `Class Name of ${this.name}`
        );
    }

    public async hasClassName(className: string): Promise<Value> {
        const classHandle: JSHandle = await this._input.getProperty('className');
        const classString: string = await classHandle.jsonValue();
        return this._wrapAsValue(
            (classString.split(' ').indexOf(className) >= 0),
            `${this.name} has class ${className}`
        )
    }

    public async getInnerText(): Promise<Value> {
        if (this._context.page == null) {
            throw new Error('Page is null.');
        }
        return this._wrapAsValue(
            await this._context.page.evaluate(e => e.innerText, this.$),
            `Inner Text of ${this.name}`
        );
    }

    public async getInnerHtml(): Promise<Value> {
        if (this._context.page == null) {
            throw new Error('Page is null.');
        }
        return this._wrapAsValue(
            await this._context.page.evaluate(e => e.innerHTML, this.$),
            `Inner Html of ${this.name}`
        );
    }

    public async getOuterHtml(): Promise<Value> {
        if (this._context.page === null) {
            throw new Error('Page is null.');
        }
        const html: string = await this.$.executionContext().evaluate(e => e.outerHTML, this.$);
        return this._wrapAsValue(
            html,
            `Outer Html of ${this.name}`
        );
    }

    public async getProperty(key: string): Promise<Value> {
        const name: string = `${key} of ${this.name}`;
        const handle: JSHandle = await this._input.getProperty(key);
        return this._wrapAsValue(await handle.jsonValue(), name, this);
    }

    public async getData(key: string): Promise<Value> {
        const name: string = `Data of ${this.name}`;
        const handle: JSHandle = await this._input.getProperty(key);
        return this._wrapAsValue(await handle.jsonValue(), name, this);
    }

    public async getValue(): Promise<Value> {
        const name: string = `Value of ${this.name}`;
        const handle: JSHandle = await this._input.getProperty('value');
        return this._wrapAsValue(await handle.jsonValue(), name, this);
    }

    public async getText(): Promise<Value> {
        const name: string = `Text of ${this.name}`;
        const handle: JSHandle = await this._input.getProperty('textContent');
        const text: string = await handle.jsonValue();
        return this._wrapAsValue(text, name, this);
    }

    public async clearThenType(textToType: string, opts: any = {}): Promise<void> {
        await this.clear();
        await this.type(textToType, opts);
    }

    public async type(textToType: string, opts: any = {}): Promise<void> {
        if (this._context.page == null) {
            throw new Error('Page is null.');
        }
        await (this._input as ElementHandle).type(textToType, opts);
        this._completedAction('TYPE', textToType);
    }

    public async clear(): Promise<void> {
        if (this._context.page == null) {
            throw new Error('Page is null.');
        }
        await (this._input as ElementHandle).click({ clickCount: 3 });
        await this._context.page.keyboard.press('Backspace');
        this._completedAction('CLEAR');
    }

    public async fillForm(formData: any): Promise<any> {
        const element: PuppeteerElement = this;
        const isForm: boolean = await this._isFormTag();
        if (this._context.page == null) {
            throw new Error('Page is null.');
        }
        if (!isForm) {
            throw new Error('This is not a form element.');
        }
        const page: Page | null = this._context.page;
        if (page === null) {
            throw new Error('Page is null');
        }
        for (let name in formData) {
            const value: any = formData[name];
            const selector: string = `${element._path} [name="${name}"]`;
            const inputs: ElementHandle[] = await page.$$(selector);
            if (inputs.length > 0) {
                const input: ElementHandle = inputs[0];
                const tagName: string = (await (await input.getProperty('tagName')).jsonValue()).toLowerCase();
                const inputType: string = (await (await input.getProperty('type')).jsonValue()).toLowerCase();
                // Some sites need you to focus on the element first
                await page.focus(selector);
                // Dropdowns
                if (tagName == 'select') {
                    await page.select(selector, value);
                }
                // Input boxes
                else if (tagName == 'input') {
                    // Radio or checkbox we need to click on the items
                    if (inputType == 'radio' || inputType == 'checkbox') {
                        // Turn it into an array, to support multiple checked boxes
                        const multiValues: any[] = Flagpole.toType(value) == 'array' ? value : [value];
                        // Loop through each checkbox/radio element with this name
                        for (let i = 0; i < inputs.length; i++) {
                            let checkbox: ElementHandle = inputs[i];
                            let isChecked: boolean = !!(await (await checkbox.getProperty('checked')).jsonValue());
                            let checkboxValue: string = String(await (await checkbox.getProperty('value')).jsonValue());
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
                    }
                    else if (inputType == 'button' || inputType == 'submit' || inputType == 'reset') {
                        // Do nothing for now (maybe should click??)
                    }
                    else {
                        await this._context.clearThenType(selector, value);
                    }
                }
                // Button elements
                else if (tagName == 'button') {
                    // Do nothing for now (maybe should click??)
                }
            }
            this._completedAction('FILL');
        }
    }

    public async submit(): Promise<void>;
    public async submit(callback: Function): Promise<void>;
    public async submit(message: string, callback: Function): Promise<void>;
    public async submit(a?: string | Function, b?: Function): Promise<void> {
        if (!this._isFormTag()) {
            throw new Error('You can only use .submit() with a form element.');
        }
        if (this._context.page === null) {
            throw new Error('Page was null');
        }
        await this._context.page.evaluate(form => form.submit(), this.$);
        this._completedAction('SUBMIT');
    }

    public async click(): Promise<void>;
    public async click(callback: Function): Promise<void>;
    public async click(message: string, callback: Function): Promise<void>;
    public async click(a?: string | Function, b?: Function): Promise<void> {
        const callback: Function = (() => {
            if (typeof b == 'function') {
                return b;
            }
            else if (typeof a == 'function') {
                return a;
            }
            return function () { };
        })();
        const message: string = typeof a == 'string' ? a : '';
        message && this._context.scenario.comment(message);
        await (<ElementHandle>this._input).click();
        this._completedAction('CLICK');
    }

    protected async _getTagName(): Promise<string> {
        const handle: JSHandle = await this._input.getProperty('tagName');
        return String(await handle.jsonValue()).toLowerCase();
    }

    protected async _getAttribute(key: string): Promise<string | null> {
        const handle: JSHandle = await this._input.getProperty(key);
        return await handle.jsonValue();
    }

}