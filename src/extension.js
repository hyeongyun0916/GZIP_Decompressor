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
	const ext = '.log';
	const myProvider = new class {
		constructor() {
			// emitter and its event
			this.onDidChangeEmitter = new vscode.EventEmitter();
			this.onDidChange = this.onDidChangeEmitter.event;
		}

		async provideTextDocumentContent(uri) {
			let fileData = await this.readFile(uri.path.slice(0, ext.length * -1));
			return fileData;
		}

		async readFile(fileUri) {
			var src = fs.createReadStream(fileUri);
			const stream = src.pipe(zlib.createGunzip());
			return new Promise((resolve, reject) => {
				stream.on('error', function (err) {
					console.log(err);
					resolve(reject);
				})

				stream.on('data', function (data) {
					resolve(data.toString());
				})
			})
		}
	};

	context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(myScheme, myProvider));

	context.subscriptions.push(vscode.commands.registerCommand('gz.decompress', async (uri) => {
		if (uri == undefined) {
			let w = vscode.window;
			if (w.activeTextEditor == undefined
				 || w.activeTextEditor.document.uri.scheme == myScheme) {
				uri = await vscode.window.showInputBox({
					prompt: "Enter value in gzip",
					placeHolder: "address",
					value: vscode.workspace.rootPath
				});
				uri = vscode.Uri.file(uri);
			} else {
				uri = w.activeTextEditor.document.uri;
			}
		};
		let path = process.platform == 'win32' ? uri.path.substr(1).replace(/\//g, '\\') : uri.path;
		let newUri = vscode.Uri.parse(myScheme + ':' + path + ext);
		let doc = await vscode.workspace.openTextDocument(newUri);
		await vscode.window.showTextDocument(doc, { preview: false });
	}));
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
