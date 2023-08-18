"use strict";

const fs = require('fs')
const helper = require('./helper.js')
let REPORT_FILE = './reports/report.json'
const RETRY_STR = '_RETRY_';
let finalReport = []

/**
 * Helper class responsible for the report file manipulation
 */
class ReportCreator {

  /**
   * Creates the folder structure for the final report file and initiates the final report.
   * @param reportFile The name (with path) of the final report file
   */
  static init(reportFile) {
    helper.createFolderStructure(REPORT_FILE);
    REPORT_FILE = reportFile;
    this.writeReport('');
    finalReport = []
  }

  /**
   * Overwrites the final report file with the provided parameter
   * @param content The content to be written into the file
   */
  static writeReport(content) {
    try {
      fs.writeFileSync(REPORT_FILE, content);
    } catch (ex) {
      console.error("There was an exception during the creation of report file: " + ex);
    }
  };

  /**
   * Extends the final report with the report got in parameter
   * @param pathToReport Path of the report to add to the final one
   */
  static extendReport(pathToReport) {
    var
      // finalReport = JSON.parse(fs.readFileSync(REPORT_FILE, 'utf8') + ']'),
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
        if ((existingReport.id + existingReport.line) == (actualReport.id + actualReport.line)) {
          existingReport.elements.push(actualReport.elements[0]);
          needToAdd = false;
        }
      });
      if (needToAdd) {
        finalReport.push(actualReport)
      }
    }
    // this.writeReport(JSON.stringify(finalReport).slice(0, -1))
  };

  /**
   * Adds the closing parentheses to the report so that it's finished and processable.
   */
  static finalizeReport() {
    this.writeReport(JSON.stringify(finalReport))
  }

}

module.exports = ReportCreator;
