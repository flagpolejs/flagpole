import { ProtoValue, Value, iValue } from './value';
import { Link } from './link';
import { Scenario } from './scenario';
import { ResponseType } from './response';
import { AssertionContext } from './assertioncontext';

export class DOMElement extends ProtoValue implements iValue {

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

    protected constructor(input: any, context: AssertionContext, name?: string | null, path?: string) {
        super(input, context, (name || 'DOM Element'));
        this._path = path || '';
    }

    /**
     * Convert element synchronously to string as best we can
     */
    public toString(): string {
        return this._context.response.getRoot().html(this._input);
    }

    /**
     * Get all class names for element
     */
    public async getClassName(): Promise<Value> {
        return this._wrapAsValue(
            (typeof this._input.get(0).attribs['class'] !== 'undefined') ?
                this._input.get(0).attribs['class'] : null,
            `Class Name of ${this.name}`
        );
    }

    /**
     * Does this element have the given class?
     * 
     * @param className 
     */
    public async hasClassName(className: string): Promise<Value> {
        return this._wrapAsValue(
            this._input.hasClass(className),
            `${this.name} has class ${className}`
        );
    }

    /**
     * Get element's HTML tag name
     */
    public async getTagName(): Promise<Value> {
        const tagName: string = await this._getTagName();
        return this._wrapAsValue(tagName, `Tag Name of ${this.name}`);
    }

    /**
     * Get element's innerText
     */
    public async getInnerText(): Promise<Value> {
        return this._wrapAsValue(
            this._input.text(),
            `Inner Text of ${this.name}`
        );
    }

    /**
     * Get element's innerHtml which will not include the element itself, only its contents
     */
    public async getInnerHtml(): Promise<Value> {
        return this._wrapAsValue(
            this._input.html(),
            `Inner Html of ${this.name}`
        );
    }

    /**
     * Get the HTML of the element and all of its contents
     */
    public async getOuterHtml(): Promise<Value> {
        return this._wrapAsValue(
            this._context.response.getRoot().html(this._input),
            `Outer Html of ${this.name}`
        );
    }

    /**
     * Does this element have an atribute with this name?
     * 
     * @param key 
     */
    public async hasAttribute(key: string): Promise<Value> {
        return this._wrapAsValue(
            (await this._getAttribute(key)) != null,
            `${this.name} has attribute ${key}`
        );
    }

    /**
     * Get the attribute with this name or null if it doesn't exist
     * 
     * @param key 
     */
    public async getAttribute(key: string): Promise<Value> {
        const name: string = `${this.name} -> ${key}`;
        const attr: string | null = await this._getAttribute(key);
        return this._wrapAsValue(attr, name, this);
    }

    /**
     * Does this element have a property with this name?
     * 
     * @param key 
     */
    public async hasProperty(key: string): Promise<Value> {
        return this._wrapAsValue(
            !(await this.getProperty(key)).isNull(),
            `Does ${this.name} have property ${key}?`
        );
    }

    /**
     * Get the property with this name in the element, or null if it doesn't exist
     * @param key 
     */
    public async getProperty(key: string): Promise<Value> {
        const name: string = `${key} of ${this.name}`;
        return this._wrapAsValue(this._input.prop(key), name);
    }

    /**
     * Does this element have data with this key?
     * 
     * @param key 
     */
    public async hasData(key: string): Promise<Value> {
        return this._wrapAsValue(
            !(await this.getData(key)).isNull(),
            `${this.name} has data ${key}`
        );
    }

    /**
     * Get the data with this key in the element, or null
     * @param key 
     */
    public async getData(key: string): Promise<Value> {
        const name: string = `Data of ${this.name}`;
        return this._wrapAsValue(this._input.data(key), name);
    }

    /**
     * Get the value of this element, such as the value of an input field
     */
    public async getValue(): Promise<Value> {
        const name: string = `Value of ${this.name}`;
        return this._wrapAsValue(this._input.val(), name);
    }

    /**
     * Get the text content within the element
     */
    public async getText(): Promise<Value> {
        const name: string = `Text of ${this.name}`;
        return this._wrapAsValue(this._input.text(), name, this);
    }

    /**
     * Fill out the form with this data.
     * 
     * @param formData 
     */
    public async fillForm(formData: any): Promise<any> {
        const element: DOMElement = this;
        const isForm: boolean = await this._isFormTag();
        if (isForm) {
            const form: Cheerio = element._input;
            for (let name in formData) {
                const value = formData[name];
                form.find(`[name="${name}"]`).val(value);
            }
            return element;
        }
        else {
            throw new Error('This is not a form element.');
        }
    }

    /**
     * If this is a form element, submit the form
     */
    public async submit(): Promise<any>;
    public async submit(callback: Function): Promise<any>;
    public async submit(message: string, callback: Function): Promise<any>;
    public async submit(a?: string | Function, b?: Function): Promise<any> {
        if (!this._isFormTag()) {
            throw new Error('You can only use .submit() with a form element.');
        }
        const link: Link = await this._getLink();
        const scenario: Scenario = await this._createLambdaScenario(a, b);
        const method = ((await this._getAttribute('method')) || 'get').toString().toLowerCase();
        // If there is a URL we can submit the form to
        if (link.isNavigation()) {
            let uri: string;
            scenario.setMethod(method);
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
                scenario.setFormData(formData)
            }
            return await scenario.open(uri);
        }
        // Not a valid URL to submit form to
        else {
            return scenario.skip('Nothing to submit');
        }
    }

    /**
     * Click on this element and then load a new page. For HTML/DOM scenarios this creates a new scenario
     */
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
        // If this is a link tag, treat it the same as load
        if (await this._isLinkTag()) {
            return await this.load(message, callback);
        }
        // Is this a button?
        if (await this._isButtonTag()) {
            const type: Value = (await this.getAttribute('type'));
            if (type.isNull() || type.toString().toLowerCase() == 'submit') {
                // Grab the form and submit it
                const form = (<Cheerio>this._input).closest('form');
                const formEl = await DOMElement.create(form, this._context, `Parent form of ${this.name}`, this.path);
                return await formEl.submit(message, callback);
            }
            throw Error('This button did not have any action to submit.');
        }
        throw Error('This is not a clickable element.');
    }

    /**
     * Load the URL from this element if it has something to load
     * This is used to create a lambda scenario
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

    protected async _isFormTag(): Promise<boolean> {
        return (await this._getTagName()) == 'form';
    }

    protected async _isButtonTag(): Promise<boolean> {
        const tagName: string = await this._getTagName();
        const type: string | null = await this._getAttribute('type');
        return (
            tagName === 'button' ||
            (tagName === 'input' && (['button', 'submit', 'reset'].indexOf(String(type)) >= 0))
        );
    }

    protected async _isLinkTag(): Promise<boolean> {
        return (
            await this._getTagName() === 'a' &&
            await this._getAttribute('href') !== null
        );
    }

    protected async _isImageTag(): Promise<boolean> {
        return (
            await this._getTagName() === 'img' &&
            await this._getAttribute('src') !== null
        );
    }

    protected async _isVideoTag(): Promise<boolean> {
        const tagName: string = await this._getTagName();
        const src: string | null = await this._getAttribute('src');
        const type: string | null = await this._getAttribute('type');
        return (
            (tagName === 'video' && src !== null) ||
            (tagName === 'source' && src !== null && /video/i.test(type || ''))
        );
    }

    protected async _isAudioTag(): Promise<boolean> {
        const tagName: string = await this._getTagName();
        const src: string | null = await this._getAttribute('src');
        const type: string | null = await this._getAttribute('type');
        return (
            (tagName === 'audio' && src !== null) ||
            (tagName === 'bgsound' && src !== null) ||
            (tagName === 'source' && src !== null && /audio/i.test(type || ''))
        );
    }

    protected async _isScriptTag(): Promise<boolean> {
        return (
            await this._getTagName() === 'script' &&
            await this._getAttribute('src') !== null
        );
    }

    protected async _isStylesheetTag(): Promise<boolean> {
        return (
            await this._getTagName() === 'link' &&
            await this._getAttribute('href') !== null &&
            String(await this._getAttribute('rel')).toLowerCase() == 'stylesheet'
        );
    }

    protected async _isClickable(): Promise<boolean> {
        return (
            await this._isLinkTag() ||
            await this._isButtonTag()
        );
    }

    protected async _getUrl(): Promise<string | null> {
        const tagName: string = await this._getTagName();
        if (tagName !== null) {
            if (['img', 'script', 'video', 'audio', 'object', 'iframe'].indexOf(tagName) >= 0) {
                return this._getAttribute('src');
            }
            else if (['a', 'link'].indexOf(tagName) >= 0) {
                return this._getAttribute('href');
            }
            else if (['form'].indexOf(tagName) >= 0) {
                return this._getAttribute('action') || this._context.scenario.url;
            }
            else if (['source'].indexOf(tagName) >= 0) {
                return this._getAttribute('src');
            }
        }
        return null;
    }

    protected async _getLambdaScenarioType(): Promise<ResponseType> {
        if (
            (await this._isFormTag()) || (await this._isClickable())
        ) {
            // Assume if we are already in browser mode, we want to stay there
            return (this._context.scenario.responseType == ResponseType.browser) ?
                ResponseType.browser : ResponseType.html;
        }
        else if (await this._isImageTag()) {
            return ResponseType.image;
        }
        else if (await this._isStylesheetTag()) {
            return ResponseType.stylesheet;
        }
        else if (await this._isScriptTag()) {
            return ResponseType.script;
        }
        else if (await this._isVideoTag()) {
            return ResponseType.video
        }
        else {
            return ResponseType.resource;
        }
    }

    protected async _getLink(): Promise<Link> {
        const srcPath: string | null = await this._getUrl();
        return new Link(srcPath || '', this._context);
    }

    protected async _createLambdaScenario(a: any, b: any): Promise<Scenario> {
        const title: string = typeof a == 'string' ? a : this._path;
        const scenarioType: ResponseType = await this._getLambdaScenarioType(); 
        // Need a better way to do this
        const newScenarioIsBrowser: boolean = (
            scenarioType == ResponseType.browser ||
            scenarioType == ResponseType.extjs
        );
        const curScenarioIsBrowser: boolean = (
            this._context.scenario.responseType == ResponseType.browser ||
            this._context.scenario.responseType == ResponseType.extjs
        );
        // If we are changing from a browser type to non-browser type (or vice versa) options don't carry over
        const opts: any = ((newScenarioIsBrowser && curScenarioIsBrowser) || !newScenarioIsBrowser) ?
            this._context.scenario.requestOptions : {};
        // Create our new lambda scenario and apply the next callback
        const scenario: Scenario = this._context.suite.scenario(title, scenarioType, opts);
        scenario.next((function () {
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
        })());
        // Return it
        return scenario;
    }

    protected async _getTagName(): Promise<string> {
        return this._input.get(0).tagName.toLowerCase();
    }

    protected async _getAttribute(key: string): Promise<string | null> {
        return (typeof this._input.get(0).attribs[key] !== 'undefined') ?
            this._input.get(0).attribs[key] : null;
    }


}