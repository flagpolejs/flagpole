import { iResponse } from "./response";
export declare class Link {
    protected response: iResponse;
    protected uri: string;
    constructor(response: iResponse, uri: string);
    getUri(queryString?: any): string;
    isValidDataUri(): boolean;
    isData(): boolean;
    isAnchor(): boolean;
    isEmail(): boolean;
    isPhone(): boolean;
    isTextMessage(): boolean;
    isGeo(): boolean;
    isScript(): boolean;
    isAppStore(): boolean;
    isFtp(): boolean;
    isNonNavigation(): boolean;
    isNavigation(): boolean;
}
