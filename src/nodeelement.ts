import { ProtoValue } from './value';
import { JSHandle, Page, ElementHandle } from 'puppeteer';
import { Flagpole } from '.';
import { Link } from './link';
import { Scenario } from './scenario';
import { ResponseType, iResponse } from './response';
import { AssertionContext } from './assertioncontext';

export class NodeElement extends ProtoValue {

    protected _path: string;

    constructor(input: any, context: AssertionContext, path?: string) {
        super(input, context);
        this._path = path || '';
    }

    public async isFormTag(): Promise<boolean> {
        if (this.isCheerioElement() || this.isPuppeteerElement()) {
            return (await this.getTagName()) == 'form';
        }
        return false;
    }

    public async isButtonTag(): Promise<boolean> {
        if (this.isCheerioElement() || this.isPuppeteerElement()) {
            const tagName = await this.getTagName();
            const type = await this.getAttribute('type');
            return (
                tagName === 'button' ||
                (tagName === 'input' && (['button', 'submit', 'reset'].indexOf(type) >= 0))
            );
        }
        return false;
    }

    public async isLinkTag(): Promise<boolean> {
        if (this.isCheerioElement() || this.isPuppeteerElement()) {
            return (
                await this.getTagName() === 'a' &&
                await this.getAttribute('href') !== null
            );
        }
        return false;
    }

    public async isImageTag(): Promise<boolean> {
        if (this.isCheerioElement() || this.isPuppeteerElement()) {
            return (
                await this.getTagName() === 'img' &&
                await this.getAttribute('src') !== null
            );
        }
        return false;
    }

    public async isVideoTag(): Promise<boolean> {
        if (this.isCheerioElement() || this.isPuppeteerElement()) {
            const tagName = await this.getTagName();
            const src = await this.getAttribute('src');
            const type = await this.getAttribute('type');
            return (
                (tagName === 'video' && src !== null) ||
                (tagName === 'source' && src !== null && /video/i.test(type || ''))
            );
        }
        return false;
    }

    public async isAudioTag(): Promise<boolean> {
        if (this.isCheerioElement() || this.isPuppeteerElement()) {
            const tagName = await this.getTagName();
            const src = await this.getAttribute('src');
            const type = await this.getAttribute('type');
            return (
                (tagName === 'audio' && src !== null) ||
                (tagName === 'bgsound' && src !== null) ||
                (tagName === 'source' && src !== null && /audio/i.test(type || ''))
            );
        }
        return false;
    }

    public async isScriptTag(): Promise<boolean> {
        if (this.isCheerioElement() || this.isPuppeteerElement()) {
            return (
                await this.getTagName() === 'script' &&
                await this.getAttribute('src') !== null
            );
        }
        return false;
    }

    public async isStylesheetTag(): Promise<boolean> {
        if (this.isCheerioElement() || this.isPuppeteerElement()) {
            return (
                await this.getTagName() === 'link' &&
                await this.getAttribute('href') !== null &&
                (await this.getAttribute('rel')).toLowerCase() == 'stylesheet'
            );
        }
        return false;
    }

    public async isClickable(): Promise<boolean> {
        return (
            await this.isLinkTag() ||
            await this.isButtonTag()
        );
    }

    public async getUrl(): Promise<string | null> {
        const tagName = await this.getTagName();
        if (this.isCheerioElement() || this.isPuppeteerElement()) {
            if (tagName !== null) {
                if (['img', 'script', 'video', 'audio', 'object', 'iframe'].indexOf(tagName) >= 0) {
                    return this.getAttribute('src');
                }
                else if (['a', 'link'].indexOf(tagName) >= 0) {
                    return this.getAttribute('href');
                }
                else if (['form'].indexOf(tagName) >= 0) {
                    return this.getAttribute('action') || this._context.scenario.getUrl();
                }
            }
        }
        else if (this.isString()) {
            return this.toString().trim().replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '');
        }
        return null;
    }

    public async getClassName(): Promise<boolean> {
        if (this.isCheerioElement()) {
            return (typeof this._input.get(0).attribs['class'] !== 'undefined') ?
                this._input.get(0).attribs['class'] : null;
        }
        else if (this.isPuppeteerElement()) {
            const classHandle: JSHandle = await this._input.getProperty('className');
            return await classHandle.jsonValue();
        }
        return false;
    }

    public async hasClassName(className: string): Promise<boolean> {
        if (this.isCheerioElement()) {
            return this._input.hasClass(className)
        }
        else if (this.isPuppeteerElement()) {
            const classHandle: JSHandle = await this._input.getProperty('className');
            const classString: string = await classHandle.jsonValue();
            return (classString.split(' ').indexOf(className) >= 0)
        }
        return false;
    }

    public async getTagName(): Promise<string | null> {
        if (this.isCheerioElement()) {
            return this._input.get(0).tagName.toLowerCase();
        }
        else if (this.isPuppeteerElement()) {
            const handle: JSHandle = await this._input.getProperty('tagName');
            return String(await handle.jsonValue()).toLowerCase();
        }
        return null;
    }

    public async hasAttribute(key: string): Promise<boolean> {
        return (await this.getAttribute(key)) !== null;
    }

    public async getAttribute(key: string): Promise<any> {
        if (this.isCheerioElement()) {
            return (typeof this._input.get(0).attribs[key] !== 'undefined') ?
                this._input.get(0).attribs[key] : null;
        }
        else if (this.isPuppeteerElement()) {
            const handle: JSHandle = await this._input.getProperty(key);
            return await handle.jsonValue();
        }
        else if (!this.isNullOrUndefined() && this.hasProperty(key)) {
            return this._input[key];
        }
        return null;
    }

    public async getProperty(key: string): Promise<any> {
        let text: any;
        if (this.isCheerioElement()) {
            return this._input.prop(key);
        }
        else if (this.isPuppeteerElement()) {
            const handle: JSHandle = await this._input.getProperty(key);
            return await handle.jsonValue();
        }
        else if (!this.isNullOrUndefined() && this.hasProperty(key)) {
            return this._input[key];
        }
        return null;
    }

    public async hasData(key: string): Promise<boolean> {
        return (await this.getData(key)) !== null;
    }

    public async getData(key: string): Promise<any> {
        let text: any;
        if (this.isCheerioElement()) {
            return this._input.data(key);
        }
        else if (this.isPuppeteerElement()) {
            const handle: JSHandle = await this._input.getProperty(key);
            return await handle.jsonValue();
        }
        else if (!this.isNullOrUndefined() && this.hasProperty(key)) {
            return this._input[key];
        }
        return null;
    }

    public async getValue(): Promise<any> {
        let text: any;
        if (this.isCheerioElement()) {
            return this._input.val();
        }
        else if (this.isPuppeteerElement()) {
            const handle: JSHandle = await this._input.getProperty('value');
            return await handle.jsonValue();
        }
        else if (!this.isNullOrUndefined()) {
            return this._input;
        }
        return null;
    }

    public async getText(): Promise<string | null> {
        let text: any;
        if (this.isCheerioElement()) {
            return this._input.text();
        }
        else if (this.isPuppeteerElement()) {
            const handle: JSHandle = await this._input.getProperty('textContent');
            return await handle.jsonValue();
        }
        else if (!this.isNullOrUndefined()) {
            return this._input;
        }
        return null;
    }

    /**
     * Fill out the form with this data.
     * TODO: This method is only partially working, needs more testing and to be completed.
     * 
     * @param formData 
     */
    public async fillForm(formData: any): Promise<any> {
        const element: NodeElement = this;
        const isForm: boolean = await this.isFormTag();
        return new Promise(async function(resolve, reject) {
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
                resolve(element);
            }
            else {
                reject('This is not a form element.');
            }
        });
    }

    public async getChildren(selector?: string): Promise<NodeElement[]> {
        if (this.isCheerioElement()) {
            return this._input.children(selector);
        }
        return [];
    }

    public async getNext(selector?: string): Promise<NodeElement | null> {
        if (this.isCheerioElement()) {
            return new NodeElement((<Cheerio>this._input).next(selector), this._context, selector);
        }
        return null;
    }

    public async getPrevious(selector?: string): Promise<NodeElement | null> {
        if (this.isCheerioElement()) {
            return new NodeElement((<Cheerio>this._input).prev(selector), this._context, selector);
        }
        return null;
    }

    public async getSiblings(selector?: string): Promise<NodeElement | null> {
        if (this.isCheerioElement()) {
            return new NodeElement((<Cheerio>this._input).siblings(selector), this._context, selector);
        }
        return null;
    }

    public async getClosest(selector?: string): Promise<NodeElement | null> {
        if (this.isCheerioElement()) {
            if (typeof selector != 'undefined') {
                return new NodeElement((<Cheerio>this._input).closest(selector), this._context, selector);
            }
        }
        return null;
    }

    public async getParent(selector?: string): Promise<NodeElement | null> {
        if (this.isCheerioElement()) {
            return new NodeElement((<Cheerio>this._input).parent(selector), this._context, selector);
        }
        return null;
    }

    /**
     * Load the URL from this NodeElement if it has something to load
     * This is used to create a lambda scenario
     * 
     * @param a 
     */
    public async load(a?: string | Function, b?: Function): Promise<Scenario> {
        const element: NodeElement = this;
        const srcPath: string | null = await element.getUrl();
        const link: Link = new Link(element._context.response, srcPath || '');
        const title: string = typeof a == 'string' ? a : `Load ${srcPath}`;
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
        const scenario: Scenario = element._context.suite.Scenario(title);
        // Is this link one that we can actually load?
        if (link.isNavigation()) {
            const scenarioType: string = await element.getLambdaScenarioType();
            const uri: string = link.getUri();
            // Get the options or just pass the default
            const opts: any = (
                (scenarioType == 'browser' && element._context.scenario.responseType == ResponseType.browser) ||
                scenarioType != 'browser'
            ) ? element._context.scenario.getRequestOptions() : {};
            // Initialize the scenario
            scenario[scenarioType](opts);
            // Set our callback
            scenario.next(callback);
            // Done. Execute it asynchronously
            setTimeout(() => {
                scenario.open(uri);
            }, 1);
        }
        else {
            scenario.skip('Not a navigational link');
        }
        return scenario;
    }

    public async getLambdaScenarioType(): Promise<string> {
        if (
            (await this.isFormTag()) || (await this.isClickable())
        ) {
            // Assume if we are already in browser mode, we want to stay there
            return (this._context.scenario.responseType == ResponseType.browser) ?
                'browser' : 'html';
        }
        else if (await this.isImageTag()) {
            return 'image';
        }
        else if (await this.isStylesheetTag()) {
            return 'stylesheet';
        }
        else if (await this.isScriptTag()) {
            return 'script';
        }
        else if (await this.isVideoTag()) {
            return 'video'
        }
        else {
            return 'resource';
        }
    }

}