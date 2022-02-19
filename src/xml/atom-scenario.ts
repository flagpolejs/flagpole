import { AssertionContext } from "..";
import { NeedleAdapter } from "../adapter.needle";
import { HTMLElement } from "../html/html-element";
import { Scenario } from "../scenario";
import { AtomResponse } from "./atom-response";

export class AtomScenario extends Scenario {
  public readonly typeName = "Atom";
  public readonly context = new AssertionContext(
    this,
    NeedleAdapter,
    AtomResponse,
    HTMLElement
  );
}
