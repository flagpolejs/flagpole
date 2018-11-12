"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const response_1 = require("./response");
const node_1 = require("./node");
class JsonResponse extends response_1.GenericResponse {
    constructor(scenario, url, response) {
        super(scenario, url, response);
        this.json = JSON.parse(response.body);
        (this.json) ?
            this.scenario.pass('JSON is valid') :
            this.scenario.fail('JSON is not valid');
    }
    select(path, findIn) {
        let args = path.split('.');
        let obj = findIn || this.json;
        let response = this;
        let element;
        if (args.every(function (value) {
            obj = obj[value];
            return (typeof obj !== 'undefined');
        })) {
            element = new node_1.Node(response, path, obj);
        }
        else {
            element = new node_1.Node(response, path, undefined);
        }
        this.setLastElement(path, element);
        element.exists();
        return element;
    }
    parents(selector) {
        if (typeof selector == 'undefined') {
            return this.parent();
        }
        else {
            let name = 'parent';
            let arrPath = (this._lastElementPath || '').split('.');
            if (arrPath.length > 1) {
                let found = false;
                let i = arrPath.length - 2;
                for (; i >= 0; i--) {
                    if (arrPath[i] == selector) {
                        found = true;
                        break;
                    }
                }
                if (found) {
                    return this.select(arrPath.slice(0, i + 1).join('.'));
                }
            }
            return this.setLastElement(null, new node_1.Node(this, name, null));
        }
    }
    parent() {
        let name = 'parent';
        let arrPath = (this._lastElementPath || '').split('.');
        if (arrPath.length > 1) {
            return this.select(arrPath.slice(0, arrPath.length - 1).join('.'));
        }
        else {
            return this.setLastElement('', new node_1.Node(this, name, this.json));
        }
    }
    closest(selector) {
        let name = 'closest ' + selector;
        let arrPath = (this._lastElementPath || '').split('.');
        let found = false;
        let i = arrPath.length - 1;
        for (; i >= 0; i--) {
            if (arrPath[i] == selector) {
                found = true;
                break;
            }
        }
        if (found) {
            return this.select(arrPath.slice(0, i + 1).join('.'));
        }
        else {
            return this.setLastElement('', new node_1.Node(this, name, null));
        }
    }
    children(selector) {
        let obj = null;
        let name = 'children ' + selector;
        if (this.getLastElement().isObject() || this.getLastElement().isArray()) {
            obj = this.getLastElement().get();
            if (typeof selector !== 'undefined') {
                return this.select(selector, obj);
            }
        }
        return this.setLastElement(null, new node_1.Node(this, name, obj));
    }
    siblings(selector) {
        return this.parent().children(selector);
    }
    next(selector) {
        return this.parent().children(selector);
    }
    prev(selector) {
        return this.parent().children(selector);
    }
}
exports.JsonResponse = JsonResponse;
