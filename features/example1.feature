@all @feature1
Feature: Example scenarios 1

  @scenario1 @odds
  Scenario Outline: something for scenario1
    Given there are steps defined
    Then check <sth1> and <sth2>

    Examples: example
      | sth1 | sth2 |
      | val1 | val2 |

  @scenario2 @evens
  Scenario Outline: something for scenario2
    Given there are steps defined
    Then check <sth1> and <sth2>

  @acceptance
    Examples: examples 1
      | sth1 | sth2 |
      | val1 | val2 |
      | val1 | val2 |

  @regression
    Examples: examples 2
      | sth1 | sth2 |
      | val2 | val3 |
      | val2 | val3 |

  @scenario3 @odds
  Scenario: something for scenario3
    Given there are steps defined
    When there are steps defined
    Then there are steps defined

  @scenario4 @evens
  Scenario: something for scenario4
    When there are steps defined
    Then there are steps defined
