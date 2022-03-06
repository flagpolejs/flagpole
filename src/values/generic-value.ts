import { AssertionContext } from "../assertion/assertion-context";
import { ValueOptions } from "../interfaces/value-options";
import { ValueWrapper } from "../value-wrapper";

export class GenericValue<InputType> extends ValueWrapper<InputType> {
  constructor(
    input: InputType,
    context: AssertionContext,
    opts: ValueOptions | string
  ) {
    super(input, context, opts);
  }
}
