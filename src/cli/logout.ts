import { printHeader, printSubheader } from "./cli-helper";
import { Cli } from "./cli";
import { ClorthoService } from "clortho-lite";

const request = require("request");

const serviceName: string = "Flagpole JS";
const service: ClorthoService = new ClorthoService(serviceName);

export function logout() {
  Cli.hideBanner = true;

  printHeader();
  printSubheader("Logout of FlagpoleJS.com");

  Cli.getCredentials()
    .then(function(credentials: { email: string; token: string }) {
      Cli.log("");
      request.delete(
        Cli.apiDomain + "/api/token/" + credentials.token,
        {
          body: JSON.stringify({ token: credentials.token }),
          headers: {
            "Content-Type": "application/json"
          }
        },
        function(err, response, body) {
          if (err) {
            Cli.log(err);
            Cli.log("");
            Cli.exit(1);
          } else {
            service.remove("token");
            service
              .remove("email")
              .then(function(result) {
                Cli.log("Logged you out of account: " + credentials.email);
                Cli.log("");
                Cli.exit(0);
              })
              .catch(function(err) {
                Cli.log(err);
                Cli.log("");
                Cli.exit(1);
              });
          }
        }
      );
    })
    .catch(function() {
      Cli.log("");
      Cli.log("You were not logged in.");
      Cli.log("");
      Cli.exit(0);
    });
}
