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
    tagsToGet = {tags: config.tags || []},
    arrayOfScenarioPaths = [],
    testResults = {},
    startTime,
    command = "node " + config.cucumberPath + " " + config.cucumberOpts;

  /**
   * Collects all scenarios to 'arrayOfScenarioPaths' variable, sorted by some special tags if they were provided
   */
  function getScenarios() {
    var
      cucumber = require('cucumber'),
      configuration = cucumber.Cli.Configuration(tagsToGet, []),
      features = cucumber.Runtime(configuration).getFeatures(),
      allScenarios = [];

    function getScenarioSize(scenario) {
      var size = config.weightingTags.default;
      scenario.getTags().forEach(function (tag) {
        if (tag.getName().indexOf(config.weightingTags.pattern) > -1) {
          size = config.weightingTags[tag.getName().replace(config.weightingTags.pattern, '')] || size;
        }
      });
      return size;
    }

    // Get all the scenarios from the feature files
    features.getFeatures().toArray().map(function (feature) {
      feature.getFeatureElements().toArray().map(function (scenario) {
        allScenarios.push(scenario);
      });
    });
    // Sort the scenarios by their size (can be defines by tag '@duration_'
    allScenarios.sort(function (scenario1, scenario2) {
      return getScenarioSize(scenario2) - getScenarioSize(scenario1)
    });
    // Create the array of (sorted) scenarios to execute
    allScenarios.map(function (scenario) {
      arrayOfScenarioPaths.push(scenario.getUri() + ':' + scenario.getLine());
    });
  }

  /**
   * Starts to create threads to execute the scenarios. Every scenario runs in its own thread.
   */
  function processScenarios() {
    while (activeWorkers < maxWorkerCount && arrayOfScenarioPaths.length > 0) {
      var
        scenario = arrayOfScenarioPaths.shift(),
        tempReportFile = TEMP_REPORT_PATH + scenario.replace(/.*\/features\//, '').replace(':', '_') + ".json",
        execution;

      // Remove the string from the end of the path indicating it's a rerun if there's any
      scenario = scenario.replace(/_RETRY_\d+/, '');
      createFolderStructure(tempReportFile);

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
   * Helper function to get the number of retries from the path of the report file of the scenario.
   * @param path The path of the report file for the given scenario
   * @returns {Number} Returns the retry count for the scenario
   */
  function getRetryCountFromPath(path) {
    return parseInt(path.replace('.json', '').substr(path.length - 6))
  }

  /**
   * Creates the child process that will execute the scenario. The callback function for the execution will recursively
   * create scenarios as long as there are new ones to be executed.
   * The last one will call a function to show summary and terminate the execution.
   * @param scenario The 'path:line' format location of the scenario that cucumber will execute
   * @param tempReportFile The location of the temporary report file that will be attached to the report of the whole execution
   */
  function createExecution(scenario, tempReportFile) {
    return exec(command + " --format rerun --format json:" + tempReportFile + " " + scenario, function (err) {
      if (err) {
        testResults[scenario] = false;
        failedTests++;
        // If retry is enabled and the execution was the first one for the scenario
        if (tempReportFile.indexOf(RETRY_STR) == -1 && maxRetryCount > 0) {
          arrayOfScenarioPaths.push(scenario + RETRY_STR + 1);
          // If the maximum retries were not exceeded yet for the scenario
        } else if (tempReportFile.indexOf(RETRY_STR) != -1 && getRetryCountFromPath(tempReportFile) < maxRetryCount) {
          var count = getRetryCountFromPath(tempReportFile) + 1;
          arrayOfScenarioPaths.push(scenario + RETRY_STR + count);
        }
      } else {
        // If it had undefined step then mark the scenario as failed, otherwise it passed
        if (hadUndefinedStep(tempReportFile)) {
          testResults[scenario] = false;
          failedTests++;
        } else {
          testResults[scenario] = true;
          passedTests++;
        }
      }
      activeWorkers--;
      extendReport(tempReportFile);
      // If there are more tests to execute, or there are other active threads, call the parent function, otherwise finish
      if (arrayOfScenarioPaths.length === 0 && activeWorkers === 0) {
        result();
      } else {
        processScenarios();
      }
    });
  }

  /**
   * Based on the report returns true if the scenario had undefined step(s), or returns false otherwise
   * @param pathToReport The path to the report file to examine
   * @returns {boolean} True if there were undefined steps, false otherwise
   */
  function hadUndefinedStep(pathToReport) {
    var actualReport = JSON.parse(fs.readFileSync(pathToReport, 'utf8'))[0],
      hasUndefinedStep = false;

    actualReport.elements[0].steps.map(function (step) {
      hasUndefinedStep = (step.result.status == 'undefined') ? true : hasUndefinedStep;
    });

    return hasUndefinedStep;
  }

  /**
   * Overwrites the final report file with the provided parameter
   * @param content The content to be written into the file
   */
  function writeReport(content) {
    try {
      fs.writeFileSync(REPORT_FILE, content);
    } catch (ex) {
      console.error("There was an exception during the creation of report file: " + ex);
    }
  }

  /**
   * Creates an empty report file for the final report, and sets environment variables listed in config.environment if
   * there is any.
   */
  function initialize() {
    startTime = new Date();

    if (config.environment != undefined) {
      Object.keys(config.environment).map(function (varName) {
        process.env[varName] = process.env[varName] || config.environment[varName];
      });
    }

    createFolderStructure(REPORT_FILE);
    writeReport('[')
  }

  /**
   * Create the folder structure for the provided path
   * @param completePath The complete path of the file (can be just the folder structure as well)
   */
  function createFolderStructure(completePath) {
    var path = '';
    completePath.split('/').map(function (folder) {
      if (folder == '.') {
        path += folder + '/';
      } else if (folder.indexOf('.') == -1) {
        path += folder + '/';
        try {
          if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
          }
        } catch (ex) {
          console.error("There was an exception during the creation of the '" + path + "' folder: " + ex);
        }
      }
    });
  }

  /**
   * Extends the final report with the report got in parameter
   * @param pathToReport Path of the report to add to the final one
   */
  function extendReport(pathToReport) {
    var
      finalReport = JSON.parse(fs.readFileSync(REPORT_FILE, 'utf8') + ']'),
      actualReport = JSON.parse(fs.readFileSync(pathToReport, 'utf8'))[0],
      needToAdd = true;

    if (finalReport.length == 0) {
      finalReport.push(actualReport);
    } else {
      if (pathToReport.indexOf(RETRY_STR) != -1) {
        actualReport.name = actualReport.name + RETRY_STR + getRetryCountFromPath(pathToReport);
        actualReport.id = actualReport.id + RETRY_STR + getRetryCountFromPath(pathToReport);
      }
      finalReport.map(function (existingReport) {
        if ((existingReport.id + existingReport.line) == (actualReport.id + actualReport.line)) {
          existingReport.elements.push(actualReport.elements[0]);
          needToAdd = false;
        }
      });
      if (needToAdd) {
        finalReport.push(actualReport)
      }
    }
    writeReport(JSON.stringify(finalReport).slice(0, -1))
  }

  /**
   * Adds the closing parentheses to the report so that it's finished and processable.
   */
  function finalizeReport() {
    writeReport(fs.readFileSync(REPORT_FILE, 'utf8') + ']')
  }

  /**
   * Prints the summary to the console, and exits reflecting the outcome of the test execution.
   */
  function result() {
    finalizeReport();
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
   * This function will collect scenarios, execute them, creates the report file and terminates the execution at the end.
   */
  this.execute = function () {
    getScenarios();
    initialize();
    if (arrayOfScenarioPaths.length == 0) {
      result();
    } else {
      processScenarios();
    }
  };

};

module.exports = ScenariosOnWorkerPool;
