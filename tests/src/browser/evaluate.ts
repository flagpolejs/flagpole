import flagpole from "../../../dist/index";
import { browserOpts } from "./browserOpts";

const suite = flagpole("Test Google Search").base("https://www.google.com/");

suite
  .browser("Test evaluate method", browserOpts)
  .open("/")
  .next(async (context) => {
    const simple = await context.eval(() => {
      return 1;
    });
    context.comment(simple);
    context.comment(typeof simple);
    context.assert(simple).equals(1);
    const images = await context.eval(() => {
      return document.querySelectorAll("img").length;
    });
    context.comment(images);
    console.log(JSON.stringify(images));
    // toType() exists only on iValue I think
    // context.comment(context.toType(images));
    context.assert(Number(images)).greaterThan(0);
  });
