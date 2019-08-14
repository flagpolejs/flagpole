import { ProtoValue, Value } from './value';
import { JSHandle, Page, ElementHandle } from 'puppeteer';
import { Link } from './link';
import { Scenario } from './scenario';
import { ResponseType } from './response';
import { AssertionContext } from './assertioncontext';

export class DOMElement extends ProtoValue {

    protected _path: string;

    public get path(): string {
        return this._path;
    }

    public get name(): string {
        return this._name || this._path || 'DOM Element';
    }

    public static async create(input: any, context: AssertionContext, name: string | null = null, path?: string): Promise<DOMElement> {
        const element = new DOMElement(input, context, name, path);
        if (name === null) {
            const tagName: string | null = await element._getTagName();
            if (tagName !== null) {
                element._name = `<${tagName}> Element @ ${path}`;
            }
            else if (path) {
                element._name = String(path);
            }
        }
        return element;
    }

    private constructor(input: any, context: AssertionContext, name?: string | null, path?: string) {
        super(input, context, (name || 'DOM Element'));
        this._path = path || '';
    }

    public toString(): string {
        if (this.isCheerioElement()) {
            return this._context.response.getRoot().html(this._input);
        }
        else if (this.isPuppeteerElement()) {
            return String(this.path);
        }
        return '';
    }

    public async getClassName(): Promise<Value> {
        if (this.isCheerioElement()) {
            return this._wrapAsValue(
                (typeof this._input.get(0).attribs['class'] !== 'undefined') ?
                    this._input.get(0).attribs['class'] : null,
                `Class Name of ${this.name}`
            );
        }
        else if (this.isPuppeteerElement()) {
            const classHandle: JSHandle = await this._input.getProperty('className');
            return this._wrapAsValue(
                await classHandle.jsonValue(), `Class Name of ${this.name}`
            );
        }
        throw new Error(`getClassName is not supported with ${this.toType()}.`);
    }

    public async hasClassName(className: string): Promise<Value> {
        if (this.isCheerioElement()) {
            return this._wrapAsValue(
                this._input.hasClass(className),
                `${this.name} has class ${className}`
            )
        }
        else if (this.isPuppeteerElement()) {
            const classHandle: JSHandle = await this._input.getProperty('className');
            const classString: string = await classHandle.jsonValue();
            return this._wrapAsValue(
                (classString.split(' ').indexOf(className) >= 0),
                `${this.name} has class ${className}`
            )
        }
        throw new Error(`hasClassName is not supported with ${this.toType()}.`);
    }

    public async getTagName(): Promise<Value> {
        const tagName: string = await this._getTagName();
        return this._wrapAsValue(tagName, `Tag Name of ${this.name}`);
    }

    public async getInnerText(): Promise<Value> {
        if (this.isPuppeteerElement() && this._context.page !== null) {
            return this._wrapAsValue(
                await this._context.page.evaluate(e => e.innerText, this.$),
                `Inner Text of ${this.name}`
            );
        }
        else if (this.isCheerioElement()) {
            return this._wrapAsValue(
                this._input.text(),
                `Inner Text of ${this.name}`
            );
        }
        throw new Error(`getInnerText is not supported with ${this.toType()}.`);
    }

    public async getInnerHtml(): Promise<Value> {
        if (this.isPuppeteerElement() && this._context.page !== null) {
            return this._wrapAsValue(
                await this._context.page.evaluate(e => e.innerHTML, this.$),
                `Inner Html of ${this.name}`
            );
        }
        else if (this.isCheerioElement()) {
            return this._wrapAsValue(
                this._input.html(),
                `Inner Html of ${this.name}`
            );
        }
        throw new Error(`getInnerHtml is not supported with ${this.toType()}.`);
    }

    public async getOuterText(): Promise<Value> {
        if (this.isPuppeteerElement() && this._context.page !== null) {
            return this._wrapAsValue(
                await this._context.page.evaluate(e => e.outerText, this.$),
                `Outer Text of ${this.name}`
            );
        }
        else if (this.isCheerioElement()) {
            return this._wrapAsValue(
                this._input.text(),
                `Outer Text of ${this.name}`
            );
        }
        throw new Error(`getInnerText is not supported with ${this.toType()}.`);
    }

    public async getOuterHtml(): Promise<Value> {
        if (this.isPuppeteerElement() && this._context.page !== null) {
            return this._wrapAsValue(
                await this._context.page.evaluate(e => e.outerHTML, this.$),
                `Outer Html of ${this.name}`
            );
        }
        else if (this.isCheerioElement()) {
            return this._wrapAsValue(
                this._context.response.getRoot().html(this._input),
                `Outer Html of ${this.name}`
            );
        }
        throw new Error(`getInnerHtml is not supported with ${this.toType()}.`);
    }

    public async hasAttribute(key: string): Promise<Value> {
        return this._wrapAsValue(
            (await this._getAttribute(key)) != null,
            `${this.name} has attribute ${key}`
        );
    }

    public async getAttribute(key: string): Promise<Value> {
        const name: string = `${this.name} -> ${key}`;
        const attr: string | null = await this._getAttribute(key);
        return this._wrapAsValue(attr, name);
    }

    public async hasProperty(key: string): Promise<Value> {
        return this._wrapAsValue(
            !(await this.getProperty(key)).isNull(),
            `Does ${this.name} have property ${key}?`
        );
    }

    public async getProperty(key: string): Promise<Value> {
        const name: string = `${this.name} -> ${key}`;
        if (this.isCheerioElement()) {
            return this._wrapAsValue(this._input.prop(key), name);
        }
        else if (this.isPuppeteerElement()) {
            const handle: JSHandle = await this._input.getProperty(key);
            return this._wrapAsValue(await handle.jsonValue(), name);
        }
        throw new Error(`getProperty is not supported with ${this.toType()}.`);
    }

    public async hasData(key: string): Promise<Value> {
        return this._wrapAsValue(
            !(await this.getData(key)).isNull(),
            `${this.name} has data ${key}`
        );
    }

    public async getData(key: string): Promise<Value> {
        const name: string = `${this.name} -> ${key}`;
        if (this.isCheerioElement()) {
            return this._wrapAsValue(this._input.data(key), name);
        }
        else if (this.isPuppeteerElement()) {
            const handle: JSHandle = await this._input.getProperty(key);
            return this._wrapAsValue(await handle.jsonValue(), name);
        }
        throw new Error(`getData is not supported with ${this.toType()}.`);
    }

    public async getValue(): Promise<Value> {
        const name: string = `Value of ${this.name}`;
        if (this.isCheerioElement()) {
            return this._wrapAsValue(this._input.val(), name);
        }
        else if (this.isPuppeteerElement()) {
            const handle: JSHandle = await this._input.getProperty('value');
            return this._wrapAsValue(await handle.jsonValue(), name);
        }
        throw new Error(`getValue is not supported with ${this.toType()}.`);
    }

    public async getText(): Promise<Value> {
        const name: string = `Text of ${this.name}`;
        if (this.isCheerioElement()) {
            return this._wrapAsValue(this._input.text(), name);
        }
        else if (this.isPuppeteerElement()) {
            const handle: JSHandle = await this._input.getProperty('textContent');
            return this._wrapAsValue(await handle.jsonValue(), name);
        }
        throw new Error(`getText is not supported with ${this.toType()}.`);
    }

    /**
     * Fill out the form with this data.
     * TODO: This method is only partially working, needs more testing and to be completed.
     * 
     * @param formData 
     */
    public async fillForm(formData: any): Promise<any> {
        const element: DOMElement = this;
        const isForm: boolean = await this._isFormTag();
        if (isForm) {
            if (element.isCheerioElement()) {
                const form: Cheerio = element._input;
                for (let name in formData) {
                    const value = formData[name];
                    form.find(`[name="${name}"]`).val(value);
                }
            }
            else if (element.isPuppeteerElement()) {
                const page: Page | null = element._context.page;
                if (page !== null) {
                    for (let name in formData) {
                        const value: any = formData[name];
                        const selector: string = `${element._path} [name="${name}"]`;
                        const input: ElementHandle | null = await page.$(selector);
                        if (input !== null) {
                            const tagName = (await (await input.getProperty('tagName')).jsonValue()).toLowerCase();
                            const inputType = (await (await input.getProperty('type')).jsonValue()).toLowerCase();
                            await page.focus(selector);
                            if (tagName == 'select') {
                                await page.select(selector, value);
                            }
                            else if (tagName == 'input') {
                                await page.type(selector, value);
                            }
                        }
                    }
                }
            }
            return element;
        }
        else {
            throw new Error('This is not a form element.');
        }
    }

    public async submit(): Promise<any>;
    public async submit(callback: Function): Promise<any>;
    public async submit(message: string, callback: Function): Promise<any>;
    public async submit(a?: string | Function, b?: Function): Promise<any> {
        if (!this._isFormTag()) {
            throw new Error('You can only use .submit() with a form element.');
        }
        if (this.isPuppeteerElement()) {
            if (this._context.page === null) {
                throw new Error('Page was null');
            } 
            return await this._context.page.evaluate(form => form.submit(), this.$);
        }
        else if (this.isCheerioElement()) {
            const link: Link = await this._getLink();
            const scenario: Scenario = await this._createLambdaScenario(a, b);
            const method = ((await this._getAttribute('method')) || 'get').toString().toLowerCase();
            // If there is a URL we can submit the form to
            if (link.isNavigation()) {
                let uri: string;
                scenario.method(method);
                if (method == 'get') {
                    uri = link.getUri(this.$.serializeArray());
                }
                else {
                    const formDataArray: { name: string, value: string }[] = this.$.serializeArray();
                    const formData: any = {};
                    uri = link.getUri();
                    formDataArray.forEach(function (input: any) {
                        formData[input.name] = input.value;
                    });
                    scenario.form(formData)
                }
                return scenario.open(uri);
            }
            // Not a valid URL to submit form to
            else {
                return scenario.skip('Nothing to submit');
            }
        }
        throw new Error('This is not supported yet.');
    }

    public async click(): Promise<any>;
    public async click(callback: Function): Promise<any>;
    public async click(message: string, callback: Function): Promise<any>;
    public async click(a?: string | Function, b?: Function): Promise<any> {
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
        // Click in Puppeteer
        if (this.isPuppeteerElement()) {
            return await this._input.click();
        }
        // If this is a link tag, treat it the same as load
        if (await this._isLinkTag()) {
            return await this.load(message, callback);
        }
        // Is this a button?
        if (await this._isButtonTag()) {

        }
        throw Error('This is not a clickable element.');
    }

    /**
     * Load the URL from this NodeElement if it has something to load
     * This is used to create a lambda scenario
     * 
     * @param a 
     */
    public async load(): Promise<Scenario>;
    public async load(callback: Function): Promise<Scenario>;
    public async load(message: string, callback: Function): Promise<Scenario>;
    public async load(a?: string | Function, b?: Function): Promise<Scenario> {
        const link: Link = await this._getLink();
        const scenario: Scenario = await this._createLambdaScenario(a, b);
        // Is this link one that we can actually load?
        if (link.isNavigation()) {
            // Set a better title
            scenario.title = (typeof a == 'string' && a.length) ? a : `Load ${link.getUri()}`;
            // Execute it asynchronously
            setTimeout(() => {
                scenario.open(link.getUri());
            }, 1);
        }
        else {
            scenario.skip('Not a navigational link');
        }
        return scenario;
    }

    private async _isFormTag(): Promise<boolean> {
        if (this.isCheerioElement() || this.isPuppeteerElement()) {
            return (await this._getTagName()) == 'form';
        }
        return false;
    }

    private async _isButtonTag(): Promise<boolean> {
        if (this.isCheerioElement() || this.isPuppeteerElement()) {
            const tagName: string = await this._getTagName();
            const type: string | null = await this._getAttribute('type');
            return (
                tagName === 'button' ||
                (tagName === 'input' && (['button', 'submit', 'reset'].indexOf(String(type)) >= 0))
            );
        }
        return false;
    }

    private async _isLinkTag(): Promise<boolean> {
        if (this.isCheerioElement() || this.isPuppeteerElement()) {
            return (
                await this._getTagName() === 'a' &&
                await this._getAttribute('href') !== null
            );
        }
        return false;
    }

    private async _isImageTag(): Promise<boolean> {
        if (this.isCheerioElement() || this.isPuppeteerElement()) {
            return (
                await this._getTagName() === 'img' &&
                await this._getAttribute('src') !== null
            );
        }
        return false;
    }

    private async _isVideoTag(): Promise<boolean> {
        if (this.isCheerioElement() || this.isPuppeteerElement()) {
            const tagName: string = await this._getTagName();
            const src: string | null = await this._getAttribute('src');
            const type: string | null = await this._getAttribute('type');
            return (
                (tagName === 'video' && src !== null) ||
                (tagName === 'source' && src !== null && /video/i.test(type || ''))
            );
        }
        return false;
    }

    private async _isAudioTag(): Promise<boolean> {
        if (this.isCheerioElement() || this.isPuppeteerElement()) {
            const tagName: string = await this._getTagName();
            const src: string | null = await this._getAttribute('src');
            const type: string | null = await this._getAttribute('type');
            return (
                (tagName === 'audio' && src !== null) ||
                (tagName === 'bgsound' && src !== null) ||
                (tagName === 'source' && src !== null && /audio/i.test(type || ''))
            );
        }
        return false;
    }

    private async _isScriptTag(): Promise<boolean> {
        if (this.isCheerioElement() || this.isPuppeteerElement()) {
            return (
                await this._getTagName() === 'script' &&
                await this._getAttribute('src') !== null
            );
        }
        return false;
    }

    private async _isStylesheetTag(): Promise<boolean> {
        if (this.isCheerioElement() || this.isPuppeteerElement()) {
            return (
                await this._getTagName() === 'link' &&
                await this._getAttribute('href') !== null &&
                String(await this._getAttribute('rel')).toLowerCase() == 'stylesheet'
            );
        }
        return false;
    }

    private async _isClickable(): Promise<boolean> {
        return (
            await this._isLinkTag() ||
            await this._isButtonTag()
        );
    }

    private async _getUrl(): Promise<string | null> {
        const tagName: string = await this._getTagName();
        if (this.isCheerioElement() || this.isPuppeteerElement()) {
            if (tagName !== null) {
                if (['img', 'script', 'video', 'audio', 'object', 'iframe'].indexOf(tagName) >= 0) {
                    return this._getAttribute('src');
                }
                else if (['a', 'link'].indexOf(tagName) >= 0) {
                    return this._getAttribute('href');
                }
                else if (['form'].indexOf(tagName) >= 0) {
                    return this._getAttribute('action') || this._context.scenario.getUrl();
                }
                else if (['source'].indexOf(tagName) >= 0) {
                    return this._getAttribute('src');
                }
            }
        }
        return null;
    }

    private async _getLambdaScenarioType(): Promise<string> {
        if (
            (await this._isFormTag()) || (await this._isClickable())
        ) {
            // Assume if we are already in browser mode, we want to stay there
            return (this._context.scenario.responseType == ResponseType.browser) ?
                'browser' : 'html';
        }
        else if (await this._isImageTag()) {
            return 'image';
        }
        else if (await this._isStylesheetTag()) {
            return 'stylesheet';
        }
        else if (await this._isScriptTag()) {
            return 'script';
        }
        else if (await this._isVideoTag()) {
            return 'video'
        }
        else {
            return 'resource';
        }
    }

    private async _getLink(): Promise<Link> {
        const srcPath: string | null = await this._getUrl();
        return new Link(srcPath || '', this._context);
    }

    private async _createLambdaScenario(a: any, b: any): Promise<Scenario> {
        const title: string = typeof a == 'string' ? a : this._path;
        const scenario: Scenario = this._context.suite.scenario(title);
        const scenarioType: string = await this._getLambdaScenarioType();
        const callback: Function = (function () {
            // Handle overloading
            if (typeof b == 'function') {
                return b;
            }
            else if (typeof a == 'function') {
                return a;
            }
            // No callback was set, so just create a blank one
            else {
                return function () { };
            }
        })();
        // Get the options or just pass the default
        const opts: any = (
            (scenarioType == 'browser' && this._context.scenario.responseType == ResponseType.browser) ||
            scenarioType != 'browser'
        ) ? this._context.scenario.getRequestOptions() : {};
        // Initialize the scenario
        scenario[scenarioType](opts);
        // Apply the callback
        scenario.next(callback);
        // Return it
        return scenario;
    }

    private async _getTagName(): Promise<string> {
        if (this.isCheerioElement()) {
            return this._input.get(0).tagName.toLowerCase();
        }
        else if (this.isPuppeteerElement()) {
            const handle: JSHandle = await this._input.getProperty('tagName');
            return String(await handle.jsonValue()).toLowerCase();
        }
        throw new Error(`getTagName is not supported with ${this.toType()}.`);
    }

    private async _getAttribute(key: string): Promise<string | null> {
        if (this.isCheerioElement()) {
            return (typeof this._input.get(0).attribs[key] !== 'undefined') ?
                this._input.get(0).attribs[key] : null;
        }
        else if (this.isPuppeteerElement()) {
            const handle: JSHandle = await this._input.getProperty(key);
            return await handle.jsonValue();
        }
        throw new Error(`getAttribute is not supported with ${this.toType()}.`);
    }


}