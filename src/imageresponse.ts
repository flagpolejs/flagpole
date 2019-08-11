import { iResponse, GenericResponse, NormalizedResponse, ResponseType } from "./response";
import { Scenario } from "./scenario";
import { URL } from 'url';
import { Value } from './value';

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

    public get length(): Value {
        return this._wrapAsValue(this.imageProperties.length, 'Image Size');
    }

    public get url(): Value {
        return this._wrapAsValue(this.imageProperties.url, 'URL of Image');
    }

    public get path(): Value {
        return this._wrapAsValue(new URL(this.imageProperties.url).pathname, 'URL Path of Image');
    }

    public get type(): ResponseType {
        return ResponseType.image;
    }

    public get typeName(): string {
        return 'Image';
    }

    constructor(scenario: Scenario, response: NormalizedResponse) {
        super(scenario, response);
        this.imageProperties = JSON.parse(response.body);
        this.context.assert(
            'MIME Type matches expected value for an image',
            this.imageProperties.mime
        ).startsWith('image/');
    }

    public async evaluate(context: any, callback: Function): Promise<any> {
        throw new Error('Evaluate does not support images.');
    }

    public async asyncSelect(propertyName: string): Promise<Value> {
        return new Value(
            typeof this.imageProperties[propertyName] !== 'undefined' ?
                this.imageProperties[propertyName] :
                null,
            this.context,
            `${propertyName} of Image`
        )
    }

    public async asyncSelectAll(propertyName: string): Promise<Value[]> {
        const value: Value = await this.asyncSelect(propertyName);
        return value.isNull() ? [] : [value];
    }

}
