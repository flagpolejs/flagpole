"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const property_1 = require("./property");
class Value extends property_1.Property {
    select(path, findIn) {
        return this.response.select(path, findIn);
    }
    and() {
        return this.response.and();
    }
    length() {
        let count = (this.obj && this.obj.length) ?
            this.obj.length : 0;
        return new Value(this.response, 'Length of ' + this.name, count);
    }
    text() {
        let text = this.toString();
        let name = 'Text of ' + this.name;
        let value = new Value(this.response, name, text);
        value.length().greaterThan(0);
        return value;
    }
    parseFloat() {
        return new Value(this.response, 'Text of ' + this.name, parseFloat(this.toString()));
    }
    parseInt() {
        return new Value(this.response, 'Text of ' + this.name, parseInt(this.toString()));
    }
    trim() {
        let text = this.toString().trim();
        return new Value(this.response, 'Trimmed text of ' + this.name, text);
    }
    toLowerCase() {
        let text = this.toString().toLowerCase();
        return new Value(this.response, 'Lowercased text of ' + this.name, text);
    }
    toUpperCase() {
        let text = this.toString().toUpperCase();
        return new Value(this.response, 'Uppercased text of ' + this.name, text);
    }
    replace(search, replace) {
        let text = this.toString().replace(search, replace);
        return new Value(this.response, 'Replaced text of ' + this.name, text);
    }
    greaterThan(value) {
        return this.assert(this.obj > value, this.name + ' is greater than ' + value + ' (' + this.obj + ')', this.name + ' is not greater than ' + value + ' (' + this.obj + ')');
    }
    greaterThanOrEquals(value) {
        return this.assert(this.obj >= value, this.name + ' is greater than or equal to ' + value + ' (' + this.obj + ')', this.name + ' is not greater than or equal to ' + value + ' (' + this.obj + ')');
    }
    lessThan(value) {
        return this.assert(this.obj < value, this.name + ' is less than ' + value + ' (' + this.obj + ')', this.name + ' is not less than ' + value + ' (' + this.obj + ')');
    }
    lessThanOrEquals(value) {
        return this.assert(this.obj <= value, this.name + ' is less than or equal to ' + value + ' (' + this.obj + ')', this.name + ' is not less than or equal to ' + value + ' (' + this.obj + ')');
    }
}
exports.Value = Value;
