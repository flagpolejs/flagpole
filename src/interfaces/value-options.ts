import { iValue } from "./ivalue";

export interface ValueOptions {
  // Human-readable name
  name?: string;
  // Actual selector, which could actually be used to select
  selector?: string;
  // Similar to the selector but intended to be human-readable
  path?: string;
  // The parent document or section of the document where it was selected from
  parent?: iValue<any>;
  // The source for this element
  sourceCode?: string;
  // If this was an element with a tag, the tag name
  tagName?: string;
  // The text to highlight if there is an error to show where it happened
  highlightText?: string;
}