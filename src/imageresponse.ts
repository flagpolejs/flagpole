import { iResponse, GenericResponse, SimplifiedResponse, ResponseType } from "./response";
import { Scenario } from "./scenario";
import { Node } from "./node";
import { URL } from 'url';

export interface ImageProperties {
    width: number,
    height: number,
    type: string,
    mime: string,
    wUnits: string,
    hUnits: string,
    length: number,
    url: string
};    

export class ImageResponse extends GenericResponse implements iResponse {

    protected imageProperties: ImageProperties;

    constructor(scenario: Scenario, url: string, response: SimplifiedResponse) {
        super(scenario, url, response);
        this.imageProperties = JSON.parse(response.body);
        this.label('MIME Type matches expected value for an image')
            .select('mime').startsWith('image/');
    }

    public select(propertyName: string): Node {
        let image: ImageResponse = this;
        let value: any = typeof this.imageProperties[propertyName] !== 'undefined' ?
            this.imageProperties[propertyName] : null;
        return new Node(this, propertyName, value);
    }

    public getType(): ResponseType {
        return ResponseType.image;
    }

    public length(): Node {
        return new Node(this, 'Size of image', this.imageProperties.length);
    }

    public url(): Node {
        return new Node(this, 'URL of image', this.imageProperties.url);
    }

    public path(): Node {
        return new Node(this, 'Path', new URL(this.imageProperties.url).pathname);
    }

}
