'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var fs = require('fs');
var pathHelper = require('path');
var pathSeparator = pathHelper.sep;

var _require = require('cucumber'),
    PickleFilter = _require.PickleFilter,
    getTestCasesFromFilesystem = _require.getTestCasesFromFilesystem;

var _require2 = require('events'),
    EventEmitter = _require2.EventEmitter;

var eventBroadcaster = new EventEmitter();

/**
 * Helper class containing some util functions
 */

var Helper = function () {
  function Helper() {
    _classCallCheck(this, Helper);
  }

  _createClass(Helper, null, [{
    key: 'getRetryCountFromPath',


    /**
     * Helper function to get the number of retries from the path of the report file of the scenario.
     * @param path The path of the report file for the given scenario
     * @returns {Number} Returns the retry count for the scenario
     */
    value: function getRetryCountFromPath(path) {
      return parseInt(path.replace('.json', '').substr(path.length - 6));
    }

    /**
     * Create the folder structure for the provided path
     * @param completePath The complete path of the file (can be just the folder structure as well)
     */

  }, {
    key: 'createFolderStructure',
    value: function createFolderStructure(completePath) {
      var path = '';
      completePath = pathHelper.normalize(completePath);
      completePath.split(pathSeparator).map(function (folder) {
        if (folder === '.') {
          path += folder + pathSeparator;
        } else if (folder.indexOf('.') === -1) {
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
    }

    /**
     * Based on the report returns true if the scenario had undefined step(s), or returns false otherwise
     * @param pathToReport The path to the report file to examine
     * @returns {boolean} True if there were undefined steps, false otherwise
     */

  }, {
    key: 'hadUndefinedStep',
    value: function hadUndefinedStep(pathToReport) {
      var actualReport = JSON.parse(fs.readFileSync(pathToReport, 'utf8'))[0];
      var hasUndefinedStep = false;

      if (actualReport && actualReport.elements && actualReport.elements[0]) {
        actualReport.elements[0].steps.map(function (step) {
          hasUndefinedStep = step.result.status === 'undefined' ? true : hasUndefinedStep;
        });
      }

      return hasUndefinedStep;
    }

    /**
     * Collects all scenarios to 'arrayOfScenarioPaths' variable, sorted by some special tags if they were provided
     */

  }, {
    key: 'getScenarios',
    value: function getScenarios(tagsToGet, weightingTags) {
      var fPaths = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : ['./features'];

      var allScenarios = [];
      var sortedScenarios = [];
      var tagExpression = '';
      var featuresPaths = [];

      [].concat(fPaths).map(function (path) {
        loadFeatureFilesFromDir(path);
      });

      function loadFeatureFilesFromDir(path) {
        fs.readdirSync(path).forEach(function (file) {
          if (fs.lstatSync(pathHelper.resolve(process.cwd(), path, file)).isDirectory()) {
            loadFeatureFilesFromDir(pathHelper.resolve(process.cwd(), path, file));
          } else {
            if (pathHelper.extname(file) === '.feature') {
              featuresPaths.push(pathHelper.resolve(process.cwd(), path, file));
            }
          }
        });
      }

      if (Array.isArray(tagsToGet.tags)) {
        tagsToGet.tags.map(function (tag, index) {
          if (index !== 0) {
            tagExpression += ' and ';
          }
          if (tag.indexOf('~') === -1 && tag.indexOf(',') === -1) {
            tagExpression += tag;
          } else if (tag.indexOf('~') !== -1 && tag.indexOf(',') === -1) {
            tagExpression += "not " + tag.replace('~', '');
          } else if (tag.indexOf('~') !== -1 && tag.indexOf(',') !== -1) {
            tagExpression += "not (" + tag.replace('~', '').replace(/,/g, ' or ') + ")";
          } else if (tag.indexOf('~') === -1 && tag.indexOf(',') !== -1) {
            tagExpression += "(" + tag.replace(/,/g, ' or ') + ")";
          }
        });
      } else {
        tagExpression = tagsToGet.tags;
      }

      function getFeaturesByTagExpression() {
        return getTestCasesFromFilesystem({
          cwd: '',
          eventBroadcaster: eventBroadcaster,
          featurePaths: featuresPaths,
          order: 'defined',
          pickleFilter: new PickleFilter({
            tagExpression: tagExpression
          })
        }).then(function (results) {
          results.forEach(function (scenario) {
            allScenarios.push(scenario);
          });

          // Sort the scenarios by their size (can be defines by tag '@duration_'
          allScenarios.sort(function (scenario1, scenario2) {
            return getScenarioSize(scenario2.pickle) - getScenarioSize(scenario1.pickle);
          });
          // Create the array of (sorted) scenarios to execute
          allScenarios.map(function (scenario) {
            sortedScenarios.push(pathHelper.resolve(scenario.uri + ':' + scenario.pickle.locations[0].line));
          });
          return sortedScenarios;
        }, function (ex) {
          console.error("here Failed to load scenarios: " + ex);
          return [];
        });
      }

      function getScenarioSize(scenario) {
        var size = weightingTags.default;
        scenario.tags.forEach(function (tag) {
          if (tag.name.indexOf(weightingTags.pattern) > -1) {
            size = weightingTags[tag.name.replace(weightingTags.pattern, '')] || size;
          }
        });
        return size;
      }

      return getFeaturesByTagExpression();
    }

    /**
     * Set the environment variables got in parameter if they are not yet set
     * @param varsToSet {object} Key value pair of environment variables and their values to set.
     */

  }, {
    key: 'setEnvironmentVariables',
    value: function setEnvironmentVariables(varsToSet) {
      if (varsToSet !== undefined) {
        Object.keys(varsToSet).map(function (varName) {
          process.env[varName] = process.env[varName] || varsToSet[varName];
        });
      }
    }
  }]);

  return Helper;
}();

module.exports = Helper;