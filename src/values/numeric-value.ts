import { ValueWrapper } from "../value-wrapper";

export class NumericValue extends ValueWrapper<number> {
  public add(n: number) {
    return new NumericValue(this.$ + n, this.context, {
      name: `{$this.name} + 1`,
    });
  }

  public subtract(n: number) {
    return new NumericValue(this.$ - n, this.context, {
      name: `{$this.name} - 1`,
    });
  }
}
