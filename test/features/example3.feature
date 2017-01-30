@all @feature3
Feature: Example scenarios 3

  @scenario1 @odds
  Scenario Outline: something for scenario1
    Given there are steps defined
    Then check <sth1> and <sth2>

    Examples: example
      | sth1 | sth2 |
      | val1 | val2 |
