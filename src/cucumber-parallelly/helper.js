"use strict";

var
  fs = require('fs'),
  pathHelper = require('path'),
  pathSeparator = pathHelper.sep;

const { PickleFilter, getTestCasesFromFilesystem } = require('cucumber');
const { EventEmitter } = require('events');
const eventBroadcaster = new EventEmitter();

/**
 * Helper class containing some util functions
 */
class Helper {

  /**
   * Helper function to get the number of retries from the path of the report file of the scenario.
   * @param path The path of the report file for the given scenario
   * @returns {Number} Returns the retry count for the scenario
   */
  static getRetryCountFromPath (path) {
    return parseInt(path.replace('.json', '').substr(path.length - 6))
  }

  /**
   * Create the folder structure for the provided path
   * @param completePath The complete path of the file (can be just the folder structure as well)
   */
  static createFolderStructure (completePath) {
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
  static hadUndefinedStep (pathToReport) {
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
  static getScenarios (tagsToGet, weightingTags, fPaths = ['./features']) {
    var
      allScenarios = [],
      sortedScenarios = [],
      tagExpression = '',
      featuresPaths = [];

    [].concat(fPaths).map(function (path) {
      loadFeatureFilesFromDir(path);
    });

    function loadFeatureFilesFromDir (path) {
      fs.readdirSync(path).forEach(file => {
        if (fs.lstatSync(pathHelper.resolve(process.cwd(), path, file)).isDirectory()) {
          loadFeatureFilesFromDir(pathHelper.resolve(process.cwd(), path, file))
        } else {
          if (pathHelper.extname(file) == '.feature') {
            featuresPaths.push(pathHelper.resolve(process.cwd(), path, file));
          }
        }
      })
    }

    if (Array.isArray(tagsToGet.tags)) {
      tagsToGet.tags.map(function (tag, index) {
        if (index != 0) {
          tagExpression += ' and '
        }
        if (tag.indexOf('~') == -1 && tag.indexOf(',') == -1) {
          tagExpression += tag;
        } else if (tag.indexOf('~') != -1 && tag.indexOf(',') == -1) {
          tagExpression += "not " + tag.replace('~', '');
        } else if (tag.indexOf('~') != -1 && tag.indexOf(',') != -1) {
          tagExpression += "not (" + tag.replace('~', '').replace(/,/g, ' or ') + ")";
        } else if (tag.indexOf('~') == -1 && tag.indexOf(',') != -1) {
          tagExpression += "(" + tag.replace(/,/g, ' or ') + ")";
        }
      })
    } else {
      tagExpression = tagsToGet.tags;
    }

    function getFeaturesByTagExpression () {
      return getTestCasesFromFilesystem({
        cwd: '',
        eventBroadcaster: eventBroadcaster,
        featurePaths: featuresPaths,
        pickleFilter: new PickleFilter({
          tagExpression: tagExpression
        })
      }).then(function (results) {
        results.forEach(function (scenario) {
          allScenarios.push(scenario);
        });

        // Sort the scenarios by their size (can be defines by tag '@duration_'
        allScenarios.sort(function (scenario1, scenario2) {
          return getScenarioSize(scenario2.pickle) - getScenarioSize(scenario1.pickle)
        });
        // Create the array of (sorted) scenarios to execute
        allScenarios.map(function (scenario) {
          sortedScenarios.push(pathHelper.resolve(scenario.uri + ':' + scenario.pickle.locations[0].line));
        });
        return sortedScenarios;
      }, function (ex) {
        console.error("Failed to load scenarios: " + ex);
        return [];
      });
    }

    function getScenarioSize (scenario) {
      var size = weightingTags.default;
      scenario.tags.forEach(function (tag) {
        if (tag.name.indexOf(weightingTags.pattern) > -1) {
          size = weightingTags[tag.name.replace(weightingTags.pattern, '')] || size;
        }
      });
      return size;
    }

    return getFeaturesByTagExpression()
  }

  /**
   * Set the environment variables got in parameter if they are not yet set
   * @param varsToSet {object} Key value pair of environment variables and their values to set.
   */
  static setEnvironmentVariables (varsToSet) {
    if (varsToSet != undefined) {
      Object.keys(varsToSet).map(function (varName) {
        process.env[varName] = process.env[varName] || varsToSet[varName];
      });
    }
  }

}

module.exports = Helper;
