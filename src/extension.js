// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const zlib = require('zlib');
const fs = require('fs');
const process = require('process');
// @ts-ignore
require('./trace');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "gzipdecompressor" is now active!', process.platform);

	const myScheme = 'gz.decompress';
	const logExt = '.log';
	const gzExt = '.gz';
	const myProvider = new class {
		constructor() {
			// emitter and its event
			this.onDidChangeEmitter = new vscode.EventEmitter();
			this.onDidChange = this.onDidChangeEmitter.event;
		}

		async provideTextDocumentContent(uri, isPlain) {
			uri = uri.path.substr(logExt.length * -1) == logExt ? uri.path.slice(0, logExt.length * -1) : uri.path;
			uri += gzExt;
			let fileData = await this.readFile(uri);
			return fileData;
		}

		async readFile(fileUri) {
			var src = fs.createReadStream(fileUri);
			const stream = src.pipe(zlib.createGunzip());
			var allData = '';
			return new Promise((resolve, reject) => {
				stream.on('error', function (err) {
					console.log(err);
					resolve(reject);
				})

				stream.on('data', function (data) {
					allData += data.toString();
				})

				stream.on('end', function () {
					resolve(allData);
				})
			})
		}
	};

	async function decompressLog(uri) {
		decompress(false, uri)
	}

	async function decompressPlain(uri) {
		decompress(true, uri)
	}

	async function decompress(isPlain, uri) {
		if (uri == undefined) {
			let w = vscode.window;
			if (w.activeTextEditor == undefined
				|| w.activeTextEditor.document.uri.path.substr(gzExt.length) != gzExt) {
				uri = await vscode.window.showInputBox({
					prompt: "Enter value in gzip",
					placeHolder: "address",
					value: vscode.workspace.rootPath
				});
				uri = vscode.Uri.file(uri == undefined ? '' : uri);
			} else {
				uri = w.activeTextEditor.document.uri;
			}
		};
		let path = process.platform == 'win32' ? uri.path.substr(1).replace(/\//g, '\\') : uri.path;
		let newUri = vscode.Uri.parse(myScheme + ':' + path.slice(0, gzExt.length * -1) + (isPlain ? '' : logExt));
		let doc = await vscode.workspace.openTextDocument(newUri);
		await vscode.window.showTextDocument(doc, { preview: false });
	}

	context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(myScheme, myProvider));

	context.subscriptions.push(vscode.commands.registerCommand('gz.decompress', decompressLog));
	context.subscriptions.push(vscode.commands.registerCommand('gz.decompress.plain', decompressPlain));

    context.subscriptions.push(vscode.commands.registerCommand('gz.dialogopen', () => {
        vscode.window.showOpenDialog({canSelectMany: true, canSelectFolders: false, filters: {'gz': ['gz']}}).then(fileUris => {
			if (fileUris)
				fileUris.forEach(function (fileUri) {
					vscode.commands.executeCommand('gz.decompress', fileUri);
				});
        });
    }));
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
