import { URL } from 'url';
import { iResponse } from "./response";
import { Flagpole } from ".";
import { AssertionContext } from './assertioncontext';

const isValidDataUrl = require('valid-data-url');

export class Link {

    protected _context: AssertionContext;
    protected _uri: string;

    constructor(uri: string, context: AssertionContext) {
        this._uri = uri;
        this._context = context;
    }

    /**
     * Get full URL including host, optionally add query string
     * 
     * @param queryString 
     */
    public getUri(queryString?: any): string {
        const baseUrl: URL = new URL(
            this._context.suite.buildUrl(this._context.scenario.getUrl() || '')
        );
        const thisUrl: URL = new URL(this._uri, baseUrl.href);
        if (typeof queryString != 'undefined') {
            const type: string = Flagpole.toType(queryString);
            if (type == 'object') {
                for (let key in queryString) {
                    thisUrl.searchParams.append(key, queryString[key]);
                }
            }
            else if (type == 'array') {
                queryString.forEach(item => {
                    thisUrl.searchParams.append(item.name, item.value);
                });
            }
        }
        return thisUrl.href;
    }

    public isValidDataUri(): boolean {
        return isValidDataUrl(this._uri);
    }

    public isData(): boolean {
        return (/^data:/.test(this._uri));
    }

    public isAnchor(): boolean {
        return /^#/.test(this._uri);
    }

    public isEmail(): boolean {
        return /^mailto:/.test(this._uri)
    }

    public isPhone(): boolean {
        return /^(tel|callto|wtai):/.test(this._uri);
    }

    public isTextMessage(): boolean {
        return /^(sms|mms):/.test(this._uri);
    }

    public isGeo(): boolean {
        return /^(geo|geopoint):/.test(this._uri);
    }

    public isScript(): boolean {
        return /^(javascript):/.test(this._uri);
    }

    public isAppStore(): boolean {
        return /^(market|itms|itms-apps):/.test(this._uri);
    }

    public isFtp(): boolean {
        return /^(ftp):/.test(this._uri);
    }

    /*
    public isNonNavigation(): boolean {
        return (
            /^(gopher|archie|veronica|telnet|file|nntp|news|irc|spdy|rtmp|rtp|tcp|udp):\/\//i.test(this.uri)
        );
    }
    */

    public isNavigation(): boolean {
        return (
            this._uri.length > 0 &&
            !this.isAnchor() &&
            (
                /^\?/.test(this._uri) ||                // Starts with a question mark
                /^https?:\/\//i.test(this._uri) ||      // Starts with http:// or https://
                /^\//i.test(this._uri)                  // Starts with as slash
            )
        );
    }

}