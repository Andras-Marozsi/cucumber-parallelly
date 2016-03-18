var
  ScenariosOnWorkerPool = require('./cucumber-parallelly/parallel_executor.js'),
  args = require('yargs')
    .usage('$0 <cmd> [args]')
    .option('tags', {
      alias: 't',
      //default: '',
      describe: 'Tags to run, by default: ""'
    })
    .option('threads', {
      alias: 'p',
      //default: 5,
      describe: 'Parallel threads to use, by default: 5'
    })
    .option('retries', {
      alias: 'r',
      //default: 2,
      describe: 'Maximum retries, by default: 2'
    })
    .option('silent', {
      alias: 's',
      //default: false,
      describe: 'Show logs or suppress them, by default: false'
    })
    .option('config', {
      alias: 'c',
      default: "./pc_config.js",
      describe: 'Show logs or suppress them'
    })
    .help('h')
    .alias('h', 'help')
    .argv,
  config,
  fs = require('fs'),
  path = require('path');

if (fs.existsSync(args.config)) {
  config = require(path.resolve(args.config));
} else {
  console.log("No config found (tried to load from: " + args.config + "), using defaults");
  config = {};
}
config.reportPath = config.reportPath || './reports/report.json';
config.tempReportPath = config.tempReportPath || './reports/tmp/';
config.weightingTags = config.weightingTags || {pattern: '', default: 1};
config.retries = (args.retries == undefined) ? ((config.retries == undefined) ? 0 : config.retries) : args.retries;
config.silent = (args.silent != undefined) ? args.silent : (config.silent != undefined) ? config.silent : false;
config.threads = args.threads || config.threads || 5;
config.tags = args.tags ? args.tags.split(' ') : [];
config.environment = config.environment || {};

new ScenariosOnWorkerPool(config).execute();
