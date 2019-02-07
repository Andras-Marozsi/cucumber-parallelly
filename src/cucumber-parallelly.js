require('events').EventEmitter.prototype._maxListeners = 100
const ScenariosOnWorkerPool = require('./cucumber-parallelly/parallel_executor.js')
const args = require('yargs')
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
    describe: 'Maximum retries, by default: 0'
  })
  .option('silent', {
    alias: 's',
    //default: false,
    describe: 'Show logs or suppress them, by default: false'
  })
  .option('config', {
    alias: 'c',
    default: "./cp_config.js",
    describe: 'Show logs or suppress them'
  })
  .option('exit', {
    alias: 'x',
    //default: false,
    describe: 'Exit or return with the 0(success)/1(failure)'
  })
  .option('verbose', {
    default: false,
    describe: 'Show or hide the configuration used for test execution'
  })
  .option('env', {
    alias: 'e',
    default: false,
    describe: 'The provided key=value pair will be set as environment variable. The values here overwrite the ones in the configuration file'
  })
  .option('quickEnv', {
    alias: 'q',
    default: false,
    describe: 'Quick setting for "ENVIRONMENT" env variable'
  })
  .option('features', {
    alias: 'f',
    default: 'features',
    describe: 'specify a feature path (repeatable)'
  })
  .help('h')
  .alias('h', 'help')
  .argv
let config
const fs = require('fs')
const path = require('path')

if (fs.existsSync(args.config)) {
  config = require(path.resolve(args.config))
} else {
  console.log("No config found (tried to load from: " + args.config + "), using defaults")
  config = {}
}
config.reportPath = config.reportPath || './reports/report.json'
config.tempReportPath = config.tempReportPath || './reports/tmp/'
config.weightingTags = config.weightingTags || { pattern: '', default: 1 }
config.retries = (args.retries === undefined) ? ((config.retries === undefined) ? 0 : config.retries) : args.retries
config.silent = (args.silent !== undefined) ? args.silent : (config.silent !== undefined) ? config.silent : false
config.threads = args.threads || config.threads || 5
config.tags = args.tags ? args.tags.split(' ') : config.tags ? config.tags : []
config.environment = config.environment || {}
config.featuresPaths = config.featuresPaths || args.features || []
config.exit = (args.exit === undefined) ? ((config.exit === undefined) ? true : config.exit) : args.exit

if (args['quickEnv']) {
  config.environment['ENVIRONMENT'] = args['quickEnv']
}

if (args.env) {
  if (typeof args.env == 'string') {
    let keyValue = args.env.split('=')
    if (keyValue.length !== 2) {
      console.error("Couldn't parse environment variable key=value pair '" + args.env + "'.")
      process.exit(1)
    }
    config.environment[keyValue[0]] = keyValue[1]
  } else {
    args.env.map(function (envVar) {
      let keyValue = envVar.split('=')
      if (keyValue.length !== 2) {
        console.error("Couldn't parse environment variable key=value pair '" + args.env + "'.")
        process.exit(1)
      }
      config.environment[keyValue[0]] = keyValue[1]
    })
  }
}

config.cucumberPath = config.cucumberPath || "node_modules/cucumber/bin/cucumber-js"
config.cucumberOpts = config.cucumberOpts || "--require features/step_definitions " +
  "--require features/support/env.js " +
  "--require features/support/world.js " +
  "--require features/support/hooks.js "

if (args.verbose) {
  console.log(config)
}

function execution () {
  return new ScenariosOnWorkerPool(config).execute()
}

execution()
