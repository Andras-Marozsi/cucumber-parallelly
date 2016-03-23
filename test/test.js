var
  helper = require('../lib/cucumber-parallelly/helper.js'),
  assert = require('assert'),
  fs = require('fs'),
  path = require('path'),

  getRetryCountFromPath_test_string1 = './reports/tmp/temp.feature_12_RETRY_1.json',
  getRetryCountFromPath_test_string2 = './reports/tmp/temp.feature_12_RETRY_3.json',
  getRetryCountFromPath_test_string3 = './reports/tmp/temp.feature_12_RETRY_X.json',
  getRetryCountFromPath_test_string4 = './reports/tmp/temp.feature_12_RETRY_1.js',

  createFolderStructure_test_string1 = './reports/tmp/1/2/3/4/5/temp.feature_12.json',

  hadUndefinedStep_test_file_path1 = './reports/examples/example_report_defined.json',
  hadUndefinedStep_test_file_path2 = './reports/examples/example_report_undefined.json';


describe('lib/cucumber-parallelly/helper.js', function () {

  describe('getRetryCountFromPath', function () {
    it("should return 1 for test string: '" + getRetryCountFromPath_test_string1 + "'", function () {
      assert.equal(1, helper.getRetryCountFromPath(getRetryCountFromPath_test_string1));
    });
    it("should return 3 for test string: '" + getRetryCountFromPath_test_string2 + "", function () {
      assert.equal(3, helper.getRetryCountFromPath(getRetryCountFromPath_test_string2));
    });
    it("should return NaN for test string: '" + getRetryCountFromPath_test_string3 + "", function () {
      assert.equal('NaN', helper.getRetryCountFromPath(getRetryCountFromPath_test_string3).toString());
    });
    it("should return NaN for test string: '" + getRetryCountFromPath_test_string4 + "'", function () {
      assert.equal('NaN', helper.getRetryCountFromPath(getRetryCountFromPath_test_string4).toString());
    });
  });

  describe('createFolderStructure', function () {
    it("should create folder structure without exceptions: '" + createFolderStructure_test_string1 + "'", function () {
      helper.createFolderStructure(createFolderStructure_test_string1);
    });
  });

  describe('hadUndefinedStep', function () {
    it("should return false for test report file: '" + hadUndefinedStep_test_file_path1 + "'", function () {
      assert.equal(false, helper.hadUndefinedStep(hadUndefinedStep_test_file_path1));
    });
    it("should return true for test report file: '" + hadUndefinedStep_test_file_path2 + "'", function () {
      assert.equal(true, helper.hadUndefinedStep(hadUndefinedStep_test_file_path2));
    });
  });

  describe('getScenarios', function () {
    it("should return all scenarios for empty array of tags", function () {
      var expectedArray = [
        path.resolve('./features') + '/example1.feature:11',
        path.resolve('./features') + '/example1.feature:21',
        path.resolve('./features') + '/example1.feature:22',
        path.resolve('./features') + '/example1.feature:27',
        path.resolve('./features') + '/example1.feature:28',
        path.resolve('./features') + '/example1.feature:31',
        path.resolve('./features') + '/example1.feature:37',
        path.resolve('./features') + '/example2.feature:11',
        path.resolve('./features') + '/example2.feature:12',
        path.resolve('./features') + '/example2.feature:15'
      ];
      assert.deepEqual(expectedArray, helper.getScenarios({tags: []}, {pattern: '', default: 1}));
    });
    it("should return all scenarios for tag '@all'", function () {
      var expectedArray = [
        path.resolve('./features') + '/example1.feature:11',
        path.resolve('./features') + '/example1.feature:21',
        path.resolve('./features') + '/example1.feature:22',
        path.resolve('./features') + '/example1.feature:27',
        path.resolve('./features') + '/example1.feature:28',
        path.resolve('./features') + '/example1.feature:31',
        path.resolve('./features') + '/example1.feature:37',
        path.resolve('./features') + '/example2.feature:11',
        path.resolve('./features') + '/example2.feature:12',
        path.resolve('./features') + '/example2.feature:15'
      ];
      assert.deepEqual(expectedArray, helper.getScenarios({tags: ['@all']}, {pattern: '', default: 1}));
    });
    it("should return a subset of scenarios for tag '@evens'", function () {
      var expectedArray = [
        path.resolve('./features') + '/example1.feature:21',
        path.resolve('./features') + '/example1.feature:22',
        path.resolve('./features') + '/example1.feature:27',
        path.resolve('./features') + '/example1.feature:28',
        path.resolve('./features') + '/example1.feature:37',
        path.resolve('./features') + '/example2.feature:15'
      ];
      assert.deepEqual(expectedArray, helper.getScenarios({tags: ['@evens']}, {pattern: '', default: 1}));
    });
    it("should return a subset of scenarios for tag '@scenario2 @acceptance'", function () {
      var expectedArray = [
        path.resolve('./features') + '/example1.feature:21',
        path.resolve('./features') + '/example1.feature:22'
      ];
      assert.deepEqual(expectedArray, helper.getScenarios({tags: ['@evens', "@acceptance"]}, {
        pattern: '',
        default: 1
      }));
    });
    it("should return a subset of scenarios for tag '@scenario2 ~@regression'", function () {
      var expectedArray = [
        path.resolve('./features') + '/example1.feature:21',
        path.resolve('./features') + '/example1.feature:22'
      ];
      assert.deepEqual(expectedArray, helper.getScenarios({tags: ['@scenario2', "~@regression"]}, {
        pattern: '',
        default: 1
      }));
    });
    it("should return no scenarios for tag 'all'", function () {
      assert.deepEqual([], helper.getScenarios({tags: ['all']}, {pattern: '', default: 1}));
    });
  });

  describe('setEnvironmentVariables', function () {
    it("should not fail without any parameter", function () {
      helper.setEnvironmentVariables();
    });
    it("should not fail with empty parameter", function () {
      helper.setEnvironmentVariables({});
    });
    it("should set env variables which are undefined", function () {
      helper.setEnvironmentVariables({NO_SUCH_VAR0101: 'has_value'});
      assert.equal('has_value', process.env.NO_SUCH_VAR0101);
    });
    it("should not set env variables already set", function () {
      process.env.NO_SUCH_VAR0102 = 'initial_value';
      helper.setEnvironmentVariables({NO_SUCH_VAR0102: 'has_value'});
      assert.equal('initial_value', process.env.NO_SUCH_VAR0102);
    });
  });
});
