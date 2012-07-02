Feature: Meteorite run subcommand
  
  Scenario: Run in non-meteorite project directory
    Given I cd to "empty-dir"
    When I run `mrt`
    Then the output should contain "You're not in a Meteor project directory"

  Scenario: Run in meteorite project without a smart.json
    Given I cd to "app-without-smart-json"
    When I run `mrt` interactively
    Then the output should eventually contain "Running on: http://localhost:3000"
