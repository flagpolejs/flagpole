import { Flagpole } from "./index";
import { Scenario } from "./scenario";
import { iResponse, NormalizedResponse, GenericResponse, ResponseType } from "./response";
import { DOMElement } from './domelement';
import { AssertionContext } from './assertioncontext';

let cheerio: CheerioAPI = require('cheerio');
let $: CheerioStatic;

export class HtmlResponse extends GenericResponse implements iResponse {

    public get typeName(): string {
        return 'HTML';
    }

    public get type(): ResponseType {
        return ResponseType.html;
    }

    constructor(scenario: Scenario, response: NormalizedResponse) {
        super(scenario, response);
        $ = cheerio.load(response.body);
    }

    public getRoot(): CheerioStatic {
        return $;
    }

    public async evaluate(context: any, callback: Function): Promise<any> {
        return callback.apply(context, [ $ ]);
    }

    public async asyncSelect(path: string): Promise<DOMElement | null> {
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

    public async asyncSelectAll(path: string): Promise<DOMElement[]> {
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

}
