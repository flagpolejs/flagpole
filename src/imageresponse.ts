import { iResponse, GenericResponse, NormalizedResponse, ResponseType } from "./response";
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

    constructor(scenario: Scenario, response: NormalizedResponse) {
        super(scenario, response);
        this.imageProperties = JSON.parse(response.body);
        this.label('MIME Type matches expected value for an image')
            .select('mime').startsWith('image/');
    }

    public get typeName(): string {
        return 'Image';
    }

    public select(propertyName: string): Node {
        let image: ImageResponse = this;
        let value: any = typeof this.imageProperties[propertyName] !== 'undefined' ?
            this.imageProperties[propertyName] : null;
        return new Node(this, propertyName, value);
    }

    public async evaluate(context: any, callback: Function): Promise<any> {
        throw new Error('Evaluate does not support images.');
    }

    public async asyncSelect(propertyName: string): Promise<any> {
        return typeof this.imageProperties[propertyName] !== 'undefined' ?
            this.imageProperties[propertyName] :
            null;
    }

    public async asyncSelectAll(propertyName: string): Promise<any[]> {
        return typeof this.imageProperties[propertyName] !== 'undefined' ?
            [ this.imageProperties[propertyName] ] :
            [];
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
