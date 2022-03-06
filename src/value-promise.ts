import { AssertionPromise } from "./assertion/assertion-promise";
import { AssertionIs } from "./assertion/assertion-is";
import { Assertion } from "./assertion/assertion";
import { ValueWrapper } from "./value-wrapper";

export class ValuePromise<ValueType extends ValueWrapper<any>>
  extends Promise<ValueType>
  implements PromiseLike<ValueType>
{
  public static execute<ValueType extends ValueWrapper<any>>(
    callback: () => Promise<ValueType>
  ): ValuePromise<ValueType> {
    return ValuePromise.wrap<ValueType>(callback());
  }

  public static wrap<ValueType extends ValueWrapper<any>>(
    value: ValueType | Promise<ValueType>
  ): ValuePromise<ValueType> {
    return new ValuePromise<ValueType>(async (resolve, reject) => {
      try {
        resolve(await value);
      } catch (ex) {
        reject(ex);
      }
    });
  }

  private constructor(
    executor: (
      resolve: (value?: ValueType) => void,
      reject: (reason?: any) => void
    ) => void
  ) {
    super(executor);
  }

  public get is() {
    return this._promisifyProperty<AssertionIs>("is");
  }

  public get not() {
    return this._promisifyAssertProperty<Assertion>("not");
  }

  public equals(value: any) {
    return this._promisifyAssertMethod("equals", value);
  }
  public exactly(value: any) {
    return this._promisifyAssertMethod("exactly", value);
  }
  public like(value: any) {
    return this._promisifyAssertMethod("like", value);
  }
  public contains(value: any) {
    return this._promisifyAssertMethod("contains", value);
  }
  public greaterThan(value: any) {
    return this._promisifyAssertMethod("greaterThan", value);
  }
  public lessThan(value: any) {
    return this._promisifyAssertMethod("lessThan", value);
  }
  public greaterThanOrEquals(value: any) {
    return this._promisifyAssertMethod("greaterThanOrEquals", value);
  }
  public lessThanOrEquals(value: any) {
    return this._promisifyAssertMethod("lessThanOrEquals", value);
  }
  public between(min: any, max: any) {
    return this._promisifyAssertMethod("between", min, max);
  }
  public matches(value: any) {
    return this._promisifyAssertMethod("matches", value);
  }
  public startsWith(value: any) {
    return this._promisifyAssertMethod("startsWith", value);
  }
  public endsWith(value: any) {
    return this._promisifyAssertMethod("endsWith", value);
  }
  public includes(value: any) {
    return this._promisifyAssertMethod("includes", value);
  }

  public rename(newName: string) {
    return this.toValuePromise("rename", newName);
  }

  public clear() {
    return this.toValuePromise("clear");
  }

  public clearThenType(text: string, opts?: any) {
    return this.toValuePromise("clearThenType", text, opts);
  }

  public type(text: string, opts?: any) {
    return this.toValuePromise("type", text, opts);
  }

  public assert = (message: string): AssertionPromise => {
    return new AssertionPromise((resolve) =>
      this.then((value) => resolve(value.assert(message)))
    );
  };

  public exists<T extends ValueWrapper<boolean>>(): Promise<T> {
    return this._promisifyMethod("exists");
  }

  private _promisifyAssertMethod<T>(
    method: keyof Assertion,
    ...args: any[]
  ): Promise<T> {
    return new Promise((resolve) =>
      this.then((value) => {
        const assertion = value.assert();
        resolve(assertion[method].apply(assertion, args));
      })
    );
  }

  private _promisifyAssertProperty<T>(property: string): Promise<T> {
    return new Promise((r) => this.then((v) => r(v.assert()[property])));
  }

  private async _promisifyMethod<T extends ValueWrapper<any>>(
    method: string,
    args: any[] = []
  ): Promise<T> {
    const value = await this;
    return value[method].apply(value, args);
  }

  private _promisifyProperty<T>(property: string): Promise<T> {
    return new Promise((r) => this.then((v) => r(v[property])));
  }

  private toValuePromise<T extends ValueWrapper<any>>(
    method: string,
    ...args: any[]
  ) {
    return ValuePromise.execute<T>(async () => {
      const value = await this;
      return value[method].apply(value, args);
    });
  }
}
