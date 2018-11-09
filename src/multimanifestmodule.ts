'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';

import { stackanalysismodule } from './stackanalysismodule';
import { Apiendpoint } from './apiendpoint';
import { ProjectDataProvider } from './ProjectDataProvider';
import { authextension } from './authextension';
import { stackAnalysisServices } from './stackAnalysisService';
import { StatusMessages } from './statusMessages';

export module multimanifestmodule {

    export let find_manifests_workspace: any;
    export let form_manifests_payload: any;
    export let triggerFullStackAnalyses: any;
    export let triggerManifestWs: any;
    export let manifestFileRead: any;
    export let dependencyAnalyticsReportFlow: any;

    find_manifests_workspace = (context, workspaceFolder, filesRegex, cb) => {

        let payloadData : any;
        const relativePattern = new vscode.RelativePattern(workspaceFolder, `{${filesRegex},LICENSE}`);
        vscode.workspace.findFiles(relativePattern,'**/node_modules').then(
            (result: vscode.Uri[]) => {
                if(result && result.length){
                    form_manifests_payload(result, (data) => {
                        if(data){
                            payloadData = data;
                            const options = {};
                            let thatContext: any;
                            let file_uri: string;
                            options['uri'] = `${Apiendpoint.STACK_API_URL}stack-analyses/?user_key=${Apiendpoint.STACK_API_USER_KEY}`;
                            options['formData'] = payloadData;
                            thatContext = context;

                            stackAnalysisServices.postStackAnalysisService(options, thatContext)
                            .then((respData) => {
                                console.log(`Analyzing your stack, id ${respData}`);
                                stackanalysismodule.stack_collector_count = 0;
                                stackanalysismodule.stack_collector(file_uri, respData, cb);
                            })
                            .catch((err) => {
                                cb(null);
                            });

                    } else {
                        vscode.window.showErrorMessage(`Failed to trigger application's stack analysis`);
                        cb(null);
                    }
                
                });
                } else {
                     vscode.window.showErrorMessage('No manifest file found to be analysed');
                     cb(null);
                }
                
            },
            // rejected
            (reason: any) => {
                vscode.window.showErrorMessage(reason);
                cb(null);
            });
    };


    form_manifests_payload = (resultList, callbacknew) : any => {
        let fileReadPromises: Array<any> = [];
        for(let i=0;i<resultList.length;i++){
            let fileReadPromise = manifestFileRead(resultList[i]);
            fileReadPromises.push(fileReadPromise);
        }

        Promise.all(fileReadPromises)
        .then((datas) => {
            let form_data = {
                'manifest[]': [],
                'filePath[]': [],
                'license[]': [],
                origin: 'lsp'
            };
            datas.forEach((item) => {
                if(item.manifest && item.filePath){
                    form_data['manifest[]'].push(item.manifest);
                    form_data['filePath[]'].push(item.filePath);
                }
                if(item.hasOwnProperty('license') &&  item.license.value){ 
                    form_data['license[]'].push(item.license);
                }
                //TODO : for logging 400 issue
                if (!item.manifest && !item.license) {
                    console.log('Manifest is missed', item);
                }
                if (!item.filePath && !item.license) {
                    console.log('filePath is missed', item);
                }
            });
            callbacknew(form_data);
        })
        .catch(() => {
            callbacknew(null);
        });

    };


    manifestFileRead = (fileContent) => {
        let form_data = {
            'manifest': '',
            'filePath': '',
            'license': ''
        };
        let manifestObj: any;
        let manifest_mime_type: any = {'requirements.txt' : 'text/plain', 'package.json' : 'application/json' , 'pom.xml' : 'text/xml', 'packageVersion.json' : 'application/json'};
        let licenseObj: any;

        let filePath: string = '';
        let filePathList: any = [];
        let projRoot = vscode.workspace.getWorkspaceFolder(fileContent);
        let projRootPath = projRoot.uri.fsPath;
        return new Promise((resolve, reject) => {
            let fsPath : string = fileContent.fsPath ? fileContent.fsPath : '';
            fs.readFile(fsPath, function(err, data) {
                if(data){
                    manifestObj = {
                        value: '',
                        options: {
                            filename: '',
                            contentType: 'text/plain'
                        }
                    };
                    licenseObj = {
                        value: '',
                        options: {
                            filename: '',
                            contentType: 'text/plain'
                        }
                    };
                    if(!fileContent.fsPath.endsWith('LICENSE')){
                        let filePathSplit = /(\/target|\/stackinfo|\/poms|)/g;
                        let strSplit = '/';
                        if(process && process.platform && process.platform.toLowerCase() === 'win32'){
                            filePathSplit = /(\\target|\\stackinfo|\\poms|)/g;
                            strSplit = '\\';
                        }
                        filePath = fileContent.fsPath.split(projRootPath)[1].replace(filePathSplit, '');
                        filePathList = filePath.split(strSplit);

                        manifestObj.options.filename = filePathList[filePathList.length-1];
                        manifestObj.options.contentType = manifest_mime_type[filePathList[filePathList.length-1]];
                        manifestObj.value = data.toString();
                        form_data['manifest'] = manifestObj;
                        form_data['filePath'] = filePath;
                    } else {
                        licenseObj.options.filename = 'LICENSE';
                        licenseObj.options.contentType = 'text/plain';
                        licenseObj.value = data.toString();
                        form_data['license'] = licenseObj;
                    }
                    resolve(form_data);
                } else {
                    vscode.window.showErrorMessage(err.message);
                    reject(err.message);
                }

            });
        });
     };
    
    /*
    * Needed async function in order to wait for user selection in case of 
    * multi root projects
    */
    dependencyAnalyticsReportFlow = async (context, provider, previewUri) => {
        let editor = vscode.window.activeTextEditor;
        if(editor && editor.document.fileName && editor.document.fileName.toLowerCase().indexOf('pom.xml')!== -1) {
            let workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
            if(workspaceFolder.uri.fsPath + '/pom.xml' === editor.document.fileName || workspaceFolder.uri.fsPath + '\\pom.xml' === editor.document.fileName) {
                triggerFullStackAnalyses(context, workspaceFolder, provider, previewUri);
            } else {
                stackanalysismodule.processStackAnalyses(context, editor, provider, previewUri);
            }
        } else if(editor && editor.document.fileName && editor.document.fileName.toLowerCase().indexOf('package.json')!== -1) {
            stackanalysismodule.processStackAnalyses(context, editor, provider, previewUri);
        } else if(vscode.workspace.hasOwnProperty('workspaceFolders') && vscode.workspace['workspaceFolders'].length>1){
            let workspaceFolder = await vscode.window.showWorkspaceFolderPick({ placeHolder: 'Pick Workspace Folder to which this setting should be applied' })
                if (workspaceFolder) {
                    triggerFullStackAnalyses(context, workspaceFolder, provider, previewUri);
                } else {
                    vscode.window.showInformationMessage(`No Workspace selected.`);
                }
        } else {
            let workspaceFolder = vscode.workspace.workspaceFolders[0];
            triggerFullStackAnalyses(context, workspaceFolder, provider, previewUri);
        }
    };

    triggerFullStackAnalyses = (context, workspaceFolder, provider, previewUri) => {
        provider.signalInit(previewUri,null);
        vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: StatusMessages.EXT_TITLE}, p => {
            return new Promise((resolve, reject) => {
                const relativePattern = new vscode.RelativePattern(workspaceFolder, '{pom.xml,**/package.json}');
                vscode.workspace.findFiles(relativePattern,'**/node_modules').then(
                (result: vscode.Uri[]) => {
                    if(result && result.length){
                    // Do not create an effective pom if no pom.xml is present
                    let effective_pom_skip = true;
                    let effectiveF8WsVar = 'effectivef8Package';
                    let vscodeRootpath = workspaceFolder.uri.fsPath;
                    if(process && process.platform && process.platform.toLowerCase() === 'win32'){
                        vscodeRootpath += '\\';
                    } else {
                        vscodeRootpath += '/'; 
                    }
                    let filesRegex = 'target/package.json';
                    let pom_count = 0;
                    result.forEach((item) => {
                        if (item.fsPath.indexOf('pom.xml') >= 0) {
                        effective_pom_skip = false;
                        pom_count += 1;
                        effectiveF8WsVar = 'effectivef8PomWs';
                        filesRegex = 'target/stackinfo/**/pom.xml';
                        }
                    });
    
                    if (!effective_pom_skip && pom_count === 0) {
                        vscode.window.showInformationMessage('Multi ecosystem support is not yet available.');
                        reject();
                        return;
                    } 
                    else {
                        p.report({message: StatusMessages.WIN_RESOLVING_DEPENDENCIES});
                        ProjectDataProvider[effectiveF8WsVar](vscodeRootpath, (dataEpom) => {
                            if(dataEpom){
                                p.report({message: StatusMessages.WIN_ANALYZING_DEPENDENCIES});
                                let promiseTriggerManifestWs = triggerManifestWs(context, workspaceFolder, filesRegex, provider, previewUri);
                                promiseTriggerManifestWs.then(() => {
                                p.report({message: StatusMessages.WIN_SUCCESS_ANALYZE_DEPENDENCIES});
                                resolve();
                                })
                                .catch(() => {
                                p.report({message: StatusMessages.WIN_FAILURE_ANALYZE_DEPENDENCIES});
                                reject();
                                }); 
                            } else {
                                p.report({message: StatusMessages.WIN_FAILURE_ANALYZE_DEPENDENCIES});
                                reject();
                            }
                        });
                    }
                    } else {
                    vscode.window.showInformationMessage(StatusMessages.NO_SUPPORTED_MANIFEST);
                    reject();
                    }
                },
                // Other ecosystem flow
                (reason: any) => {
                vscode.window.showInformationMessage(StatusMessages.NO_SUPPORTED_MANIFEST);
                });
            });
        });
    };

    triggerManifestWs = (context, workspaceFolder, filesRegex, provider, previewUri) => {
        return new Promise((resolve,reject) => {
            authextension.authorize_f8_analytics(context, (data) => {
            if(data){
                vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.One, StatusMessages.REPORT_TAB_TITLE).then((success) => {
                    let manifest_finder = multimanifestmodule.find_manifests_workspace;
                    manifest_finder(context, workspaceFolder, filesRegex, (data) => {
                        if(data){
                            provider.signal(previewUri, data);
                            resolve(true);
                        } else {
                            provider.signal(previewUri,null);
                            reject();
                        }
                    });
                    provider.signalInit(previewUri,null);
                }, (reason) => {
                    vscode.window.showErrorMessage(reason);
                    reject();
                });
            } else {
                reject();
            }
            });
        });
      };

}