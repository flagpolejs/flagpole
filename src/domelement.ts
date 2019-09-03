import { ProtoValue, Value, iValue } from './value';
import { Link } from './link';
import { Scenario } from './scenario';
import { ResponseType } from './response';
import { AssertionContext } from './assertioncontext';
import { AssertionActionCompleted, AssertionActionFailed } from './logging/assertionresult';
import { Flagpole } from '.';

export abstract class DOMElement extends ProtoValue implements iValue {

    protected _path: string;
    protected _tagName: string = '';

    public get path(): string {
        return this._path;
    }

    public get name(): string {
        return this._name || this._path || 'DOM Element';
    }

    public get tagName(): string {
        return this._tagName;
    }

    protected constructor(input: any, context: AssertionContext, name?: string | null, path?: string) {
        super(input, context, (name || 'DOM Element'));
        this._path = path || '';
    }

    public abstract async click(a?: string | Function, b?: Function): Promise<void>
    public abstract async fillForm(formData: any): Promise<void>
    public abstract async submit(a?: string | Function, b?: Function): Promise<void>
    public abstract async find(selector: string): Promise<iValue | null>
    public abstract async findAll(selector: string): Promise<iValue[]>

    protected abstract async _getTagName(): Promise<string> 
    protected abstract async _getAttribute(key: string): Promise<string | null>

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
        return this._wrapAsValue(this.tagName, `Tag Name of ${this.name}`);
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
            `${this.name} has attribute ${key}`,
            this
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
        return this._wrapAsValue(attr, name, this, `${key}="${attr}"`);
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
            this._context.addSubScenario(scenario, link);
        }
        else {
            scenario.skip('Not a navigational link');
        }
        this._completedAction('LOAD');
        return scenario;
    }

    protected async _isFormTag(): Promise<boolean> {
        return (await this.tagName) == 'form';
    }

    protected async _isButtonTag(): Promise<boolean> {
        const type: string | null = await this._getAttribute('type');
        return (
            this.tagName === 'button' ||
            (this.tagName === 'input' && (['button', 'submit', 'reset'].indexOf(String(type)) >= 0))
        );
    }

    protected async _isLinkTag(): Promise<boolean> {
        return (
            await this.tagName === 'a' &&
            await this._getAttribute('href') !== null
        );
    }

    protected async _isImageTag(): Promise<boolean> {
        return (
            await this.tagName === 'img' &&
            await this._getAttribute('src') !== null
        );
    }

    protected async _isVideoTag(): Promise<boolean> {
        const src: string | null = await this._getAttribute('src');
        const type: string | null = await this._getAttribute('type');
        return (
            (this.tagName === 'video' && src !== null) ||
            (this.tagName === 'source' && src !== null && /video/i.test(type || ''))
        );
    }

    protected async _isAudioTag(): Promise<boolean> {
        const src: string | null = await this._getAttribute('src');
        const type: string | null = await this._getAttribute('type');
        return (
            (this.tagName === 'audio' && src !== null) ||
            (this.tagName === 'bgsound' && src !== null) ||
            (this.tagName === 'source' && src !== null && /audio/i.test(type || ''))
        );
    }

    protected async _isScriptTag(): Promise<boolean> {
        return (
            await this.tagName === 'script' &&
            await this._getAttribute('src') !== null
        );
    }

    protected async _isStylesheetTag(): Promise<boolean> {
        return (
            await this.tagName === 'link' &&
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
        if (this.tagName !== null) {
            if (['img', 'script', 'video', 'audio', 'object', 'iframe'].indexOf(this.tagName) >= 0) {
                return await this._getAttribute('src');
            }
            else if (['a', 'link'].indexOf(this.tagName) >= 0) {
                return await this._getAttribute('href');
            }
            else if (['form'].indexOf(this.tagName) >= 0) {
                return await this._getAttribute('action') || this._context.scenario.url;
            }
            else if (['source'].indexOf(this.tagName) >= 0) {
                return await this._getAttribute('src');
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

    protected async _completedAction(verb: string, noun?: string) {
        this._context.scenario.result(
            new AssertionActionCompleted(verb, noun || this.name)
        );
    }

    protected async _failedAction(verb: string, noun?: string) {
        this._context.scenario.result(
            new AssertionActionFailed(verb, noun || this.name)
        );
    }


}