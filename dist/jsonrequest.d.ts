import { iResponse, SimplifiedResponse } from "./index";
import { Scenario } from "./scenario";
import { GenericRequest } from "./genericrequest";
import { Element } from "./property";
export declare class JsonRequest extends GenericRequest implements iResponse {
    protected json: {};
    constructor(scenario: Scenario, url: string, response: SimplifiedResponse);
    select(path: string, findIn?: any): Element;
}
