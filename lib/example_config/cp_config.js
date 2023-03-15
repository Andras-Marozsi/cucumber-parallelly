var date = new Date(),
  timeStamp = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + "_" + date.getHours() + "-" + date.getMinutes() + "-" + date.getSeconds();
module.exports = {
  name: "Basic configuration for cucumber-parallelly",
  reportPath: './reports/report.json',
  tempReportPath: './reports/tmp/',
  weightingTags: {
    // optional
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
  tags: [],
  cucumberPath: "node_modules/cucumber/bin/cucumber.js",
  cucumberOpts: "--require features/step_definitions " + "--require features/support/env.js " + "--require features/support/world.js " + "--require features/support/hooks.js ",
  environment: {
    SELENIUM_SERVER: "http://localhost:4444/wd/hub",
    ENVIRONMENT: "integration",
    BROWSER_NAME: "chrome",
    LOG_FILE_FOR_EXECUTION: "./log/log_" + timeStamp + ".log"
  }
};