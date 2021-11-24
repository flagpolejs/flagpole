import { cast } from "./util";
import { AssertionPromise } from "./assertion-promise";
import { iAssertion, iAssertionIs, iValue } from "./interfaces";

function assertionMethod(
  target: Object,
  methodName: string,
  descriptor: PropertyDescriptor
) {
  descriptor.value = function (...args: any[]) {
    const valuePromise = cast<ValuePromise>(this);
    return new AssertionPromise((resolve) =>
      valuePromise.then((value) => {
        const assertion = value.assert();
        resolve(assertion[methodName].apply(assertion, args));
      })
    );
  };
}

export class ValuePromise
  extends Promise<iValue>
  implements PromiseLike<iValue>
{
  public static execute(func: () => Promise<iValue>) {
    return ValuePromise.create(func());
  }

  public static create(value: iValue | Promise<iValue>) {
    return new ValuePromise(async (resolve, reject) => {
      try {
        resolve(await value);
      } catch (ex) {
        reject(ex);
      }
    });
  }

  private constructor(
    executor: (
      resolve: (value?: iValue | PromiseLike<iValue>) => void,
      reject: (reason?: any) => void
    ) => void
  ) {
    super(executor);
  }

  get is() {
    return this._promisifyProperty<iAssertionIs>("is");
  }

  get not() {
    return this._promisifyAssertProperty<iAssertion>("not");
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

  public rename = (newName: string): ValuePromise => {
    return new ValuePromise((resolve) =>
      this.then((value) => resolve(value.rename(newName)))
    );
  };

  public assert = (message: string): AssertionPromise => {
    return new AssertionPromise((resolve) =>
      this.then((value) => resolve(value.assert(message)))
    );
  };

  public exists = (): Promise<iValue> => this._promisifyMethod("exists");

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

  private _promisifyMethod<T>(method: string, args: any[] = []): Promise<T> {
    return new Promise((r) => this.then((v) => r(v[method].apply(v, args))));
  }

  private _promisifyProperty<T>(property: string): Promise<T> {
    return new Promise((r) => this.then((v) => r(v[property])));
  }
}
