import { iResponse, SimplifiedResponse } from "./index";
import { Scenario } from "./scenario";
import { GenericRequest } from "./genericrequest";
import { Element } from "./property";
export declare class HtmlRequest extends GenericRequest implements iResponse {
    private $;
    constructor(scenario: Scenario, url: string, response: SimplifiedResponse);
    select(path: string, findIn?: any): Element;
}
