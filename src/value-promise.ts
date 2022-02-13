import { AssertionPromise } from "./assertion/assertion-promise";
import { iValue } from "./interfaces/ivalue";
import { cast } from "./helpers/cast";
import { AssertionIs } from "./assertion/assertion-is";
import { Assertion, Value } from ".";

function assertionMethod<InputType, Wrapper extends Value<InputType>>(
  target: Object,
  methodName: string,
  descriptor: PropertyDescriptor
) {
  descriptor.value = function (...args: any[]) {
    const valuePromise = cast<ValuePromise<InputType, Wrapper>>(this);
    return new AssertionPromise((resolve) =>
      valuePromise.then((value) => {
        const assertion = value.assert();
        resolve(assertion[methodName].apply(assertion, args));
      })
    );
  };
}

export class ValuePromise<InputType, Wrapper extends iValue<InputType>>
  extends Promise<Wrapper>
  implements PromiseLike<Wrapper>
{
  public static execute<InputType, Wrapper extends iValue<InputType>>(
    callback: () => Promise<Wrapper>
  ) {
    return ValuePromise.wrap<InputType, Wrapper>(callback());
  }

  public static wrap<InputType, Wrapper extends iValue<InputType>>(
    value: Wrapper | Promise<Wrapper>
  ) {
    return new ValuePromise<InputType, Wrapper>(async (resolve, reject) => {
      try {
        resolve(await value);
      } catch (ex) {
        reject(ex);
      }
    });
  }

  private constructor(
    executor: (
      resolve: (value?: Wrapper) => void,
      reject: (reason?: any) => void
    ) => void
  ) {
    super(executor);
  }

  get is() {
    return this._promisifyProperty<AssertionIs>("is");
  }

  get not() {
    return this._promisifyAssertProperty<Assertion>("not");
  }

  @assertionMethod equals(value: any) {
    return cast<AssertionPromise>(null);
  }
  @assertionMethod exactly(value: any) {
    return cast<AssertionPromise>(null);
  }
  @assertionMethod like(value: any) {
    return cast<AssertionPromise>(null);
  }
  @assertionMethod contains(value: any) {
    return cast<AssertionPromise>(null);
  }
  @assertionMethod greaterThan(value: any) {
    return cast<AssertionPromise>(null);
  }
  @assertionMethod lessThan(value: any) {
    return cast<AssertionPromise>(null);
  }
  @assertionMethod greaterThanOrEquals(value: any) {
    return cast<AssertionPromise>(null);
  }
  @assertionMethod lessThanOrEquals(value: any) {
    return cast<AssertionPromise>(null);
  }
  @assertionMethod between(min: any, max: any) {
    return cast<AssertionPromise>(null);
  }
  @assertionMethod matches(value: any) {
    return cast<AssertionPromise>(null);
  }
  @assertionMethod startsWith(value: any) {
    return cast<AssertionPromise>(null);
  }
  @assertionMethod endsWith(value: any) {
    return cast<AssertionPromise>(null);
  }
  @assertionMethod includes(value: any) {
    return cast<AssertionPromise>(null);
  }

  rename = (newName: string) => this.toValuePromise("rename", newName);
  clear = () => this.toValuePromise("clear");
  clearThenType = (text: string, opts?: any) =>
    this.toValuePromise("clearThenType", text, opts);
  type = (text: string, opts?: any) => this.toValuePromise("type", text, opts);

  assert = (message: string): AssertionPromise => {
    return new AssertionPromise((resolve) =>
      this.then((value) => resolve(value.assert(message)))
    );
  };

  exists = (): Promise<iValue<boolean>> => this._promisifyMethod("exists");

  private _promisifyAssertMethod<T>(
    method: string,
    args: any[] = []
  ): Promise<T> {
    return new Promise((r) =>
      this.then((value) => {
        const assertion = value.assert();
        r(assertion[method].apply(assertion, args));
      })
    );
  }

  private _promisifyAssertProperty<T>(property: string): Promise<T> {
    return new Promise((r) => this.then((v) => r(v.assert()[property])));
  }

  private async _promisifyMethod<T>(
    method: string,
    args: any[] = []
  ): Promise<T> {
    const value = await this;
    return value[method].apply(value, args);
  }

  private _promisifyProperty<T>(property: string): Promise<T> {
    return new Promise((r) => this.then((v) => r(v[property])));
  }

  private toValuePromise<T = any>(method: string, ...args: any[]) {
    return ValuePromise.execute<InputType, Wrapper>(async () => {
      const value = await this;
      return value[method].apply(value, args);
    });
  }
}
