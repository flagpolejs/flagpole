import { Flagpole } from '.';


export interface iAssertionSchema {
    [key: string]: string | any[] | iAssertionSchemaItem
}

export interface iAssertionSchemaTestOpts {
    key: string,
    parent: any,
    root: any
}

export interface iAssertionSchemaItem {
    type?: string | string[],
    items?: iAssertionSchema | string,
    enum?: any[],
    matches?: RegExp | string,
    test: (value: any, opts: iAssertionSchemaTestOpts) => boolean
}

export class AssertionSchema {

    protected _schema: iAssertionSchema;
    protected _lastError: string | null = null;
    protected _root: any = null;

    public get lastError(): string | null {
        return this._lastError;
    }

    constructor(schema: iAssertionSchema, root: any) {
        this._schema = schema;
        this._root = root;
    }

    public validate(): Promise<boolean> {
        this._lastError = null;
        return new Promise((resolve) => {
            let bool: boolean = true;
            if (Flagpole.toType(this._root) == 'object') {
                bool = this._isValid(this._root, this._schema);
            }
            resolve(bool);
        });
    }

    protected _matchesType(key: string, docItem: any, schemaItem: any): boolean {
        const schemaItemType = Flagpole.toType(schemaItem);
        const docItemType = Flagpole.toType(docItem);
        // If schema item is a string, then it's defining type
        if (schemaItemType == 'string') {
            if (docItemType != schemaItem) {
                this._lastError = `typeOf ${key} was ${docItemType}, which did not match ${schemaItem}`;
                return false;
            }
        }
        // If the type is an array, then it's an array of allowed types
        else if (schemaItemType == 'array') {
            const allowedTypes: string[] = schemaItem;
            if (allowedTypes.indexOf(docItemType) < 0) {
                this._lastError = `typeOf ${key} was ${docItemType}, which did not match ${allowedTypes.join(' | ')}`;
                return false;
            }
        }
        return true;
    }

    protected _isValid(document: any, schema: any): boolean {
        return Object.keys(schema).every((key) => {
            const schemaItem = schema[key];
            const docItem = document[key];
            const schemaItemType: string = Flagpole.toType(schemaItem);
            const docItemType: string = Flagpole.toType(docItem);
            // If document does not contain this item
            if (docItemType == 'undefined' && schemaItem) {
                // If this as optional, skip it
                if (schemaItem.optional) {
                    return true;
                }
                // Otherwise, its non-existance is a violation
                this._lastError  = `${key} was undefined`;
                return false;
            }
            // If it's either a string or array, we're testing the type
            if (schemaItemType == 'string' || schemaItemType == 'array') {
                if (!this._matchesType(key, docItem, schemaItem)) {
                    return false;
                }
            }
            // If schema item is an object, then we do more complex parsing
            else if (schemaItemType == 'object') {
                // type
                if (schemaItem.type) {
                    if (!this._matchesType(key, docItem, schemaItem.type)) {
                        return false;
                    }
                }
                // enum
                if (Flagpole.toType(schemaItem.enum) == 'array') {
                    // Value must be in this array
                    if ((schemaItem.enum as any[]).indexOf(docItem) < 0) {
                        this._lastError  = `${key}'s value ${docItem} is not in enum ${schemaItem.enum.join(', ')}`
                        return false;
                    }
                }
                // matches
                if (schemaItem.matches) {
                    // Value must match this regex
                    if (!(new RegExp(schemaItem.matches).test(String(docItem)))) {
                        this._lastError  = `${key}'s value ${docItem} did not match ${String(schemaItem.matches)}`
                        return false;
                    }
                }
                // test
                if (Flagpole.toType(schemaItem.test) == 'function') {
                    // Function must return true
                    let opts: iAssertionSchemaTestOpts = {
                        key: key,
                        parent: document,
                        root: this._root
                    }
                    if (!schemaItem.test(docItem, opts)) {
                        this._lastError  = `${key} did not pass the test`
                        return false;
                    }
                }
                // items
                if (Flagpole.toType(schemaItem.items) == 'object') {
                    // If this item is an array, loop through each subItem and make sure it matches
                    if (docItemType == 'array') {
                        return (docItem as Array<any>).every((subItem) => {
                            // If it's a string, just validate the type of each item
                            if (typeof schemaItem.items == 'string') {
                                return Flagpole.toType(subItem) == schemaItem.items;
                            }
                            // Otherwise, validate that array item against the "every" sub-schema
                            return this._isValid(subItem, schemaItem.items);
                        });
                    }
                    // If this item is an object, loop through each property and make sure it matches
                    else if (docItemType == 'object') {
                        return Object.keys(docItem).every((key) => {
                            // If it's a string, just validate the type of each item
                            if (typeof schemaItem.items == 'string') {
                                return Flagpole.toType(docItem[key]) == schemaItem.items;
                            }
                            return this._isValid(docItem[key], schemaItem.items);
                        })
                    }
                    else {
                        this._lastError = `${key} was not an array nor an object, so can't loop through its items.`;
                        return false;
                    }
                }
            }
            // Fallback to true, probably invalid schema item
            return true;
        });
    }

}