import { Scenario } from "./scenario";
import { iResponse } from "./response";
import { Flagpole } from ".";

const isValidDataUrl = require('valid-data-url');

export class Link {

    protected response: iResponse;
    protected uri: string;

    constructor(response: iResponse, uri: string) {
        this.response = response;
        this.uri = uri;
    }

    public getUri(queryString?: any): string {
        let baseUrl: URL = new URL(this.response.scenario.suite.buildUrl(this.response.scenario.getUrl() || ''));
        let thisUrl: URL = new URL(this.uri, baseUrl.href);
        if (queryString) {
            let type: string = Flagpole.toType(queryString);
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
        return isValidDataUrl(this.uri);
    }

    public isData(): boolean {
        return (this.uri.startsWith('data:'));
    }

    public isAnchor(): boolean {
        return this.uri.startsWith('#');
    }

    public isEmail(): boolean {
        return this.uri.startsWith('mailto:')
    }

    public isPhone(): boolean {
        return (this.uri.startsWith('tel:') || this.uri.startsWith('callto:') || this.uri.startsWith('wtai:'));
    }

    public isTextMessage(): boolean {
        return (this.uri.startsWith('sms:') || this.uri.startsWith('mms:'));
    }

    public isGeo(): boolean {
        return (this.uri.startsWith('geo:') || this.uri.startsWith('geopoint:'));
    }

    public isScript(): boolean {
        return (this.uri.startsWith('javascript:'));
    }

    public isAppStore(): boolean {
        return (this.uri.startsWith('market:') || this.uri.startsWith('itms:') || this.uri.startsWith('itms-apps:'));
    }

    public isFtp(): boolean {
        return (this.uri.startsWith('ftp:'));
    }

    public isNonNavigation(): boolean {
        return /^(gopher|archie|veronica|telnet|file|nntp|news|irc|spdy|rtmp|rtp|tcp|udp):\/\//i.test(this.uri);
    }

    public isNavigation(): boolean {
        return (
            this.uri.length > 0 &&
            !this.isAnchor() &&
            (
                this.uri.startsWith('?') ||
                /^https?:\/\//i.test(this.uri) ||
                /^\//i.test(this.uri) ||
                !/^[a-z-]{1,10}:/i.test(this.uri)
            )
        );
    }

}