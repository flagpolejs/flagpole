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

    public static create(input: any, context: AssertionContext, name: string | null = null, path?: string): Promise<PuppeteerElement> {
        return new Promise(resolve => {
            const element = new PuppeteerElement(input, context, name, path);
            if (name === null) {
                element._name = String(path);
            }
            Promise.all([
                    element._getTagName(),
                    element._getSourceCode()
                ])
                .then(() => {
                    resolve(element);
                })
       })
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

    public async find(selector: string): Promise<PuppeteerElement | Value> {
        const element: ElementHandle | null = await this.$.$(selector)
        const name: string = `${selector} under ${this.name}`;
        const path: string = `${this.path} ${selector}`;
        if (element !== null) {
            return PuppeteerElement.create(
                element, this._context, name, path
            );
        }
        return this._wrapAsValue(null, name, this);
    }

    public async findAll(selector: string): Promise<PuppeteerElement[]> {
        const elements: ElementHandle[] = await this.$.$$(selector)
        const out: PuppeteerElement[] = [];
       await Flagpole.forEach(elements, async (element: ElementHandle, i: number) => {
            out.push(
                await PuppeteerElement.create(
                    element,
                    this._context,
                    `${selector}[${i}] under ${this.name}`,
                    `${this.path} ${selector}[${i}]`
                )
            )
        });
        return out;
    }

    public async getClosest(selector: string = '*'): Promise<PuppeteerElement | Value> {
        const closest: ElementHandle[] = await this.$.$x(`ancestor-or-self::${selector}`);
        const name: string = `Closest ${selector} of ${this.name}`;
        const path: string = `${this.path}[ancestor-or-self::${selector}]`;
        if (closest.length > 0) {
            return PuppeteerElement.create(
                closest[0], this._context, name, path
            );
        }
        return this._wrapAsValue(null, name, this);
    }

    public async getChildren(selector: string = '*'): Promise<PuppeteerElement[]> {
        const children: ElementHandle[] = await this.$.$x(`child::${selector}`);
        const out: PuppeteerElement[] = [];
        await Flagpole.forEach(children, async (child: ElementHandle, i: number) => {
            const name: string = `Child ${selector} ${i} of ${this.name}`;
            const path: string = `${this.path}[child::${selector}][${i}]`;
            out.push(
                await PuppeteerElement.create(
                    child, this._context, name, path
                )
            )
        });
        return out;
    }

    public async getParent(): Promise<PuppeteerElement | Value> {
        const parents: ElementHandle[] = await this.$.$x('..');
        const name: string = `Parent of ${this.name}`;
        const path: string = `${this.path}[..]`;
        if (parents.length > 0) {
            return PuppeteerElement.create(
                parents[0], this._context, name, path
            );
        }
        return this._wrapAsValue(null, name, this);
    }

    public async getSiblings(selector: string = '*'): Promise<PuppeteerElement[]> {
        const prevSiblings: ElementHandle[] = await this.$.$x(`preceding-sibling::${selector}`);
        const nextSiblings: ElementHandle[] = await this.$.$x(`following-sibling::${selector}`);
        const siblings: PuppeteerElement[] = [];
        await Flagpole.forEach(prevSiblings.concat(nextSiblings), async (sibling: ElementHandle, i: number) => {
            const name: string = `Sibling ${i} of ${this.name}`;
            const path: string = `${this.path}[sibling::${selector}][${i}]`;
            siblings.push(
                await PuppeteerElement.create(
                    sibling, this._context, name, path
                )
            )
        });
        return siblings;
    }

    public async getPreviousSibling(selector: string = '*'): Promise<PuppeteerElement | Value> {
        const siblings: ElementHandle[] = await this.$.$x(`preceding-sibling::${selector}`);
        const name: string = `Previous Sibling of ${this.name}`;
        const path: string = `${this.path}[preceding-sibling::${selector}][0]`;
        if (siblings.length > 0) {
            return PuppeteerElement.create(
                siblings[0], this._context, name, path
            );
        }
        return this._wrapAsValue(null, name, this);
    }

    public async getPreviousSiblings(selector: string = '*'): Promise<PuppeteerElement[]> {
        const siblingElements: ElementHandle[] = await this.$.$x(`preceding-sibling::${selector}`);
        const siblings: PuppeteerElement[] = [];
        await Flagpole.forEach(siblingElements, async (sibling: ElementHandle, i: number) => {
            const name: string = `Previous Sibling ${i} of ${this.name}`;
            const path: string = `${this.path}[preceding-sibling::${selector}][${i}]`;
            siblings.push(
                await PuppeteerElement.create(
                    sibling, this._context, name, path
                )
            )
        });
        return siblings;
    }

    public async getNextSibling(selector: string = '*'): Promise<PuppeteerElement | Value> {
        const siblings: ElementHandle[] = await this.$.$x(`following-sibling::${selector}`);
        const name: string = `Next Sibling of ${this.name}`;
        const path: string = `${this.path}[following-sibling::${selector}][0]`;
        if (siblings.length > 0) {
            return PuppeteerElement.create(
                siblings[0], this._context, name, path
            );
        }
        return this._wrapAsValue(null, name, this);
    }

    public async getNextSiblings(selector: string = '*'): Promise<PuppeteerElement[]> {
        const siblingElements: ElementHandle[] = await this.$.$x(`following-sibling::${selector}`);
        const siblings: PuppeteerElement[] = [];
        await Flagpole.forEach(siblingElements, async (sibling: ElementHandle, i: number) => {
            const name: string = `Next Sibling ${i} of ${this.name}`;
            const path: string = `${this.path}[following-sibling::${selector}][${i}]`;
            siblings.push(
                await PuppeteerElement.create(
                    sibling, this._context, name, path
                )
            )
        });
        return siblings;
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
        let explicitCallback: boolean = true;
        const callback: Function = (() => {
            if (typeof b == 'function') {
                return b;
            }
            else if (typeof a == 'function') {
                return a;
            }
            explicitCallback = false;
            return function () { };
        })();
        const message: string = typeof a == 'string' ? a : '';
        message && this._context.scenario.comment(message);
        if (message.length > 0 || explicitCallback) {
            await this.load(message, callback);
        }
        else {
            await (<ElementHandle>this._input).click();
        }
        this._completedAction('CLICK');
    }

    protected _getTagName(): Promise<string> {
        return new Promise(async resolve => {
            const handle: JSHandle = await this._input.getProperty('tagName');
            const value: string = await handle.jsonValue();
            this._tagName = value.toLowerCase();
            resolve(value);
        })
    }

    protected _getSourceCode(): Promise<void> {
        return new Promise(async resolve => {
            const outerHtml: string = (await this.getOuterHtml()).toString();
            this._sourceCode = outerHtml;
            resolve();
        });
    }

    protected async _getAttribute(key: string): Promise<any> {
        const handle: JSHandle = await this._input.getProperty(key);
        return await handle.jsonValue();
    }

}