import { iResponse, GenericResponse, SimplifiedResponse, ResponseType } from "./response";
import { Scenario } from "./scenario";
import { Node } from "./node";
export interface ImageProperties {
    width: number;
    height: number;
    type: string;
    mime: string;
    wUnits: string;
    hUnits: string;
    length: number;
    url: string;
}
export declare class ImageResponse extends GenericResponse implements iResponse {
    protected imageProperties: ImageProperties;
    constructor(scenario: Scenario, url: string, response: SimplifiedResponse);
    select(propertyName: string): Node;
    getType(): ResponseType;
    length(): Node;
    url(): Node;
    path(): Node;
}
