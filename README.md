# cucumber-parallelly

[![Build Status](https://api.travis-ci.org/Andras-Marozsi/cucumber-parallelly.png?branch=master)](https://travis-ci.org/Andras-Marozsi/cucumber-parallelly)

## Usage

### Setup

cucumber-parallelly is available as an npm module, it allows you to run cucumber in a parallel fashion. You need to have cucumber installed as well.

cucumber-parallelly should be added to your test codebase as a dev dependency.  You can do this with:

``` shell
$ npm install --save-dev cucumber-parallelly
```

Alternatively you can manually add it to your package.json file:

``` json
{
  "devDependencies" : {
    "cucumber-parallelly": "latest"
  }
}
```

then install with:

``` shell
$ npm install --dev
```

### Run

cucumber-parallelly can be run from a terminal as follows:

``` shell
$ node node_modules/cucumber-parallelly/lib/cucumber-parallelly
```

By default cucumber-parallelly will look for features files under a directory called `./features`

### Configuration

cucumber-parallelly can be configured through a configuration file, and also via parameters. Let's go through the parameters first,
then see how we can collect every parameter into a single configuration file. If you need more help on configuration, try:
``` shell
$ node node_modules/cucumber-parallelly/lib/cucumber-parallelly -h
```

#### --tags (or -t)

Defines the tags to use for the test execution. Default value is none: `""`.

``` shell
$ node node_modules/cucumber-parallelly/lib/cucumber-parallelly --tags "@acceptance ~@wip"
// or
$ node node_modules/cucumber-parallelly/lib/cucumber-parallelly -t "@acceptance,@mobile ~@wip"
```

#### --threads (or -p)

Defines the number of parallel threads the test will use for execution. Default value is `5`.

``` shell
$ node node_modules/cucumber-parallelly/lib/cucumber-parallelly --threads 2
// or
$ node node_modules/cucumber-parallelly/lib/cucumber-parallelly -p 3
```

#### --retries (or -r)

Defines the number of times a failed test will be attempted to rerun. Default value is `0`.

``` shell
$ node node_modules/cucumber-parallelly/lib/cucumber-parallelly --retrires 2
// or
$ node node_modules/cucumber-parallelly/lib/cucumber-parallelly -r 1
```

#### --silent (or -s)

Boolean value to show logs of the individual threads or suppress them, by default: `false`.

``` shell
$ node node_modules/cucumber-parallelly/lib/cucumber-parallelly --silent false
// or
$ node node_modules/cucumber-parallelly/lib/cucumber-parallelly -s true
```

#### --verbose

Boolean value to show the configuration used for the execution, by default: `false`.

``` shell
$ node node_modules/cucumber-parallelly/lib/cucumber-parallelly --verbose true
```

#### --config (or -c)

Path to the configuration file if there is any. Default location: `"./cp_config.js"`

``` shell
$ node node_modules/cucumber-parallelly/lib/cucumber-parallelly --confing "./pc_config.js"
// or
$ node node_modules/cucumber-parallelly/lib/cucumber-parallelly -c ./pc_config.js
```

#### --env (or -e)

The provided key=value pair will be set as environment variable. The values here overwrite the ones in the configuration file'.

``` shell
$ node node_modules/cucumber-parallelly/lib/cucumber-parallelly --env ENVIRONMENT=dev
// or
$ node node_modules/cucumber-parallelly/lib/cucumber-parallelly -e ENVRIONMENT=dev -e 'ENV_NAME=custom value'
```

#### --features (or -f)

Path to the features path. Default `"./features"`. This values can be overwrite into configuration file (see section for the `-c` option.

``` shell
$ node node_modules/cucumber-parallelly/lib/cucumber-parallelly --features ./test/features
// or
$ node node_modules/cucumber-parallelly/lib/cucumber-parallelly -f ./test/features
```



#### Configuration file

All the above can be set in the configuration file, but there are a couple more settings there.
If something (like threads) is set in both the configuration file and via argument, the *argument value will overwrite the one in the configuration file*.

##### weightingTags

This is optional.
Can determine the order in which the tests will be executed. This can significantly decrease the duration of the test running.
From the example under: tests with tag @duration_XL will be the first one to start, and the ones with @duration_XS will be the last. By default every test which doesn't have any special tag will be executed in an alphabetical order.

##### cucumberPath

The path to the cucumber executable. By default it is in the node_modules folder, but can be set to global ("cucumber") as well, or any special location.

##### featuresPaths

The path to the features to be executed. By default it is in the folder `features`. The value can be a array to set multiple features paths.

##### cucumberOpts

The parameters to the cucumber to start with, like the different requires.
The default value is as it's in the example configuration file.

##### reportPath

The path to the final json report file.

##### tempReportPath

The path to the report files generated by each scenario. This reports will be added to the final report.

##### environment

There is a good chance that the tests need some configuration from the environment variables. Anything key value pair can be added here to be set prior to the tests. *If a value is already set, this won't overwrite that!*

##### Example configuration

``` js
var
  date = new Date(),
  timeStamp = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + "_" + date.getHours()
    + "-" + date.getMinutes() + "-" + date.getSeconds();

module.exports = {
  name: "Basic configuration for cucumber-parallelly",
  reportPath: './reports/report.json',
  tempReportPath: './reports/tmp/',
  featuresPaths: ['./test/features1', './test/features2'],
  weightingTags: {
    pattern: '@duration_',
    default: 25,
    XL: 100,
    L: 50,
    M: 25,
    S: 10,
    XS: 5
  },
  threads: 5,
  retries: 2,
  silent: false,
  tags: "",
  cucumberPath: "node_modules/cucumber/bin/cucumber.js",
  cucumberOpts: "--require features/step_definitions " +
                "--require features/support/env.js " +
                "--require features/support/world.js " +
                "--require features/support/hooks.js ",
  environment: {
    SELENIUM_SERVER: "http://localhost:4444/wd/hub",
    ENVIRONMENT: "integration",
    BROWSER_NAME: "chrome",
    LOG_FILE_FOR_EXECUTION: "./log/log_" + timeStamp + ".log"
  }
};
```
