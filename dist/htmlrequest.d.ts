import { Scenario } from "./scenario";
import { GenericRequest } from "./genericrequest";
import { Element } from "./element";
import { iResponse, SimplifiedResponse } from "./response";
export declare class HtmlRequest extends GenericRequest implements iResponse {
    private $;
    constructor(scenario: Scenario, url: string, response: SimplifiedResponse);
    select(path: string, findIn?: any): Element;
}
