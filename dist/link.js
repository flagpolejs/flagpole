"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = require("url");
const _1 = require(".");
const isValidDataUrl = require('valid-data-url');
class Link {
    constructor(response, uri) {
        this.response = response;
        this.uri = uri;
    }
    getUri(queryString) {
        let baseUrl = new url_1.URL(this.response.scenario.suite.buildUrl(this.response.scenario.getUrl() || ''));
        let thisUrl = new url_1.URL(this.uri, baseUrl.href);
        if (queryString) {
            let type = _1.Flagpole.toType(queryString);
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
    isValidDataUri() {
        return isValidDataUrl(this.uri);
    }
    isData() {
        return (this.uri.startsWith('data:'));
    }
    isAnchor() {
        return this.uri.startsWith('#');
    }
    isEmail() {
        return this.uri.startsWith('mailto:');
    }
    isPhone() {
        return (this.uri.startsWith('tel:') || this.uri.startsWith('callto:') || this.uri.startsWith('wtai:'));
    }
    isTextMessage() {
        return (this.uri.startsWith('sms:') || this.uri.startsWith('mms:'));
    }
    isGeo() {
        return (this.uri.startsWith('geo:') || this.uri.startsWith('geopoint:'));
    }
    isScript() {
        return (this.uri.startsWith('javascript:'));
    }
    isAppStore() {
        return (this.uri.startsWith('market:') || this.uri.startsWith('itms:') || this.uri.startsWith('itms-apps:'));
    }
    isFtp() {
        return (this.uri.startsWith('ftp:'));
    }
    isNonNavigation() {
        return /^(gopher|archie|veronica|telnet|file|nntp|news|irc|spdy|rtmp|rtp|tcp|udp):\/\//i.test(this.uri);
    }
    isNavigation() {
        return (this.uri.length > 0 &&
            !this.isAnchor() &&
            (this.uri.startsWith('?') ||
                /^https?:\/\//i.test(this.uri) ||
                /^\//i.test(this.uri) ||
                !/^[a-z-]{1,10}:/i.test(this.uri)));
    }
    validate() {
        if (this.isAnchor()) {
            let anchorName = this.uri.substr(1);
            this.response.assert(this.response.getRoot()('a[name="' + anchorName + '"]').length > 0, 'Anchor link has a matching anchor (' + anchorName + ')', 'No anchor mathed the link (' + anchorName + ')');
        }
        else if (this.isData()) {
            this.response.assert(this.isValidDataUri(), 'Is valid data URL', 'Is not valid data URL');
        }
        return this;
    }
}
exports.Link = Link;
