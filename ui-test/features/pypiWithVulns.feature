Feature: pypi tests with vulns
    As a user I want to see vulnerabilities in my pypi manifest file
    Scenario: run ui tests on pypi ecosystem with vulns
        Given manifests folder ia added into workspace 
        When I open requirements.txt file into editor
        Then I Should be able to see it in editor
        And I should clear all other tabs opened in editor

    Scenario: Check for CA in editor
        Given requirements.txt is present in editor
        When CA is successfully triggered
        Then I Should be able to move my pointer to vulnerable dependency location
        And I should wait for 2 seconds
        And I should able see the yellow bulb
        And I Should be able to click on the bulb
        And I should move my pointer back to start of file

    Scenario: Check if problems view is not empty
        Given CA is successfully triggered
        When I open problems view
        Then I Should be able to see vulnerabilities
        And I should confirm it is not empty

    Scenario: Check for SA in editor triggered from notification
        Given CA is successfully triggered
        And requirements.txt is present in editor
        When I open notifications view
        Then I Should be able to see warning notifiacation generated by extension
        And I should be able to click ont it
        And I should wait for 30 seconds
        And I should confirm that no notification got triggered again
        And I should confirm that detailed report is opened in editor
        And I should close all tabs except requirements.txt file
        And I should delete target folder if created

    Scenario: Check for SA in editor triggered from statusbar
        Given CA is successfully triggered
        And requirements.txt is present in editor
        When I click on statusbar button
        Then I Should be able to click on it
        And I should wait for 30 seconds
        And I should confirm that detailed report is opened in editor
        And I should close all tabs except requirements.txt file
        And I should delete target folder if created

    Scenario: Check for SA in editor triggered from PIE button
        Given CA is successfully triggered
        And requirements.txt is present in editor
        When I click on PIE button
        Then I Should be able to click on it
        And I should wait for 30 seconds
        And I should confirm that detailed report is opened in editor
        And I should close all tabs except requirements.txt file
        And I should delete target folder if created
        And close all tabs opened in editor

    