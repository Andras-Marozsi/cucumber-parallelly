"use strict";

var
  fs = require('fs'),
  pathHelper = require('path'),
  pathSeparator = pathHelper.sep;

/**
 * Helper class containing some util functions
 */
class Helper {

  /**
   * Helper function to get the number of retries from the path of the report file of the scenario.
   * @param path The path of the report file for the given scenario
   * @returns {Number} Returns the retry count for the scenario
   */
  static getRetryCountFromPath(path) {
    return parseInt(path.replace('.json', '').substr(path.length - 6))
  }

  /**
   * Create the folder structure for the provided path
   * @param completePath The complete path of the file (can be just the folder structure as well)
   */
  static createFolderStructure(completePath) {
    var path = '';
    completePath = pathHelper.normalize(completePath);
    completePath.split(pathSeparator).map(function (folder) {
      if (folder == '.') {
        path += folder + pathSeparator;
      } else if (folder.indexOf('.') == -1) {
        path += folder + pathSeparator;
        try {
          if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
          }
        } catch (ex) {
          console.error("There was an exception during the creation of the '" + path + "' folder: " + ex);
        }
      }
    });
  };

  /**
   * Based on the report returns true if the scenario had undefined step(s), or returns false otherwise
   * @param pathToReport The path to the report file to examine
   * @returns {boolean} True if there were undefined steps, false otherwise
   */
  static hadUndefinedStep(pathToReport) {
    var actualReport = JSON.parse(fs.readFileSync(pathToReport, 'utf8'))[0],
      hasUndefinedStep = false;

    if (actualReport && actualReport.elements && actualReport.elements[0]) {
      actualReport.elements[0].steps.map(function (step) {
        hasUndefinedStep = (step.result.status == 'undefined') ? true : hasUndefinedStep;
      });
    }

    return hasUndefinedStep;
  };

  /**
   * Collects all scenarios to 'arrayOfScenarioPaths' variable, sorted by some special tags if they were provided
   */
  static getScenarios(tagsToGet, weightingTags, featuresPaths) {
    var
      cucumber = require('cucumber'),
      configuration = cucumber.Cli.Configuration(tagsToGet, [].concat(featuresPaths || [])),
      features = cucumber.Runtime(configuration).getFeatures(),
      allScenarios = [],
      sortedScenarios = [];

    function getScenarioSize(scenario) {
      var size = weightingTags.default;
      scenario.getTags().forEach(function (tag) {
        if (tag.getName().indexOf(weightingTags.pattern) > -1) {
          size = weightingTags[tag.getName().replace(weightingTags.pattern, '')] || size;
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
      sortedScenarios.push(scenario.getUri() + ':' + scenario.getLine());
    });
    return sortedScenarios;
  }

  /**
   * Set the environment variables got in parameter if they are not yet set
   * @param varsToSet {object} Key value pair of environment variables and their values to set.
   */
  static setEnvironmentVariables(varsToSet) {
    if (varsToSet != undefined) {
      Object.keys(varsToSet).map(function (varName) {
        process.env[varName] = process.env[varName] || varsToSet[varName];
      });
    }
  }

}

module.exports = Helper;
