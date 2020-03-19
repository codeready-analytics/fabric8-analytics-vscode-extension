'use strict';

import * as vscode from 'vscode';

/**
 * Commonly used constants
 */
export enum GlobalState {
  // to store the current version string to localStorage
  Version = 'fabric8Version'
}

// Refer `name` from package.json
export const extensionId = 'fabric8-analytics';
// publisher.name from package.json
export const extensionQualifiedId = `redhat.${extensionId}`;
// GET request timeout
export const getRequestTimeout = 120 * 1000; // ms
// GET request polling frequency
export const getRequestPollInterval = 2 * 1000; // ms
// Custom Header values
export let vendor = "snyk";
export const packageJSON = vscode.extensions.getExtension(extensionQualifiedId).packageJSON;
export const version = packageJSON.version;