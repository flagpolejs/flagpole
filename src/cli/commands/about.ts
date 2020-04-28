import { Command } from "../command";
import { Cli } from "../cli";

export default class About extends Command {
  public commandString = "about";
  public description = "credits";
  public async action() {
    Cli.subheader("About Flagpole JS")
      .log("", "Created and Open Sourced by FloSports", "", "Credits:")
      .list(
        "Jason Byrne",
        "Russell Brewer",
        "Arianne Archer",
        "Karl Snyder",
        "Alex Pierce",
        "John Sickels",
        "Will Reynolds"
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
