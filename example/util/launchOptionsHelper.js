const puppeteerLaunchOptions = function (browserOpts, environmentValue) {
    if (environmentValue) {
        const puppeteerLaunchOptions = {
            executablePath: '/usr/bin/chromium-browser',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        }
    
       browserOpts.puppeteerLaunchOptions = puppeteerLaunchOptions;
    }
}

exports.puppeteerLaunchOptions = puppeteerLaunchOptions;
