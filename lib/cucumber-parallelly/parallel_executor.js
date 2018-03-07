/**
 * Executes the cucumber scenarios on a pool of workers parallelly
 * @param config {Object} The config object for the execution containing:
 *   config.tags {String[]} The tags that will be passed to cucumber for execution
 *   config.maxWorkerCount {number} The number of parallel threads the scenarios will be executed, by default 5
 *   config.maxRetryCount {number} The number of maximum retries for failed scenarios, by default 0,
 *   config.hideOutput {boolean} The stdout/stderr for the threads can be switched off, by default they are displayed
 *   config.reportPath {String} The path to the final report, by default './reports/report.json'
 *   config.cucumberPath {String} The path to the cucumber executable
 *   config.cucumberOpts {String} The options to start the cucumber framework
 *   config.tempReportPath {String} The path to the temp reports, by default './reports/tmp/'
 *   config.weightingTags {Object} Helper to sort scenarios by duration {pattern: '', default: 1};
 *   config.environment {Object} Key-value pair of environment variables to set, by default empty
 * @constructor
 */
var ScenariosOnWorkerPool = function (config) {

  var
    maxWorkerCount = (config.threads == undefined) ? 5 : config.threads,
    maxRetryCount = (config.retries == undefined) ? 0 : config.retries,
    hideOutput = (config.silent == undefined) ? false : config.silent,
    exec = require('child_process').exec,
    fs = require('fs'),
    REPORT_FILE = config.reportPath || './reports/report.json',
    TEMP_REPORT_PATH = config.tempReportPath || './reports/tmp/',
    RETRY_STR = '_RETRY_',
    activeWorkers = 0,
    allTests = 0,
    failedTests = 0,
    passedTests = 0,
    tagsToGet = { tags: config.tags || [] },
    arrayOfScenarioPaths = [],
    testResults = {},
    startTime,
    helper = require('./helper.js'),
    path = require('path'),
    reportCreator = require('./report_creator.js'),
    command = "node " + config.cucumberPath + " " + config.cucumberOpts;

  /**
   * Starts to create threads to execute the scenarios. Every scenario runs in its own thread.
   */
  function processScenarios() {
    while (activeWorkers < maxWorkerCount && arrayOfScenarioPaths.length > 0) {
      var
        scenario = arrayOfScenarioPaths.shift(),
        tempReportFile = (TEMP_REPORT_PATH + scenario.replace(/.*\/features\//, '').replace(/:/g, '_').replace('.', '_') + ".json").replace(/\\/g, '/'),
        execution;

      // Remove the string from the end of the path indicating it's a rerun if there's any
      scenario = scenario.replace(/_RETRY_\d+/, '');
      helper.createFolderStructure(tempReportFile);

      activeWorkers++;
      allTests++;

      execution = createExecution(scenario, tempReportFile);
      if (!hideOutput) {
        execution.stdout.pipe(process.stdout);
        execution.stderr.pipe(process.stderr);
      }
    }
  }

  /**
   * Creates the child process that will execute the scenario. The callback function for the execution will recursively
   * create scenarios as long as there are new ones to be executed.
   * The last one will call a function to show summary and terminate the execution.
   * @param scenario The 'path:line' format location of the scenario that cucumber will execute
   * @param tempReportFile The location of the temporary report file that will be attached to the report of the whole execution
   */
  function createExecution(scenario, tempReportFile) {
    scenario = path.relative('./', scenario); // on windows cucumber doesn't work well with absolute path (reads all scenarios)
    return exec(command + " --format rerun --format json:" + tempReportFile + " " + scenario, { maxBuffer: 1024 * 1000 }, function (err) {
      if (err) {
        testResults[scenario] = false;
        failedTests++;
        // If retry is enabled and the execution was the first one for the scenario
        if (tempReportFile.indexOf(RETRY_STR) == -1 && maxRetryCount > 0) {
          arrayOfScenarioPaths.push(scenario + RETRY_STR + 1);
          // If the maximum retries were not exceeded yet for the scenario
        } else if (tempReportFile.indexOf(RETRY_STR) != -1 && helper.getRetryCountFromPath(tempReportFile) < maxRetryCount) {
          var count = helper.getRetryCountFromPath(tempReportFile) + 1;
          arrayOfScenarioPaths.push(scenario + RETRY_STR + count);
        }
      } else {
        // If it had undefined step then mark the scenario as failed, otherwise it passed
        if (helper.hadUndefinedStep(tempReportFile)) {
          testResults[scenario] = false;
          failedTests++;
        } else {
          testResults[scenario] = true;
          passedTests++;
        }
      }
      activeWorkers--;
      reportCreator.extendReport(tempReportFile);
      // If there are more tests to execute, or there are other active threads, call the parent function, otherwise finish
      if (arrayOfScenarioPaths.length === 0 && activeWorkers === 0) {
        result();
      } else {
        processScenarios();
      }
    });
  }

  /**
   * Creates an empty report file for the final report, and sets environment variables listed in config.environment if
   * there is any.
   */
  function initialize() {
    startTime = new Date();
    return helper.getScenarios(tagsToGet, config.weightingTags, config.featuresPaths).then(function (scens) {
      arrayOfScenarioPaths = scens;
      helper.setEnvironmentVariables(config.environment);
      reportCreator.init(REPORT_FILE);
    })
  }

  /**
   * Prints the summary to the console, and exits reflecting the outcome of the test execution.
   */
  function result() {
    reportCreator.finalizeReport();
    var overallSuccess = 0,
      failedAfterRetry = 0,
      executionDuration = new Date() - startTime,
      min = Math.floor(executionDuration / 1000 / 60),
      sec = Math.floor((executionDuration / 1000).toFixed(2) - min * 60);

    console.log('All tests:                 ' + allTests);
    console.log('Passed tests:              ' + passedTests);
    console.log('Failed tests:              ' + failedTests);

    Object.keys(testResults).forEach(function (scenario) {
      if (!testResults[scenario]) {
        overallSuccess = 1;
        failedAfterRetry++;
        console.log(scenario + ' has failed')
      }
    });
    console.log('Failed tests (retry):      ' + failedAfterRetry);
    console.info("Execution time (" + executionDuration + "ms):   " + min + "m " + sec + "s");
    process.exit(overallSuccess)
  }

  /**
   * This function is responsible for the execution.
   * It will collect scenarios, execute them, create the report file and terminate the execution at the end.
   */
  this.execute = function () {
    return initialize().then(function () {
      if (arrayOfScenarioPaths.length == 0) {
        result();
      } else {
        processScenarios();
      }
    })
  };

};

module.exports = ScenariosOnWorkerPool;
