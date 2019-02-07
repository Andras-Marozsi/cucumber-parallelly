const helper = require('../lib/cucumber-parallelly/helper.js')
const reportCreator = require('../lib/cucumber-parallelly/report_creator.js')
const assert = require('assert')
const fs = require('fs')
const path = require('path')

const getRetryCountFromPath_test_string1 = './reports/tmp/temp.feature_12_RETRY_1.json'
const getRetryCountFromPath_test_string2 = './reports/tmp/temp.feature_12_RETRY_3.json'
const getRetryCountFromPath_test_string3 = './reports/tmp/temp.feature_12_RETRY_X.json'
const getRetryCountFromPath_test_string4 = './reports/tmp/temp.feature_12_RETRY_1.js'

const createFolderStructure_test_string1 = './reports/tmp/1/2/3/4/5/temp.feature_12.json'

const hadUndefinedStep_test_file_path1 = './reports/examples/example_report_defined.json'
const hadUndefinedStep_test_file_path2 = './reports/examples/example_report_undefined.json'

const reportCreator_reportFile = './reports/report.json'
const extendReport_report_a = './reports/examples/example_report_for_adding_a.json'
const extendReport_report_b = './reports/examples/example_report_for_adding_b.json'
const extendReport_report_c = './reports/examples/example_report_for_adding_c.json'
const extendReport_report_ab = './reports/examples/example_report_for_adding_ab.json'
const extendReport_report_ac = './reports/examples/example_report_for_adding_ac.json'
const extendReport_report_abc = './reports/examples/example_report_for_adding_abc.json'

describe('lib/cucumber-parallelly/helper.js', function () {

  describe('getRetryCountFromPath', function () {
    it("should return 1 for test string: '" + getRetryCountFromPath_test_string1 + "'", function () {
      assert.equal(1, helper.getRetryCountFromPath(getRetryCountFromPath_test_string1))
    })
    it("should return 3 for test string: '" + getRetryCountFromPath_test_string2 + "", function () {
      assert.equal(3, helper.getRetryCountFromPath(getRetryCountFromPath_test_string2))
    })
    it("should return NaN for test string: '" + getRetryCountFromPath_test_string3 + "", function () {
      assert.equal('NaN', helper.getRetryCountFromPath(getRetryCountFromPath_test_string3).toString())
    })
    it("should return NaN for test string: '" + getRetryCountFromPath_test_string4 + "'", function () {
      assert.equal('NaN', helper.getRetryCountFromPath(getRetryCountFromPath_test_string4).toString())
    })
  })

  describe('createFolderStructure', function () {
    it("should create folder structure without exceptions: '" + createFolderStructure_test_string1 + "'", function () {
      helper.createFolderStructure(createFolderStructure_test_string1)
    })
  })

  describe('hadUndefinedStep', function () {
    it("should return false for test report file: '" + hadUndefinedStep_test_file_path1 + "'", function () {
      assert.equal(false, helper.hadUndefinedStep(hadUndefinedStep_test_file_path1))
    })
    it("should return true for test report file: '" + hadUndefinedStep_test_file_path2 + "'", function () {
      assert.equal(true, helper.hadUndefinedStep(hadUndefinedStep_test_file_path2))
    })
  })

  describe('getScenarios', function () {
    it("should not return scenarios if features path does not contain features", function () {
      return helper.getScenarios({ tags: [] }, { pattern: '', default: 1 }, ['./lib']).then(function (resp) {
        assert.deepEqual(resp, [])
      })
    })
    it("should return all scenarios from a specific feature path", function () {
      const expectedArray = [
        path.join(path.resolve('./test/features'), 'example3.feature:11')
      ]
      return helper.getScenarios({ tags: [] }, { pattern: '', default: 1 }, ['./test/features']).then(function (resp) {
        assert.deepEqual(resp, expectedArray)
      })
    })
    it("should return all scenarios for empty array of tags", function () {
      const expectedArray = [
        path.join(path.resolve('./features'), 'example1.feature:11'),
        path.join(path.resolve('./features'), 'example1.feature:21'),
        path.join(path.resolve('./features'), 'example1.feature:22'),
        path.join(path.resolve('./features'), 'example1.feature:27'),
        path.join(path.resolve('./features'), 'example1.feature:28'),
        path.join(path.resolve('./features'), 'example1.feature:31'),
        path.join(path.resolve('./features'), 'example1.feature:37'),
        path.join(path.resolve('./features'), 'example2.feature:11'),
        path.join(path.resolve('./features'), 'example2.feature:12'),
        path.join(path.resolve('./features'), 'example2.feature:15')
      ]
      return helper.getScenarios({ tags: [] }, { pattern: '', default: 1 }).then(function (resp) {
        assert.deepEqual(resp, expectedArray)
      })
    })
    it("should return all scenarios for tag '@all'", function () {
      const expectedArray = [
        path.join(path.resolve('./features'), '/example1.feature:11'),
        path.join(path.resolve('./features'), '/example1.feature:21'),
        path.join(path.resolve('./features'), '/example1.feature:22'),
        path.join(path.resolve('./features'), '/example1.feature:27'),
        path.join(path.resolve('./features'), '/example1.feature:28'),
        path.join(path.resolve('./features'), '/example1.feature:31'),
        path.join(path.resolve('./features'), '/example1.feature:37'),
        path.join(path.resolve('./features'), '/example2.feature:11'),
        path.join(path.resolve('./features'), '/example2.feature:12'),
        path.join(path.resolve('./features'), '/example2.feature:15')
      ]
      return helper.getScenarios({ tags: ['@all'] }, { pattern: '', default: 1 }).then(function (resp) {
        assert.deepEqual(resp, expectedArray)
      })
    })
    it("should return a subset of scenarios for tag '@evens'", function () {
      const expectedArray = [
        path.join(path.resolve('./features'), '/example1.feature:21'),
        path.join(path.resolve('./features'), '/example1.feature:22'),
        path.join(path.resolve('./features'), '/example1.feature:27'),
        path.join(path.resolve('./features'), '/example1.feature:28'),
        path.join(path.resolve('./features'), '/example1.feature:37'),
        path.join(path.resolve('./features'), '/example2.feature:15')
      ]
      return helper.getScenarios({ tags: ['@evens'] }, { pattern: '', default: 1 }).then(function (resp) {
        assert.deepEqual(resp, expectedArray)
      })
    })
    it("should return a subset of scenarios for tag '@scenario2 @acceptance'", function () {
      const expectedArray = [
        path.join(path.resolve('./features'), '/example1.feature:21'),
        path.join(path.resolve('./features'), '/example1.feature:22')
      ]
      return helper.getScenarios({ tags: ['@evens', '@acceptance'] }, {
        pattern: '',
        default: 1
      }).then(function (resp) {
        assert.deepEqual(resp, expectedArray)
      })
    })
    it("should return a subset of scenarios for tag '@scenario2 ~@regression'", function () {
      const expectedArray = [
        path.join(path.resolve('./features'), '/example1.feature:21'),
        path.join(path.resolve('./features'), '/example1.feature:22')
      ]
      return helper.getScenarios({ tags: ['@scenario2', "~@regression"] }, {
        pattern: '',
        default: 1
      }).then(function (resp) {
        assert.deepEqual(resp, expectedArray)
      })
    })
    it("should return no scenarios for tag 'all'", function () {
      return helper.getScenarios({ tags: ['all'] }, { pattern: '', default: 1 }).then(function (resp) {
        assert.deepEqual(resp, [])
      })
    })
  })

  describe('setEnvironmentVariables', function () {
    it("should not fail without any parameter", function () {
      helper.setEnvironmentVariables()
    })
    it("should not fail with empty parameter", function () {
      helper.setEnvironmentVariables({})
    })
    it("should set env variables which are undefined", function () {
      helper.setEnvironmentVariables({ NO_SUCH_VAR0101: 'has_value' })
      assert.equal('has_value', process.env.NO_SUCH_VAR0101)
    })
    it("should not set env variables already set", function () {
      process.env.NO_SUCH_VAR0102 = 'initial_value'
      helper.setEnvironmentVariables({ NO_SUCH_VAR0102: 'has_value' })
      assert.equal('initial_value', process.env.NO_SUCH_VAR0102)
    })
  })
})

describe('lib/cucumber-parallelly/report_creator.js', function () {

  describe('init', function () {
    it("should be able create and add '[' to report file: '" + reportCreator_reportFile + "'", function () {
      reportCreator.init(reportCreator_reportFile)
      assert.equal('[', fs.readFileSync(reportCreator_reportFile))
    })
  })

  describe('writeReport', function () {
    it("should be able to write report file: '" + reportCreator_reportFile + "' with any string", function () {
      const testValue = 'writeReportTest1'
      reportCreator.writeReport(testValue)
      assert.equal(testValue, fs.readFileSync(reportCreator_reportFile))
    })
    it("should be able to write report file: '" + reportCreator_reportFile + "' with stringified json", function () {
      const inputValue = fs.readFileSync(extendReport_report_a, 'utf8')
      reportCreator.writeReport(inputValue)
      assert.equal(inputValue, fs.readFileSync(reportCreator_reportFile, 'utf8'))
    })
  })

  describe('extendReport', function () {
    it("should be able to append 'a' and 'b' reports", function () {
      reportCreator.init(reportCreator_reportFile)
      reportCreator.extendReport(extendReport_report_a)
      reportCreator.extendReport(extendReport_report_b)
      reportCreator.finalizeReport()
      assert.equal(fs.readFileSync(extendReport_report_ab, 'utf8').replace(/\s/g, ''),
        fs.readFileSync(reportCreator_reportFile, 'utf8').replace(/\s/g, ''))
    })
    it("should be able to append 'a' and 'c' reports", function () {
      reportCreator.init(reportCreator_reportFile)
      reportCreator.extendReport(extendReport_report_a)
      reportCreator.extendReport(extendReport_report_c)
      reportCreator.finalizeReport()
      assert.equal(fs.readFileSync(extendReport_report_ac, 'utf8').replace(/\s/g, ''),
        fs.readFileSync(reportCreator_reportFile, 'utf8').replace(/\s/g, ''))
    })
    it("should be able to append 'a', 'b' and 'c' reports", function () {
      reportCreator.init(reportCreator_reportFile)
      reportCreator.extendReport(extendReport_report_a)
      reportCreator.extendReport(extendReport_report_b)
      reportCreator.extendReport(extendReport_report_c)
      reportCreator.finalizeReport()
      assert.equal(fs.readFileSync(extendReport_report_abc, 'utf8').replace(/\s/g, ''),
        fs.readFileSync(reportCreator_reportFile, 'utf8').replace(/\s/g, ''))
    })
  })

  describe('finalizeReport', function () {
    it("should put a ']' to report file: '" + reportCreator_reportFile + "'", function () {
      reportCreator.writeReport('')
      reportCreator.finalizeReport()
      assert.equal(']', fs.readFileSync(reportCreator_reportFile))
    })
  })

})
