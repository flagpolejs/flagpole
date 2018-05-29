"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const property_1 = require("./property");
class Value extends property_1.Property {
    constructor(response, name, obj) {
        super(response, name, obj);
    }
    greaterThan(value) {
        return this.assert(this.obj > value, this.name + ' is greater than ' + value + ' (' + this.obj + ')', this.name + ' is not greater than ' + value + ' (' + this.obj + ')');
    }
    greaterThanOrEquals(value) {
        return this.assert(this.obj >= value, this.name + ' is greater than ' + value + ' (' + this.obj + ')', this.name + ' is not greater than ' + value + ' (' + this.obj + ')');
    }
    lessThan(value) {
        return this.assert(this.obj < value, this.name + ' is less than ' + value + ' (' + this.obj + ')', this.name + ' is not less than ' + value + ' (' + this.obj + ')');
    }
    lessThanOrEquals(value) {
        return this.assert(this.obj <= value, this.name + ' is less than ' + value + ' (' + this.obj + ')', this.name + ' is not less than ' + value + ' (' + this.obj + ')');
    }
    equals(value, permissiveMatching = false) {
        let matchValue = String(this.obj);
        let positiveCase = 'equals';
        let negativeCase = 'does not equal';
        if (permissiveMatching) {
            value = value.toLowerCase().trim();
            matchValue = matchValue.toLowerCase().trim();
            positiveCase = 'is similar to';
            negativeCase = 'is not similar to';
        }
        return this.assert(matchValue == value, this.name + ' ' + positiveCase + ' ' + value, this.name + ' ' + negativeCase + ' ' + value + ' (' + matchValue + ')');
    }
    similarTo(value) {
        return this.equals(value, true);
    }
}
exports.Value = Value;
