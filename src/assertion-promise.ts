import { cast } from "./util";
import { iAssertion } from "./interfaces";

function assertionMethod(
  target: Object,
  methodName: string,
  descriptor: PropertyDescriptor
) {
  descriptor.value = function (...args: any[]) {
    const assertionPromise = cast<AssertionPromise>(this);
    return new AssertionPromise((resolve) =>
      assertionPromise.then((assertion) => {
        resolve(assertion[methodName].apply(assertion, args));
      })
    );
  };
}

export class AssertionPromise
  extends Promise<iAssertion>
  implements PromiseLike<iAssertion>
{
  public constructor(
    executor: (
      resolve: (value?: iAssertion | PromiseLike<iAssertion>) => void,
      reject: (reason?: any) => void
    ) => void
  ) {
    super(executor);
  }

  get and() {
    return new AssertionPromise((resolve) =>
      this.then((assertion) => resolve(assertion.and))
    );
  }

  @assertionMethod equals(value: any): AssertionPromise {
    return this;
  }
  @assertionMethod exactly(value: any): AssertionPromise {
    return this;
  }
  @assertionMethod like(value: any): AssertionPromise {
    return this;
  }
  @assertionMethod contains(value: any): AssertionPromise {
    return this;
  }
  @assertionMethod greaterThan(value: any): AssertionPromise {
    return this;
  }
  @assertionMethod lessThan(value: any): AssertionPromise {
    return this;
  }
  @assertionMethod greaterThanOrEquals(value: any): AssertionPromise {
    return this;
  }
  @assertionMethod lessThanOrEquals(value: any): AssertionPromise {
    return this;
  }
  @assertionMethod between(min: any, max: any): AssertionPromise {
    return this;
  }
  @assertionMethod matches(value: any): AssertionPromise {
    return this;
  }
  @assertionMethod startsWith(value: any): AssertionPromise {
    return this;
  }
  @assertionMethod endsWith(value: any): AssertionPromise {
    return this;
  }
  @assertionMethod continains(values: any[]): AssertionPromise {
    return this;
  }
  @assertionMethod includes(value: any): AssertionPromise {
    return this;
  }
}
