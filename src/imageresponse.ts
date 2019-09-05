import { ProtoResponse } from "./response";
import { ResponseType } from "./enums";
import { iResponse } from "./interfaces";
import { URL } from 'url';
import { Value } from './value';
import { HttpResponse } from './httpresponse';

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

export class ImageResponse extends ProtoResponse implements iResponse {

    protected imageProperties: ImageProperties = {
        width: 0,
        height: 0,
        type: '',
        mime: '',
        wUnits: '0',
        hUnits: '0',
        length: 0,
        url: ''
    };

    public get length(): Value {
        return this._wrapAsValue(this.imageProperties.length, 'Image Size');
    }

    public get url(): Value {
        return this._wrapAsValue(this.imageProperties.url, 'URL of Image');
    }

    public get path(): Value {
        return this._wrapAsValue(new URL(this.imageProperties.url).pathname, 'URL Path of Image');
    }

    public get responseType(): ResponseType {
        return ResponseType.image;
    }

    public get responseTypeName(): string {
        return 'Image';
    }

    public init(httpResponse: HttpResponse) {
        super.init(httpResponse);
        this.imageProperties = JSON.parse(httpResponse.body);
        this.context.assert(
            'MIME Type matches expected value for an image',
            this.imageProperties.mime
        ).startsWith('image/');
    }

    public async evaluate(context: any, callback: Function): Promise<any> {
        throw new Error('Evaluate does not support images.');
    }

    public async find(propertyName: string): Promise<Value> {
        return new Value(
            typeof this.imageProperties[propertyName] !== 'undefined' ?
                this.imageProperties[propertyName] :
                null,
            this.context,
            `${propertyName} of Image`
        )
    }

    public async findAll(propertyName: string): Promise<Value[]> {
        const value: Value = await this.find(propertyName);
        return value.isNull() ? [] : [value];
    }

}
