import { WebServer } from '../webserver';
import * as http from 'http';
import { Cli } from './cli';
import { SuiteConfig, EnvConfig } from './config';
import { URL } from 'url';
import { TestRunner, iTestRunnerResult } from './testrunner';
import { Flagpole } from '..';

const fs = require('fs');
const open = require('open');

export function serve() {

    const getSuites = (): any => {
        const suites: SuiteConfig[] = Cli.config.getSuites();
        let output: any = {};
        suites.forEach((suite: SuiteConfig) => {
            output[suite.name] = {
                name: suite.name,
                path: suite.getPath()
            };
        });
        return output;
    }

    const getTemplate = (output: string, nav?: string): string => {
        let template: string = fs.readFileSync(`${__dirname}/report.html`, 'utf8');
        nav = nav || `
            <a href="/">Project Home</a>
        `;
        template = template.replace('${output}', output).replace('${nav}', nav);
        return template;
    };

    const fileNotFound = (): string => {
        return getTemplate('File not found.');
    }

    const routes = {
        'GET /api/suites': (url: URL, response: http.ServerResponse) => {
            response.end(JSON.stringify({
                suites: getSuites()
            }));
        },
        'POST /rm': (url: URL, response: http.ServerResponse) => {
            const env: string | null = url.searchParams.get('env');
            const suite: string | null = url.searchParams.get('suite');
            if (suite) {
                Cli.config.removeSuite(suite);
                Cli.config.save()
                    .then(() => {
                        response.end(getTemplate(`Removed suite <em>${suite}</em>, but did not delete the file. <a href="/">Back</a>`));
                    })
                    .catch((ex) => {
                        response.end(getTemplate(`Error: ${ex}`));
                    });
            }
            else if (env) {
                Cli.config.removeEnvironment(env);
                Cli.config.save()
                    .then(() => {
                        response.end(getTemplate(`Removed environment <em>${env}</em>. <a href="/">Back</a>`));
                    })
                    .catch((ex) => {
                        response.end(getTemplate(`Error: ${ex}`));
                    });
            }
        },
        'POST /addEnv': (url: URL, response: http.ServerResponse) => {
            const envName: string | null = url.searchParams.get('name');
            const defaultDomain: string | null = url.searchParams.get('domain');
            if (envName) {
                if (Cli.config.environments[envName]) {
                    response.end(getTemplate('Error: Environment name is already taken.'));
                }
                else {
                    Cli.config.addEnvironment(envName, { defaultDomain: defaultDomain });
                    Cli.config.save()
                        .then(() => {
                            response.end(getTemplate(`Added new environment <em>${envName}</em>. <a href="/">Back</a>`));
                        })
                        .catch((ex) => {
                            response.end(getTemplate(`Error: ${ex}`));
                        });
                }
            }
        },
        'POST /run': (url: URL, response: http.ServerResponse) => {
            const suiteName = url.searchParams.get('suite');
            if (suiteName && Cli.config.suites[suiteName]) {
                let opts: string = '-h -o json'
                if (Flagpole.getEnvironment()) {
                    opts += ' -e ' + Flagpole.getEnvironment();
                }
                TestRunner.execute(Cli.config.suites[suiteName].getPath(), opts)
                    .then((result: iTestRunnerResult) => {
                        const json: any = JSON.parse(result.output.join(' '));
                        let output: string = `<h2>${json.title}</h2>`;
                        json.scenarios.forEach((scenario: any) => {
                            output += `<article><h3>${scenario.title}</h3>`;
                            output += '<ul>'
                            scenario.log.forEach((logLine: any) => {
                                output += `<li class="${logLine.type.toLowerCase()}">${logLine.message}</li>`;
                            })
                            output += '</ul></article>'
                        });
                        response.end(getTemplate(output));
                    })
                    .catch((err) => {
                        response.end(getTemplate(err));
                    });
            }
            else {
                response.end(fileNotFound());
            }
        }
    }

    const handler = (request: http.ServerRequest, response: http.ServerResponse) => {
        const requestPath: string = request.url || '/';
        const method: string = (request.method || 'GET').toUpperCase();
        const url = new URL(requestPath, `http://localhost:${server.httpPort}`);
        const route: string = `${method} ${url.pathname}`;
        if (routes[route]) {
            routes[route](url, response);
        }
        else {
            const suites: SuiteConfig[] = Cli.config.getSuites();
            let output: string = `
                <ul>
                    <li>Project Name: ${Cli.config.project.name}</li>
                    <li>Config Path: ${Cli.configPath}</li>
                    <li>Root Path: ${Cli.rootPath}</li>
                    <li>Environment: ${Flagpole.getEnvironment()}</li>
                </ul>
                <h2>List of Suites</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Suite Name</th>
                            <th colspan="3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            suites.forEach((suite: SuiteConfig) => {
                output += `
                    <tr>
                        <td>${suite.name}</td>
                        <td>
                            <form method="POST" action="/run?suite=${suite.name}">
                                <button type="submit">Run</button>
                            </form>
                        </td>
                        <td>
                            <form method="GET" action="/add_scenario?suite=${suite.name}">
                                <button type="button" onclick="alert('Not yet supported')">Add Scenario</button>
                            </form>
                        </td>
                        <td>
                            <form method="POST" id="rm_suite_${suite.name}">
                                <button type="button" onclick="removeSuite('${suite.name}')">Remove</button>
                            </form>
                        </td>
                    </tr>
                `;
            });
            output += `
                </tbody>
                </table>
                <aside>
                    <form method="GET" action="/add_suite">
                        <button type="button" onclick="alert('Not yet supported')">Add Suite</button>
                    </form>
                </aside>
            `;
            output += `
                <h2>List of Environments</h2>
                <table>
                <thead>
                    <tr>
                        <th>Suite Name</th>
                        <th>Default Domain</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
            `;
            Cli.config.getEnvironments().forEach((env: EnvConfig) => {
                output += `
                    <tr>
                        <td>${env.name}</td>
                        <td>${env.defaultDomain}</td>
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
                <aside>
                    <form method="POST" id="addEnv">
                        <button type="button" onclick="addEnv()">Add Environment</button>
                    </form>
                </aside>
                <script>
                        function addEnv() {
                            const envName = prompt('Environment Name').trim().replace(' ', '_');
                            if (envName) {
                                const defaultDomain = (prompt('Default Domain') || '').replace(' ', '');
                                const form = document.querySelector('#addEnv');
                                form.setAttribute('action', '/addEnv?name=' + envName + '&domain=' + defaultDomain);
                                form.submit();
                            }
                        }
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
            response.end(getTemplate(output));
        }
    };

    const server: WebServer = new WebServer(handler);

    server.listen().then(() => {
        console.log(`Server listening on port ${server.httpPort}`);
        open(`http://localhost:${server.httpPort}/`);
    });
    
}