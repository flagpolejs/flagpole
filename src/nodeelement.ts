import { ProtoValue } from './value';
import { JSHandle } from 'puppeteer';
import { Flagpole } from '.';

export class NodeElement extends ProtoValue {

    public async isFormTag(): Promise<boolean> {
        if (this.isCheerioElement() || this.isPuppeteerElement()) {
            return await this.getTagName() === 'form';
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

    public async fillForm(formData: any): Promise<any> {
        const isForm: boolean = await this.isFormTag();
        return new Promise((resolve, reject) => {
            if (isForm) {
                if (this.isCheerioElement()) {
                    for (let name in formData) {
                        const value = formData[name];
                        // TODO: Fill in the child values 
                    }
                }
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
            return new NodeElement((<Cheerio>this._input).next(selector), this._context);
        }
        return null;
    }

    public async getPrevious(selector?: string): Promise<NodeElement | null> {
        if (this.isCheerioElement()) {
            return new NodeElement((<Cheerio>this._input).prev(selector), this._context);
        }
        return null;
    }

    public async getSiblings(selector?: string): Promise<NodeElement | null> {
        if (this.isCheerioElement()) {
            return new NodeElement((<Cheerio>this._input).siblings(selector), this._context);
        }
        return null;
    }

    public async getClosest(selector?: string): Promise<NodeElement | null> {
        if (this.isCheerioElement()) {
            if (typeof selector != 'undefined') {
                return new NodeElement((<Cheerio>this._input).closest(selector), this._context);
            }
        }
        return null;
    }

    public async getParent(selector?: string): Promise<NodeElement | null> {
        if (this.isCheerioElement()) {
            return new NodeElement((<Cheerio>this._input).parent(selector), this._context);
        }
        return null;
    }

}