#!/usr/bin/env groovy

def installBuildRequirements(){
	def nodeHome = tool 'nodejs-12.20.0'
	env.PATH="${env.PATH}:${nodeHome}/bin"
	sh "npm install -g yarn"
	sh "npm install -g typescript"
	sh "npm install -g vsce"
	sh "npm install -g ovsx"
}

def buildVscodeExtension(){
	sh "yarn install"
	sh "yarn run vscode:prepublish"
}

node('rhel8'){

	stage 'Checkout fabric8-analytics-vscode-extension code'
	deleteDir()
	git url: 'https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension.git'

	stage 'install fabric8-analytics-vscode-extension build requirements'
	installBuildRequirements()

	stage 'Build fabric8-analytics-vscode-extension'
	sh "yarn install"
	sh "yarn run vscode:prepublish"

	stage 'Test fabric8-analytics-vscode-extension for staging'
	wrap([$class: 'Xvnc']) {
		sh "yarn run test-compile"
		sh "yarn test --silent"
	}

	stage "Package fabric8-analytics-vscode-extension"
	def packageJson = readJSON file: 'package.json'
	sh "vsce package -o fabric8-analytics-${packageJson.version}-${env.BUILD_NUMBER}.vsix --yarn"

	stage 'Upload fabric8-analytics-vscode-extension to staging'
	def vsix = findFiles(glob: '**.vsix')
	sh "rsync -Pzrlt --rsh=ssh --protocol=28 ${vsix[0].path} ${UPLOAD_LOCATION}/stable/vscode-dependency-analytics/"
	stash name:'vsix', includes:vsix[0].path
}

node('rhel8'){
	timeout(time:5, unit:'DAYS') {
		input message:'Approve deployment?', submitter: 'arajkuma'
	}

	stage "Publish to Marketplace"
	unstash 'vsix';

	def vsix = findFiles(glob: '**.vsix')
	// VS Code Marketplace
	withCredentials([[$class: 'StringBinding', credentialsId: 'vscode_java_marketplace', variable: 'TOKEN']]) {
		sh 'vsce publish -p ${TOKEN} --packagePath' + " ${vsix[0].path}"
	}

	// Open-vsx Marketplace
	withCredentials([[$class: 'StringBinding', credentialsId: 'open-vsx-access-token', variable: 'OVSX_TOKEN']]) {
		sh 'ovsx publish -p ${OVSX_TOKEN}' + " ${vsix[0].path}"
	}

	archive includes:"**.vsix"
}
