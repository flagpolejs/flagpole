import { Value, iValue } from './value';
import { AssertionContext } from './assertioncontext';
import { DOMElement, Flagpole, Scenario } from '.';
import { Link } from './link';

export class HTMLElement extends DOMElement implements iValue {

    protected _path: string;

    protected _input: Cheerio;

    public get $(): Cheerio {
        return this._input;
    }

    public static async create(input: any, context: AssertionContext, name: string | null = null, path?: string): Promise<HTMLElement> {
        const element = new HTMLElement(input, context, name, path);
        if (name === null) {
            const tagName: string | null = await element._getTagName();
            if (tagName !== null) {
                element._name = `<${tagName}> Element @ ${path}`;
            }
            else if (path) {
                element._name = String(path);
            }
        }
        element._sourceCode = (await element.getOuterHtml()).toString();
        return element;
    }

    protected constructor(input: any, context: AssertionContext, name?: string | null, path?: string) {
        super(input, context, (name || 'HTML Element'));
        this._path = path || '';
        this._input = input;
    }


    public async find(selector: string): Promise<HTMLElement | Value> {
        const element: Cheerio = await this.$.find(selector);
        const name: string = `${selector} under ${this.name}`;
        const path: string = `${this.path} ${selector}`;
        if (element !== null) {
            return HTMLElement.create(
                element, this._context, name, path
            );
        }
        return this._wrapAsValue(null, name, this);
    }

    public async findAll(selector: string): Promise<HTMLElement[]> {
        const elements: Cheerio = await this.$.find(selector)
        const out: HTMLElement[] = [];
        for (let i = 0; i < elements.length; i++) {
            out.push(
                await HTMLElement.create(
                    elements[i],
                    this._context,
                    `${selector}[${i}] under ${this.name}`,
                    `${this.path} ${selector}[${i}]`
                )
            );
        }
        return out;
    }

    public async getParent(): Promise<HTMLElement | Value> {
        const parent: Cheerio = this.$.parent();
        const name: string = `Parent of ${this.name}`;
        const path: string = `${this.path}[..]`;
        if (parent !== null) {
            return HTMLElement.create(
                parent, this._context, name, path
            );
        }
        return this._wrapAsValue(null, name, this);
    }

    public async getPreviousSibling(selector: string = '*'): Promise<HTMLElement | Value> {
        const siblings: Cheerio = await this.$.prev(selector);
        const name: string = `Previous Sibling of ${this.name}`;
        const path: string = `${this.path}[preceding-sibling::${selector}][0]`;
        if (siblings.length > 0) {
            return HTMLElement.create(
                siblings[0], this._context, name, path
            );
        }
        return this._wrapAsValue(null, name, this);
    }

    public async getPreviousSiblings(selector: string = '*'): Promise<HTMLElement[]> {
        const siblingElements: Cheerio = await this.$.prevAll(selector);
        const siblings: HTMLElement[] = [];
        for (let i = 0; i < siblingElements.length; i++) {
            siblings.push(
                await HTMLElement.create(
                    siblingElements[i],
                    this._context,
                    `Previous Sibling ${i} of ${this.name}`,
                    `${this.path}[preceding-sibling::${selector}][${i}]`
                )
            );
        }
        return siblings;
    }

    public async getNextSibling(selector: string = '*'): Promise<HTMLElement | Value> {
        const siblings: Cheerio = await this.$.next(selector);
        const name: string = `Next Sibling of ${this.name}`;
        const path: string = `${this.path}[following-sibling::${selector}][0]`;
        if (siblings.length > 0) {
            return HTMLElement.create(
                siblings[0], this._context, name, path
            );
        }
        return this._wrapAsValue(null, name, this);
    }

    public async getNextSiblings(selector: string = '*'): Promise<HTMLElement[]> {
        const siblingElements: Cheerio = await this.$.nextAll(selector);
        const siblings: HTMLElement[] = [];
        for (let i = 0; i < siblingElements.length; i++) {
            siblings.push(
                await HTMLElement.create(
                    siblingElements[i],
                    this._context,
                    `Next Sibling ${i} of ${this.name}`,
                    `${this.path}[following-sibling::${selector}][${i}]`
                )
            );
        }
        return siblings;
    }

    /**
     * Click on this element and then load a new page. For HTML/DOM scenarios this creates a new scenario
     */
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
        // If this is a link tag, treat it the same as load
        if (await this._isLinkTag()) {
            this.load(message, callback);
        }
        // Is this a button?
        else if (await this._isButtonTag()) {
            const type: Value = (await this.getAttribute('type'));
            if (type.isNull() || type.toString().toLowerCase() == 'submit') {
                // Grab the form and submit it
                const form = (<Cheerio>this._input).closest('form');
                const formEl = await HTMLElement.create(form, this._context, `Parent form of ${this.name}`, this.path);
                formEl.submit(message, callback);
            }
        }
        this._completedAction('CLICK');
    }

    /**
     * Fill out the form with this data.
     * 
     * @param formData 
     */
    public async fillForm(formData: any): Promise<void> {
        if (!(await this._isFormTag())) {
            throw new Error('This is not a form element.');
        }
        const form: Cheerio = this._input;
        for (let name in formData) {
            const value = formData[name];
            form.find(`[name="${name}"]`).val(value);
        }
        this._completedAction('FILL');
    }

    /**
     * If this is a form element, submit the form
     */
    public async submit(): Promise<void>;
    public async submit(callback: Function): Promise<void>;
    public async submit(message: string, callback: Function): Promise<void>;
    public async submit(a?: string | Function, b?: Function): Promise<void> {
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
            scenario.open(uri);
            this._completedAction('SUBMIT');
        }
        // Not a valid URL to submit form to
        else {
            scenario.skip('Nothing to submit');
        }
    }


}