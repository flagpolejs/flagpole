import { iAssertion, iAssertionIs } from "./interfaces";
import validator from "validator";
import {
  canadaProvinceCodes,
  countryCodes2,
  countryCodes3,
  usStateCodes,
} from "./constants";

export class AssertionIs implements iAssertionIs {
  public get not(): AssertionIs {
    this._assertion.not;
    return this;
  }

  public get optional(): AssertionIs {
    this._assertion.optional;
    return this;
  }

  constructor(private _assertion: iAssertion) {}

  public type(type: string) {
    return this._assertion.type.equals(type);
  }

  public array() {
    return this._assertion.type.equals("array");
  }

  public object() {
    return this._assertion.type.equals("object");
  }

  public null() {
    return this._assertion.type.equals("null");
  }

  public undefined() {
    return this._assertion.type.equals("undefined");
  }

  public number() {
    return this._assertion.type.equals("number");
  }

  public string() {
    return this._assertion.type.equals("string");
  }

  public greaterThan(value: any) {
    return this._assertion.greaterThan(value);
  }

  public lessThan(value: any) {
    return this._assertion.lessThan(value);
  }

  public lessThanOrEquals(value: any) {
    return this._assertion.lessThanOrEquals(value);
  }

  public greaterThanOrEquals(value: any) {
    return this._assertion.greaterThanOrEquals(value);
  }

  public boolean() {
    return this._validate(validator.isBoolean, "a boolean");
  }

  public email() {
    return this._validate(validator.isEmail, "an email address");
  }

  public alpha() {
    return this._validate(validator.isAlpha, "an alpha string");
  }

  public alphaNumeric() {
    return this._validate(validator.isAlphanumeric, "alpha-numeric");
  }

  public ascii() {
    return this._validate(validator.isAscii, "an ASCII string");
  }

  public creditCard() {
    return this._validate(validator.isCreditCard, "a credit card number");
  }

  public currency() {
    return this._validate(validator.isCurrency, "currency");
  }

  public decimal() {
    return this._validate(validator.isDecimal, "a decimal");
  }

  public float() {
    return this._validate(validator.isFloat, "a float");
  }

  public ip() {
    return this._validate(validator.isIP, "an IP address");
  }

  public integer() {
    return this._validate(validator.isInt, "an integer");
  }

  public json() {
    return this._validate(validator.isJSON, "a valid JSON string");
  }

  public jwt() {
    return this._validate(validator.isJWT, "a JWT");
  }

  public numeric() {
    return this._validate(validator.isNumeric, "numeric");
  }

  public postalCode(locale?: validator.PostalCodeLocale) {
    return this._validateWithOpts(
      validator.isPostalCode,
      locale,
      locale ? `a ${locale} postal code` : "a postal code"
    );
  }

  public url() {
    return this._validate(validator.isURL, "a URL");
  }

  public mobilePhone(locale?: validator.MobilePhoneLocale) {
    return this._validateWithOpts(
      validator.isMobilePhone,
      locale,
      locale ? `a ${locale} mobile phone number` : "mobile phone number"
    );
  }

  public base32() {
    return this._validate(validator.isBase32, "base32 encoded");
  }

  public base64() {
    return this._validate(validator.isBase64, "base32 encoded");
  }

  public beforeDate(date?: string) {
    return this._validateWithOpts(
      validator.isBefore,
      date,
      date ? `before ${date}` : `before ${Date.toString}`
    );
  }

  public sameOrAfterDate(date?: string) {
    return this._validateWithOpts(
      (str: string) => str == date || validator.isAfter(str, date),
      date,
      date ? `same or after ${date}` : `same or after ${Date.toString}`
    );
  }

  public sameOrBeforeDate(date?: string) {
    return this._validateWithOpts(
      (str: string) => str == date || validator.isBefore(str, date),
      date,
      date ? `same or before ${date}` : `same or before ${Date.toString}`
    );
  }

  public afterDate(date?: string) {
    return this._validateWithOpts(
      validator.isAfter,
      date,
      date ? `after ${date}` : `after ${Date.toString}`
    );
  }

  public dataUri() {
    return this._validate(validator.isDataURI, "data URI");
  }

  public empty() {
    return this._validate(validator.isEmpty, "empty");
  }

  public fqdn() {
    return this._validate(validator.isFQDN, "fully-qualified domain name");
  }

  public hash() {
    return this._validate(validator.isHash, "a hash");
  }

  public hexColor() {
    return this._validate(validator.isHexColor, "a hexadecimal color");
  }

  public hexadecimal() {
    return this._validate(validator.isHexadecimal, "a hexadecimal number");
  }

  public in(values: any[]) {
    return this._validateWithOpts(
      validator.isIn,
      values,
      `included in: ${values.join(", ")}`
    );
  }

  public latLong() {
    return this._validate(validator.isLatLong, "latitude and longitude");
  }

  public lowercase() {
    return this._validate(validator.isLowercase, "lowercase");
  }

  public md5() {
    return this._validate(validator.isMD5, "MD5");
  }

  public mimeType() {
    return this._validate(validator.isMimeType, "mime-type");
  }

  public octal() {
    return this._validate(validator.isOctal, "octal");
  }

  public port() {
    return this._validate(validator.isPort, "a valid port");
  }

  public rgbColor() {
    return this._validate(validator.isRgbColor, "an RGB color");
  }

  public slug() {
    return this._validate(validator.isSlug, "a slug string");
  }

  public uuid() {
    return this._validate(validator.isUUID, "a UUID");
  }

  public uppercase() {
    return this._validate(validator.isUppercase, "uppercase");
  }

  public date() {
    // @ts-ignore Validator's type definition left this off
    return this._validate(validator.isDate, "a date");
  }

  public regionCode(countries?: ["US" | "CA"]) {
    let codes: string[] = [];
    if (countries?.includes("US")) {
      codes = [...codes, ...usStateCodes];
    }
    if (countries?.includes("CA")) {
      codes = [...codes, ...canadaProvinceCodes];
    }
    return this._validate(
      (state: string) =>
        codes.length > 0 ? codes.includes(state) : state.length == 2,
      "a region code"
    );
  }

  public countryCode(format?: "iso-alpha-2" | "iso-alpha-3") {
    const codes: string[] =
      format == "iso-alpha-2"
        ? countryCodes2
        : format == "iso-alpha-3"
        ? countryCodes3
        : [];
    return this._validate(
      (code: string) =>
        codes.length > 0
          ? codes.includes(code)
          : code.length == 3 || code.length == 2,
      "a country code"
    );
  }

  private _setValidationMessage(thisThing: string) {
    this._assertion.setDefaultMessages(
      `${this._assertion.subject} is not ${thisThing}.`,
      `${this._assertion.subject} is ${thisThing}.`
    );
  }

  private _validate(func: Function, thisThing: string) {
    const text = this._assertion.text;
    this._setValidationMessage(thisThing);
    return this._assertion.execute(func(text), text);
  }

  private _validateWithOpts(func: Function, opts: any, thisThing: string) {
    const text = this._assertion.text;
    this._setValidationMessage(thisThing);
    return this._assertion.execute(func(text, opts), text);
  }
}
