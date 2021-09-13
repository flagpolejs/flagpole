import { Command } from "../command";
import { Cli } from "../cli";

export default class About extends Command {
  public commandString = "about";
  public description = "credits";
  public async action() {
    Cli.subheader("About Flagpole JS")
      .log(
        "",
        "Flagpole was created and open sourced by Jason Byrne, during his time as VP of Engineering at FloSports.",
        "Development continued after Jason left FloSports to join Echelon Fitness as CTO, with contributors from both companies.",
        "John Sickles, Senior QA Engineer and a leading mind in the field of QA automation, has worked extensively with Jason to make it truly awesome.",
        "",
        "Credits:"
      )
      .list(
        "Jason Byrne",
        "John Sickels",
        "Russell Brewer",
        "Arianne Archer",
        "Karl Snyder",
        "Alex Pierce",
        "Will Reynolds",
        "Aylon Armstrong",
        "Kyle Babcock"
      )
      .log(
        "",
        "More info: http://www.flagpolejs.com",
        "Source: https://www.npmjs.com/package/flagpole",
        ""
      )
      .exit(0);
  }
}
