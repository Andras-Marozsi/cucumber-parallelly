@all @feature2
Feature: Example scenarios 2

  @scenario5 @odds
  Scenario Outline: something for scenario5
    Given there are steps defined
    Then check <sth1> and <sth2>

    Examples: example
      | sth1 | sth2 |
      | val1 | val2 |
      | val1 | val2 |

  @scenario6 @evens
  Scenario: something for scenario6
    When there are steps defined
    Then there are steps defined
