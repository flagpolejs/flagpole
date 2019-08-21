import { ProtoResponse, iResponse, ResponseType  } from "./response";
import { DOMElement } from './domelement';
import { HttpResponse } from '.';

let cheerio: CheerioAPI = require('cheerio');
let $: CheerioStatic;

export class HtmlResponse extends ProtoResponse implements iResponse {

    public get typeName(): string {
        return 'HTML';
    }

    public get type(): ResponseType {
        return ResponseType.html;
    }

    public init(httpResponse: HttpResponse) {
        super.init(httpResponse);
        $ = cheerio.load(httpResponse.body);
    }

    public getRoot(): CheerioStatic {
        return $;
    }

    public async evaluate(context: any, callback: Function): Promise<any> {
        return callback.apply(context, [ $ ]);
    }

    public async find(path: string): Promise<DOMElement | null> {
        const selection: Cheerio = $(path);
        if (selection.length > 0) {
            return await DOMElement.create(
                selection.eq(0), this.context, null, path
            );
        }
        else {
            return null;
        }
    }

    public async findAll(path: string): Promise<DOMElement[]> {
        const response: iResponse = this;
        const elements: Cheerio = $(path);
        if (elements.length > 0) {
            const nodeElements: DOMElement[] = [];
            await elements.each(async function (i: number) {
                nodeElements.push(
                    await DOMElement.create(
                        $(elements.get(i)), response.context, `${path} [${i}]`, path
                    )
                );
            });
            return nodeElements;
        }
        else {
            return [];
        }
    }

    public async waitForHidden(selector: string, timeout: number = 100): Promise<DOMElement | null> {
        return this.find(selector);
    }

    public async waitForVisible(selector: string, timeout: number = 100): Promise<DOMElement | null> {
        return this.find(selector);
    }

    public async waitForExists(selector: string, timeout: number = 100): Promise<DOMElement | null> {
        return this.find(selector);
    }

    public async typeText(selector: string, textToType: string, opts: any = {}): Promise<any> {
        return await this.evaluate(this, function ($) {
            let currentValue = $(selector).val();
            $(selector).val(currentValue + textToType);
        });
    }

    public async clearValue(selector: string): Promise<any> {
        return await this.evaluate(this, function ($: Cheerio) {
            $.find(selector).val('');
        });
    }

}
