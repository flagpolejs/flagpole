

export interface iAssertionSchema {
    [key: string]: string | any[] | iAssertionSchemaItem
}

export interface iAssertionSchemaItem {
    type?: string | string[],
    items?: iAssertionSchema | string,
    enum?: any[],
    matches?: RegExp | string
}
