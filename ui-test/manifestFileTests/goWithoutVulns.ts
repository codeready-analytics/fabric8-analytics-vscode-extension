import { BottomBarPanel, By, EditorView, MarkerType, NotificationType, SideBarView, StatusBar, TextEditor, until, VSBrowser, WebDriver, WebView, Workbench } from "vscode-extension-tester";
import { delay } from "../common/helperUtils";
import { expect } from 'chai';
var fs = require('fs');
var assert = require('assert');
import debug from 'debug'
import { checkForDetailedReportAndTargetFolder, closeAllFilesInEditor, openManifestFile } from "../common/testUtils";
import { triggerPIEbtn, triggerStatusBar } from "../common/subTestUtils";
import { checkDependencyNotificationAfterSATrigger } from "../common/negativeTests";
const log = debug('server');
let path = require('path');
let os = require('os');
const request = require('supertest');

export function goWithoutVulnsUITest() {
    describe('UI tests for go manifest file without vulns', () => {
        let driver: WebDriver;
        let homedir: string;
        const dir = path.resolve("./manifests1");
        let folderName = "manifests1"
        let fileName = "go.mod"
        before(async function () {
            driver = VSBrowser.instance.driver;
            homedir = dir
        });

        after(function () {
            this.timeout(10000) // 10 second timeout for setup
        })

        // delay(2000)

        describe('open manifest file', () => {
            openManifestFile(folderName, fileName);
        });


        describe('trigger SA report', () => {
            describe('negative test 2 : no notification triggered again', checkDependencyNotificationAfterSATrigger);

            describe('trigger SA report from statusbar', () => {
                // 2. Statusbar
                triggerStatusBar(folderName, fileName);
                delay(500)
            });

            describe('trigger SA report from PIE btn', () => {
                // 3. Titlebar
                triggerPIEbtn(folderName, fileName);
                delay(500)
            });

            delay(2000)
        });

        describe('clear Editor', closeAllFilesInEditor);

    });
};
