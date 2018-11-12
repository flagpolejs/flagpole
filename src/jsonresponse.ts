import { iResponse, SimplifiedResponse, GenericResponse } from "./response";
import { Scenario } from "./scenario";
import { Node } from "./node";

export class JsonResponse extends GenericResponse implements iResponse {

    protected json: {};

    constructor(scenario: Scenario, url: string, response: SimplifiedResponse) {
        super(scenario, url, response);
        this.json = JSON.parse(response.body);
        (this.json) ?
            this.scenario.pass('JSON is valid') :
            this.scenario.fail('JSON is not valid');
    }

    /**
     * Select a json property in this response body
     *
     * @param {string} path
     * @param findIn
     * @returns {Node}
     */
    public select(path: string, findIn?: any): Node {
        let args: Array<string> = path.split('.');
        let obj: any = findIn || this.json;
        let response: iResponse = this;
        let element: Node;
        if (args.every(function(value: string) {
                obj = obj[value];
                return (typeof obj !== 'undefined');
            })) {
            element = new Node(response, path, obj);
        }
        else {
            element = new Node(response, path, undefined);
        }
        // Create the property
        this.setLastElement(path, element);
        // Inferred exists assertion
        element.exists();
        return element;
    }

    /**
     * Find a matching parent element, relative to the currently selected element
     *
     * @param {string} selector
     * @returns {Node}
     */
    public parents(selector?: string): Node {
        // If there is no selector then this is the same as the parent method
        if (typeof selector == 'undefined') {
            return this.parent();
        }
        // There is a selector so we gotta do more work
        else {
            let name: string = 'parent';
            let arrPath: string[] = (this._lastElementPath || '').split('.');
            if (arrPath.length > 1) {
                // Loop backwards, starting at the second to last element in path
                let found: boolean = false;
                let i = arrPath.length - 2;
                for (; i >= 0; i--) {
                    if (arrPath[i] == selector) {
                        found = true;
                        break;
                    }
                }
                // Found something that matched selector..  So build path up to that point
                if (found) {
                    return this.select(arrPath.slice(0, i + 1).join('.'));
                }
            }
            // Did not find a match, so return null node
            return this.setLastElement(null, new Node(this, name, null));
        }        
    }

    /**
     * Find a matching parent element, relative to the currently selected element
     */
    public parent(): Node {
        let name: string = 'parent';
        let arrPath: string[] = (this._lastElementPath || '').split('.');
        // If the last selected path is at least 2 deep
        if (arrPath.length > 1) {
            return this.select(arrPath.slice(0, arrPath.length - 1).join('.'));
        }
        // Else return top level
        else {
            return this.setLastElement('', new Node(this, name, this.json));
        }
    }
    
    /**
     * Find closest matching element, including this one
     * 
     * @param selector 
     */
    public closest(selector: string): Node {
        let name: string = 'closest ' + selector;
        let arrPath: string[] = (this._lastElementPath || '').split('.');
        let found: boolean = false;
        // Loop through the path backwards
        let i = arrPath.length - 1;
        for (; i >= 0; i--) {
            if (arrPath[i] == selector) {
                found = true;
                break;
            }
        }
        // Found something that matched selector..  So build path up to that point
        if (found) {
            return this.select(arrPath.slice(0, i + 1).join('.'));
        }
        // Did not find a match, so return null node
        else {
            return this.setLastElement('', new Node(this, name, null));
        }
    }

    /**
     * Find matching child elements, relative to the currently selected element
     *
     * @param {string} selector
     * @returns {Node}
     */
    public children(selector?: string): Node {
        let obj: any = null;
        let name: string = 'children ' + selector;
        if (this.getLastElement().isObject() || this.getLastElement().isArray()) {
            obj = this.getLastElement().get();
            if (typeof selector !== 'undefined') {
                return this.select(selector, obj);
            }
        }
        return this.setLastElement(null, new Node(this, name, obj));
    }

    /**
     * 
     * @param selector 
     */
    public siblings(selector?: string): Node {
        return this.parent().children(selector);
    }

    /**
     * Don't know a good way yet to really do next, so we'll just do siblings
     * 
     * @param selector 
     */
    public next(selector?: string): Node {
        return this.parent().children(selector);
    }

    /**
     * Don't know a good way yet to really do next, so we'll just do siblings
     * 
     * @param selector 
     */
    public prev(selector?: string): Node {
        return this.parent().children(selector);
    }

}
