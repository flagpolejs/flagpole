import { ProtoValue, Value } from './value';
import { AssertionContext } from './assertioncontext';

interface iCSSPosition {
    line: number,
    column: number
}

interface iCSSDeclaration {
    type: string,
    property: string,
    value: string,
    start: iCSSPosition,
    end: iCSSPosition
}

export class CSSRule extends ProtoValue {

    protected _path: string;

    public get path(): string {
        return this._path;
    }

    public get name(): string {
        return this._name || this._path || 'CSS Rule';
    }

    public static create(input: any, context: AssertionContext, name: string, path: string): CSSRule {
        return new CSSRule(input, context, name, path);
    }

    private constructor(input: any, context: AssertionContext, name: string, path: string) {
        super(input, context, name);
        this._path = path || '';
    }

    public async hasProperty(key: string): Promise<Value> {
        return this._wrapAsValue(
            (await this.getProperty(key)) !== null,
            `${this.name} has property ${key}`
        );
    }

    public async getProperty(key: string): Promise<Value> {
        const declarations: iCSSDeclaration[] = this._getDeclarations();
        let value: string | null = null;
        declarations.some((declaration: iCSSDeclaration) => {
            if (declaration.property == key) {
                value = declaration.value;
                return true;
            }
            return false;
        });
        return new Value(value, this._context, `CSS Value of ${key} for ${this._path}`);
    }

    private _getSelectors(): string[] {
        return this._input.selectors ? this._input.selectors : [];
    }

    private _getDeclarations(): iCSSDeclaration[] {
        return this._input.declarations ? this._input.declarations : [];
    }


}