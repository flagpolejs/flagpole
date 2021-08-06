import flagpole from "../../dist/index";

const sites = [
   'https://github.com/SheetJS/sheetjs',
   'https://github.com/OAI/OpenAPI-Specification',
   'https://github.com/alyssaxuu/mapus',
   'https://github.com/sveltejs/kit',
   'https://github.com/WordPress/gutenberg',
   'https://github.com/rollup/rollup',
   'https://github.com/outline/outline',
   'https://github.com/hexojs/hexo',
   'https://github.com/clouDr-f2e/rubick',
   'https://github.com/fabricjs/fabric.js',
   'https://github.com/github/docs',
   'https://github.com/jitsi/jitsi-meet',
   'https://github.com/ryanmcdermott/clean-code-javascript',
   'https://github.com/testjavascript/nodejs-integration-tests-best-practices',
   'https://github.com/handsontable/handsontable',

];

const suite = flagpole('View five GitHub repos at a time')
   .setConcurrencyLimit(5) // run up to five browsers in parallel

sites.forEach((site) => {
   suite
      .scenario(`${site} - GitHub Repo`, 'browser')
      .open(site)
      .next(async (context) => {
         await context.pause(5000) // take time to check it out
         context.assert(context.response.statusCode).equals(200);
      })
});
