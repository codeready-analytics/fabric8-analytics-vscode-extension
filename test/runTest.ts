import * as path from 'path';

import { runTests } from 'vscode-test';

async function main() {
    try {
        // The folder containing the Extension Manifest package.json
        // Passed to `--extensionDevelopmentPath`
        const extensionDevelopmentPath = path.resolve(__dirname, '../../');

        // The path to the extension test script
        // Passed to --extensionTestsPath
        const extensionTestsPath = path.resolve(__dirname, './');

        // Download VS Code, unzip it and run the integration test
        await runTests({version: '1.48.1', extensionDevelopmentPath, extensionTestsPath, launchArgs: [path.resolve(__dirname, '../../test/resources/sampleNodeApp/')] });
    } catch (err) {
        console.error(`Failed to run tests. ${err}`);
        process.exit(1);
    }
}

main();
