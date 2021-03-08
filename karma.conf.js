require('dotenv').config();

module.exports = function (config) {
    config.set({
        files: [{ pattern: 'tests/dist/**/*.js', type: 'module' }],

        plugins: [require.resolve('@open-wc/karma-esm'), 'karma-*'],
        esm: {
            nodeResolve: true,
            compatibility: 'min',
            babel: true,
        },
        coverageReporter: {
            includeAllSources: true,
            dir: '.coverage',
            reporters: [
                { type: 'lcov', subdir: '.' },
                { type: 'text-summary' },
            ],
        },
        browserStack: {
            username: process.env.BROWSERSTACK_USERNAME,
            accessKey: process.env.BROWSERSTACK_ACCESS_KEY,
        },
        customLaunchers: {
            chrome: {
                base: 'BrowserStack',
                browser: 'chrome',
                os: 'OS X',
                os_version: 'Big Sur',
                browser_version: '83.0',
            },
        },
        browsers: ['chrome'],
        reporters: ['progress', 'coverage'],
        frameworks: ['esm', 'mocha'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        singleRun: true,
        concurrency: Infinity,
    });
};
