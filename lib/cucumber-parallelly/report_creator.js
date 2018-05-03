"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var fs = require('fs'),
    helper = require('./helper.js'),
    REPORT_FILE = './reports/report.json',
    RETRY_STR = '_RETRY_';

/**
 * Helper class responsible for the report file manipulation
 */

var ReportCreator = function () {
  function ReportCreator() {
    _classCallCheck(this, ReportCreator);
  }

  _createClass(ReportCreator, null, [{
    key: 'init',


    /**
     * Creates the folder structure for the final report file and initiates the final report.
     * @param reportFile The name (with path) of the final report file
     */
    value: function init(reportFile) {
      helper.createFolderStructure(REPORT_FILE);
      REPORT_FILE = reportFile;
      this.writeReport('[');
    }

    /**
     * Overwrites the final report file with the provided parameter
     * @param content The content to be written into the file
     */

  }, {
    key: 'writeReport',
    value: function writeReport(content) {
      try {
        fs.writeFileSync(REPORT_FILE, content);
      } catch (ex) {
        console.error("There was an exception during the creation of report file: " + ex);
      }
    }
  }, {
    key: 'extendReport',


    /**
     * Extends the final report with the report got in parameter
     * @param pathToReport Path of the report to add to the final one
     */
    value: function extendReport(pathToReport) {
      var finalReport = JSON.parse(fs.readFileSync(REPORT_FILE, 'utf8') + ']'),
          actualReport = JSON.parse(fs.readFileSync(pathToReport, 'utf8'))[0],
          needToAdd = true;

      if (finalReport.length == 0) {
        finalReport.push(actualReport);
      } else {
        if (pathToReport.indexOf(RETRY_STR) != -1) {
          actualReport.name = actualReport.name + RETRY_STR + helper.getRetryCountFromPath(pathToReport);
          actualReport.id = actualReport.id + RETRY_STR + helper.getRetryCountFromPath(pathToReport);
        }
        finalReport.map(function (existingReport) {
          if (existingReport.id + existingReport.line == actualReport.id + actualReport.line) {
            existingReport.elements.push(actualReport.elements[0]);
            needToAdd = false;
          }
        });
        if (needToAdd) {
          finalReport.push(actualReport);
        }
      }
      this.writeReport(JSON.stringify(finalReport).slice(0, -1));
    }
  }, {
    key: 'finalizeReport',


    /**
     * Adds the closing parentheses to the report so that it's finished and processable.
     */
    value: function finalizeReport() {
      this.writeReport(fs.readFileSync(REPORT_FILE, 'utf8') + ']');
    }
  }]);

  return ReportCreator;
}();

module.exports = ReportCreator;