import { WebServer, WebResponse } from "../webserver";
import * as http from "http";
import { Cli } from "./cli";
import { iSuiteOpts, SuiteConfig, EnvConfig, iScenarioOpts } from "./config";
import { URL } from "url";
import { FlagpoleExecutionOptions } from "../flagpoleexecutionoptions";
import { SuiteExecutionResult, SuiteExecution } from "./suiteexecution";
import { FlagpoleExecution } from "../flagpoleexecutionoptions";
import { sep } from "path";
import open = require("open");
import qs = require("querystring");

const possibleEnvironments = [
  "dev",
  "stag",
  "prod",
  "qa",
  "rc",
  "preprod",
  "alpha",
  "beta",
];

const routes = {
  "GET /api/suites": (url: URL, response: http.ServerResponse) => {
    sendJson(response, { suites: Cli.config.suites });
  },
  "GET /import/suite": (url: URL, response: http.ServerResponse) => {
    sendGetImport(response);
  },
  "POST /import/suite": (
    url: URL,
    response: http.ServerResponse,
    postData: any
  ) => {
    const name: string = postData.name;
    if (name) {
      Cli.config.addSuite({
        name: name,
      });
      Cli.config.save();
      return sendOutput(
        response,
        `<p>Imported new suite ${name} from file ${name}.js</p><p><a href="/">Back</a>`
      );
    }
    fileNotFound(response);
  },
  "GET /init": (url: URL, response: http.ServerResponse) => {
    sendGetInit(response);
  },
  "POST /init": (url: URL, response: http.ServerResponse, postData: any) => {
    initProject(response, postData);
  },
  "GET /add/scenario": (url: URL, response: http.ServerResponse) => {
    const suiteName: string | null = url.searchParams.get("suite");
    const suite: SuiteConfig | void = getSuite(response, suiteName);
    if (suite) {
      return sendGetAddScenario(response, suite);
    }
    fileNotFound(response);
  },
  "POST /add/scenario": (
    url: URL,
    response: http.ServerResponse,
    postData: any
  ) => {
    if (
      !postData.suite ||
      !postData.description ||
      !postData.path ||
      !postData.type
    ) {
      return sendOutput(response, `<p>All fields are required.</p>`);
    }
    const suite: SuiteConfig | void = getSuite(response, postData.suite);
    if (!suite) {
      return fileNotFound(response);
    }
    Cli.addScenario(suite, {
      description: postData.description,
      path: postData.path,
      type: postData.type,
    })
      .then(() => {
        return sendOutput(
          response,
          `
                <p>Added scenario to <em>${suite.name}</em></p>
                <p><a href="/">Back</a></p>
            `
        );
      })
      .catch((err) => {
        return sendOutput(response, `<p>${err}</p>`);
      });
  },
  "GET /add/suite": (url: URL, response: http.ServerResponse) => {
    sendGetAddSuite(response);
  },
  "POST /add/suite": (
    url: URL,
    response: http.ServerResponse,
    postData: any
  ) => {
    // Verify base data exists
    if (
      !postData.suiteName ||
      !postData.suiteDescription ||
      !postData.scenarioDescription ||
      !postData.scenarioPath ||
      !postData.scenarioType
    ) {
      return sendOutput(
        response,
        `<p>All fields are required. <a href="/add/suite">Try again</a></p>`
      );
    }
    // Loop through posted data and pull out the domains
    let domains: { [env: string]: string } = {};
    Object.keys(postData).forEach((key: string) => {
      if (key.startsWith("baseDomain[") && key.endsWith("]")) {
        let envName: string = key.split("[")[1].slice(0, -1);
        domains[envName] = postData[key];
      }
    });
    // Create a base domain, even if they don't set one
    if (Object.keys(domains).length == 0) {
      domains.dev = "http://localhost";
    }
    // Create new suite and first scenario
    addSuite(
      response,
      {
        name: postData.suiteName,
        description: postData.suiteDescription,
      },
      {
        description: postData.scenarioDescription,
        path: postData.scenarioPath,
        type: postData.scenarioType,
      }
    );
  },
  "GET /suite": (url: URL, response: http.ServerResponse) => {
    const suite: SuiteConfig | void = getSuite(
      response,
      url.searchParams.get("name")
    );
    if (suite) {
      return sendGetEditSuite(response, suite);
    }
    fileNotFound(response);
  },
  "POST /suite": (url: URL, response: http.ServerResponse, postData: any) => {
    const suite: SuiteConfig | void = getSuite(response, postData.name);
    if (suite) {
      Cli.config.suites[suite.name].clearTags();
      String(postData.tags)
        .split(",")
        .forEach((tag) => {
          Cli.config.suites[suite.name].addTag(tag);
        });
      Cli.config
        .save()
        .then(() => {
          sendOutput(
            response,
            `<p>Saved changes to suite.</p><p><a href="/">Back</a>`
          );
        })
        .catch((err) => {
          sendOutput(
            response,
            `<p>Error adding tag. ${err}</p><p><a href="/suite?name=${suite.name}">Back</a>`
          );
        });
    }
  },
  "POST /rm": (url: URL, response: http.ServerResponse) => {
    const env: string | null = url.searchParams.get("env");
    const suite: string | null = url.searchParams.get("suite");
    if (suite) {
      return removeSuite(response, suite);
    } else if (env) {
      return removeEnv(response, env);
    }
    fileNotFound(response);
  },
  "GET /add/env": (url: URL, response: http.ServerResponse) => {
    sendGetAddEnv(response);
  },
  "POST /add/env": (url: URL, response: http.ServerResponse, postData: any) => {
    const envName: string | null = postData.name;
    const defaultDomain: string | null = postData.domain;
    if (!envName || !defaultDomain) {
      return sendOutput(
        response,
        `<p>Imported new suite ${name} from file ${name}.js</p><p><a href="/">Back</a>`
      );
    }
    if (envName) {
      addEnv(
        response,
        new EnvConfig(Cli.config, {
          name: envName,
          defaultDomain: defaultDomain,
        })
      );
    }
  },
  "POST /run": (url: URL, response: http.ServerResponse, postData: any) => {
    const suiteName = postData.suite;
    const envName = postData.env;
    if (suiteName && Cli.config.suites[suiteName]) {
      return runSuite(
        response,
        suiteName,
        envName || FlagpoleExecution.opts.environment
      );
    }
    fileNotFound(response);
  },
};

const getSuite = (
  response: http.ServerResponse,
  suiteName: string | null
): SuiteConfig | void => {
  if (!suiteName) {
    return sendOutput(response, `<p>No suite name. <a href="/">Back</a></p>`);
  }
  // Make sure it's a valid suite
  const suite: SuiteConfig = Cli.config.suites[suiteName];
  if (!suite) {
    return sendOutput(
      response,
      `<p>That suite does not exist. <a href="/">Back</a></p>`
    );
  }
  return suite;
};

const getTemplate = (httpResponse: http.ServerResponse): WebResponse => {
  const response: WebResponse = WebResponse.createFromTemplate(
    httpResponse,
    `${__dirname}/report.html`
  );
  response.replace("nav", '<a href="/">Project Home</a>');
  return response;
};

const sendOutput = (response: http.ServerResponse, output: string): void => {
  getTemplate(response).send({
    output: output,
  });
};

const sendJson = (response: http.ServerResponse, json: any): void => {
  WebResponse.createFromInput(response, JSON.stringify(json)).send();
};

const fileNotFound = (response: http.ServerResponse): void => {
  sendOutput(response, "File not found.");
};

const sendGetInit = (response: http.ServerResponse): void => {
  let output: string = `
        <h2>Initialize Flagpole</h2>
        <p>
            Flagpole has not yet been set up in this project. Complete the form below to configure.
        </p>
        <form method="POST" action="/init" id="frm">
            <div class="field">
                <label for="name">Project Name</label>
                <input type="text" name="projectName" id="name" value="${process
                  .cwd()
                  .split(sep)
                  .pop()}">
            </div>
            <div class="field">
                <label for="folder">Tests Folder</label>
                <input type="text" name="testsPath" id="folder" value="tests">
            </div>
            <div class="field">
                Environments (check all that you want to use)
            </div>`;
  possibleEnvironments.forEach((envName: string) => {
    output += `
                <div class="field">
                    <input type="checkbox" name="envName[${envName}]" id="env_${envName}" value="${envName}">
                    <label for="env_${envName}">${envName}</label>
                    <input type="text" name="envDomain[${envName}]" id="domain_${envName}" placeholder="https://www.flagpolejs.com">
                </div>
            `;
  });
  output += `
            <div class="field button">
                <button type="submit">Initialize Project</button>
            </div>
        </form>`;
  sendOutput(response, output);
};

const sendGetAddEnv = (response: http.ServerResponse): void => {
  let output: string = `
        <h2>Add Environment</h2>
        <form method="POST" action="/add/env" id="frm">
            <div class="field">
                <label for="name">Environment Name</label>
                <input type="text" name="name" id="name" placeholder="dev">
            </div>
            <div class="field">
                <label for="domain">Base Path</label>
                <input type="url" name="domain" id="domain" placeholder="http://www.google.com/">
            </div>
            <div class="field button">
                <button type="submit">Add Environment</button>
                <button type="button" onclick="window.location.href='/'">Cancel</button>
            </div>
        </form>`;
  sendOutput(response, output);
};

const sendGetEditSuite = (
  response: http.ServerResponse,
  suite: SuiteConfig
): void => {
  let output: string = `
        <h2>Edit Suite</h2>
        <form method="POST" action="/suite" id="frm">
            <div class="field">
                <label for="name">Suite Name</label>
                <input type="text" name="name" id="name" value="${
                  suite.name
                }" readonly>
            </div>
            <div class="field">
                <label for="tags">Tags (comma-separated)</label>
                <input type="text" name="tags" id="tags" placeholder="tag1, tag2" value="${suite.tags.join(
                  ", "
                )}">
            </div>
            <div class="field button">
                <button type="submit">Save Changes</button>
                <button type="button" onclick="window.location.href='/'">Cancel</button>
            </div>
        </form>`;
  sendOutput(response, output);
};

const sendGetAddScenario = (
  response: http.ServerResponse,
  suite: SuiteConfig
) => {
  let output: string = `
        <h2>Add Scenario</h2>
        <p>Appending a new scenario to suite ${suite.name}.</p>
        <form method="POST" action="/add/scenario" id="frm">
            <div class="field">
                <label for="suite">Suite</label>
                <input type="text" readonly name="suite" id="suite" value="${suite.name}">
            </div>
            <div class="field">
                <label for="description">Description</label>
                <input type="text" name="description" id="description" placeholder="Make sure homepage loads">
            </div>
            <div class="field">
                <label for="path">Path</label>
                <input type="text" name="path" id="path" value="/" placeholder="/">
            </div>
            <div class="field">
                <label for="type">Type</label>
                <select name="type" id="type">
                    <option value="html">HTML/DOM (Cheerio)</option>
                    <option value="browser">Browser (Puppeteer)</option>
                    <option value="json">JSON/REST API</option>
                </select>
            </div>
            <div class="field button">
                <button type="submit">Add Scenario</button>
                <button type="button" onclick="window.location.href = '/'">Cancel</button>
            </div>
        </form>
    `;
  return sendOutput(response, output);
};

const sendGetAddSuite = (response: http.ServerResponse): void => {
  let output: string = `
        <h2>New Suite</h2>
        <form method="POST" action="/add/suite" id="frm">
            <div class="field">
                <label for="suiteName">Suite Name</label>
                <input type="text" name="suiteName" id="suiteName" placeholder="smoke">
            </div>
            <div class="field">
                <label for="suiteDescription">Suite Description</label>
                <input type="text" name="suiteDescription" id="suiteDescription" placeholder="Basic smoke test of the site">
            </div>
            <fieldset>
                <legend>Base Domain</legend>`;
  Cli.config.getEnvironments().forEach((env: EnvConfig) => {
    output += `
                <div class="field">
                    <label for="env_${env.name}">${env.name}</label>
                    <input type="text" name="baseDomain[${env.name}]" id="env_${env.name}" value="${env.defaultDomain}">
                </div>`;
  });
  output += `</fieldset>
            <fieldset>
                <legend>First Scenario</legend>
                <div class="field">
                    <label for="scenarioDescription">Title</label>
                    <input type="text" name="scenarioDescription" id="scenarioDescription" placeholder="Make sure homepage loads">
                </div>
                <div class="field">
                    <label for="scenarioPath">Path</label>
                    <input type="text" name="scenarioPath" id="scenarioPath" value="/" placeholder="/">
                </div>
                <div class="field">
                    <label for="scenarioType">Type</label>
                    <select name="scenarioType" id="scenarioType">
                        <option value="html">HTML/DOM (Cheerio)</option>
                        <option value="browser">Browser (Puppeteer)</option>
                        <option value="json">JSON/REST API</option>
                    </select>
                </div>
            </fieldset>
            <div class="field button">
                <button type="submit">Add Suite</button>
                <button type="button" onclick="document.location.href='/'">Cancel</button>
            </div>
        </form>
    `;
  sendOutput(response, output);
};

const sendGetImport = (response: http.ServerResponse): void => {
  let output: string = `
        <h2>Import Suite</h2>
    `;
  const detachedSuites: string[] = Cli.findDetachedSuites();
  if (detachedSuites.length == 0) {
    output += "<p>There are no unattached *.js files in test folder.</p>";
  } else {
    output += `
            <script>
                function importSuite() {
                    var form = document.getElementById("frmImport");
                    var e = document.getElementById("ddFile");
                    var file = e.options[e.selectedIndex].value;
                    if (file) {
                        if (confirm('Import this file ' + file + '.js?')) {
                            form.submit();
                        }
                    }
                    else {
                        alert('No file selected.');
                    }
                }
            </script>
            <form method="POST" id="frmImport" action="/import/suite">
                <div class="field">
                    <label for="ddFile">File to Import</label>
                    <select name="suite" id="ddFile">
        `;
    detachedSuites.forEach((file: string) => {
      output += `
                    <option value="${file}">${file}</option>
            `;
    });
    output += `
                    </select>
                </div>
                <div class="field button">
                    <button type="button" onclick="importSuite()">Import</button>
                    <button type="button" onclick="window.location.href = '/'">Cancel</button>
                </div>
            </form>
        `;
  }
  sendOutput(response, output);
};

const removeSuite = (
  response: http.ServerResponse,
  suiteName: string
): void => {
  Cli.config.removeSuite(suiteName);
  Cli.config
    .save()
    .then(() => {
      sendOutput(
        response,
        `Removed suite <em>${suiteName}</em>, but did not delete the file. <a href="/">Back</a>`
      );
    })
    .catch((ex) => {
      sendOutput(response, `Error: ${ex}`);
    });
};

const removeEnv = (response: http.ServerResponse, envName: string): void => {
  Cli.config.removeEnvironment(envName);
  Cli.config
    .save()
    .then(() => {
      sendOutput(
        response,
        `Removed environment <em>${envName}</em>, no test scenarios were altered. <a href="/">Back</a>`
      );
    })
    .catch((ex) => {
      sendOutput(response, `Error: ${ex}`);
    });
};

const initProject = (response: http.ServerResponse, postData: any): void => {
  if (!postData.projectName || !postData.testsPath) {
    return sendOutput(
      response,
      `<p>Project name and test path are required. <a href="/init">Try again</a></p>`
    );
  }
  Cli.init({
    project: {
      name: postData.projectName,
      path: postData.testsPath,
    },
    environments: [],
  })
    .then(() => {
      // Loop through all of the possible environments and see which they checked
      let countEnvs: number = 0;
      possibleEnvironments.forEach((env) => {
        // If this env was checked
        if (postData[`envName[${env}]`]) {
          const domain: string = postData[`envDomain[${env}]`];
          Cli.config.addEnvironment({
            name: env,
            defaultDomain: domain,
          });
          countEnvs++;
        }
      });
      // Require at least one environment
      if (countEnvs == 0) {
        Cli.config.addEnvironment({
          name: "dev",
        });
        countEnvs++;
      }
      // Save the config file with environments
      Cli.config
        .save()
        .then(() => {
          sendOutput(
            response,
            `
                            <p><em>Awesome!</em> You're ready to get going. Flagpole has been initialized in this project.</p>
                            <p>Next, we recommend you <strong><a href="/add/suite">add your first test suite</a></strong>.</p>
                            <p>Or you can <a href="/">skip this step</a>.</p>
                        `
          );
        })
        .catch((err) => {
          sendOutput(
            response,
            `
                            <p>Flagpole was initialized, but there was a problem saving environments: ${err}</p>
                            <p><a href="/">Continue</a></p>
                        `
          );
        });
    })
    .catch((err) => {
      sendOutput(
        response,
        `<p>Error initializing: ${err}</p>p><a href="/init">Try again</a></p>`
      );
    });
};

const addSuite = (
  response: http.ServerResponse,
  suite: iSuiteOpts,
  scenario: iScenarioOpts
): void => {
  Cli.addSuite(suite, scenario)
    .then(() => {
      sendOutput(
        response,
        `Added new suite <em>${suite.name}</em>. <a href="/">Back</a>`
      );
    })
    .catch((err) => {
      sendOutput(response, `Error: ${err}`);
    });
};

const addEnv = (response: http.ServerResponse, env: EnvConfig): void => {
  if (Cli.config.environments[env.name]) {
    sendOutput(response, "Error: Environment name is already taken.");
  } else {
    Cli.config.addEnvironment({
      name: env.name,
      defaultDomain: env.defaultDomain,
    });
    Cli.config
      .save()
      .then(() => {
        sendOutput(
          response,
          `Added new environment <em>${env.name}</em>. <a href="/">Back</a>`
        );
      })
      .catch((ex) => {
        sendOutput(response, `Error: ${ex}`);
      });
  }
};

const runSuite = (
  response: http.ServerResponse,
  suiteName: string,
  envName: string
): void => {
  let opts = FlagpoleExecutionOptions.createFromString(
    `-h -o json -e ${envName} -x`
  );
  const execution: SuiteExecution = SuiteExecution.executePath(
    Cli.config.suites[suiteName].getTestPath(),
    opts
  );
  execution.result
    .then((result: SuiteExecutionResult) => {
      const json: any = JSON.parse(result.output.join(" "));
      let output: string = `<h2>${json.title}</h2>`;
      json.scenarios.forEach((scenario: any) => {
        output += `<article><h3>${scenario.title}</h3>`;
        output += "<ul>";
        scenario.log.forEach((logLine: any) => {
          output += `<li class="${logLine.type.toLowerCase()}">${
            logLine.message
          }</li>`;
        });
        output += "</ul></article>";
      });
      output += `<p><a href="/">Back</a></p>`;
      sendOutput(response, output);
    })
    .catch((err) => {
      sendOutput(response, err);
    });
};

const sendIndex = (response: http.ServerResponse): void => {
  const suites: SuiteConfig[] = Cli.config.getSuites();
  let output: string = `
                <ul>
                    <li>Project Name: ${Cli.config.project.name}</li>
                    <li>Config Path: ${Cli.configPath}</li>
                    <li>Project Path: ${Cli.projectPath}</li>
                    <li>Environment: ${FlagpoleExecution.opts.environment}</li>
                </ul>
                <h2>List of Suites</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Tags</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
  suites.forEach((suite: SuiteConfig) => {
    output += `
                    <tr>
                        <td>${suite.name}</td>
                        <td>
                            ${
                              suite.tags.length
                                ? suite.tags.join(", ")
                                : "<em>no tags</em>"
                            }
                        </td>
                        <td>
                            <form method="POST" action="/run">
                                <button type="submit" name="suite" value="${
                                  suite.name
                                }">Run</button>
                            </form>
                            <form method="GET" action="/suite">
                                <button type="submit" name="name" value="${
                                  suite.name
                                }">Edit</button>
                            </form>
                            <form method="GET" action="/add/scenario">
                                <button type="submit" name="suite" value="${
                                  suite.name
                                }">Add Scenario</button>
                            </form>
                            <form method="POST" id="rm_suite_${suite.name}">
                                <button type="button" onclick="removeSuite('${
                                  suite.name
                                }')">Remove</button>
                            </form>
                        </td>
                    </tr>
                `;
  });
  output += `
                </tbody>
                </table>
                <div class="field button">
                    <form method="GET" action="/add/suite">
                        <button type="subit">New Suite</button>
                    </form>
                    <form method="GET" action="/import/suite">
                        <button type="submit">Import Suite</button>
                    </form>
                </div>
            `;
  output += `
                <h2>List of Environments</h2>
                <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Base Path</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
            `;
  Cli.config.getEnvironments().forEach((env: EnvConfig) => {
    output += `
                    <tr>
                        <td>${env.name}</td>
                        <td>
                            <a href="${env.defaultDomain}" target="_new">${env.defaultDomain}</a>
                        </td>
                        <td>
                            <form method="POST" action="/rm?env=${env.name}" id="rm_env_${env.name}">
                                <button type="button" onclick="removeEnv('${env.name}')">Remove</button>
                            </form>
                        </td>
                    </tr>
                `;
  });
  output += `
                </tbody>
                </table>
                <div class="field button">
                    <form method="GET" id="addEnv" action="/add/env">
                        <button type="submit">Add Environment</button>
                    </form>
                </aside>
                <script>
                        function removeEnv(envName) {
                            const yes = confirm('Remove this environment ' + envName + '?')
                            if (yes) {
                                const form = document.querySelector('#rm_env_' + envName);
                                form.setAttribute('action', '/rm?env=' + envName);
                                form.submit();
                            }
                        }
                        function removeSuite(suiteName) {
                            const yes = confirm('Remove this suite ' + suiteName + '?')
                            if (yes) {
                                const form = document.querySelector('#rm_suite_' + suiteName);
                                form.setAttribute('action', '/rm?suite=' + suiteName);
                                form.submit();
                            }
                        }
                    </script>
            `;
  sendOutput(response, output);
};

export function serve(port: number = 3000) {
  const handler = (request: any, response: http.ServerResponse) => {
    const requestPath: string = request.url || "/";
    const method: string = (request.method || "GET").toUpperCase();
    const url = new URL(requestPath, `http://localhost:${server.httpPort}`);
    const route: string = `${method} ${url.pathname}`;

    function respond(postData?: any) {
      return routes[route]
        ? routes[route](url, response, postData)
        : sendIndex(response);
    }

    // If they haven't yet initialized the project (and aren't trying to do so), make them do init
    if (!Cli.isInitialized() && requestPath != "/init") {
      return sendGetInit(response);
    }
    // If this is a POST, we need to process the post data
    else if (method == "POST") {
      let body: string = "";
      request.on("data", function (data) {
        body += String(data);
        // Too much POST data, kill the connection!
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.length > 1e6) {
          request.connection.destroy();
        }
      });
      request.on("end", function () {
        respond(qs.parse(body));
      });
    }
    // Route the request
    else {
      respond();
    }
  };

  const server: WebServer = new WebServer(handler);

  server.listen(port).then(() => {
    const url: string = `http://localhost:${server.httpPort}/`;
    console.log(`Flagpole Web Server running at: ${url}`);
    open(url);
  });
}
