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

	const myProvider = new class {
		constructor() {
			// emitter and its event
			this.onDidChangeEmitter = new vscode.EventEmitter();
			this.onDidChange = this.onDidChangeEmitter.event;
		}

		async provideTextDocumentContent(uri) {
			return await this.readFile(vscode.Uri.file(uri.path).fsPath);
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

	async function decompress(uri) {
		if (uri == undefined) {
			let w = vscode.window;
			if (w.activeTextEditor == undefined) {
				uri = await w.showOpenDialog({
					canSelectFiles: true,
					canSelectFolders: false,
					canSelectMany: false,
					filters: {
						'GZIP files': ['gz'],
						'Any files': ['*'],
					}
				});

				if (uri != undefined) uri = uri[0];
				else return;
			} else {
				uri = w.activeTextEditor.document.uri;
			}
		};
		let newUri = vscode.Uri.parse(myScheme + ':' + uri.path);
		let doc = await vscode.workspace.openTextDocument(newUri);
		await vscode.window.showTextDocument(doc, { preview: false });
	}

	context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(myScheme, myProvider));

	context.subscriptions.push(vscode.commands.registerCommand('gz.decompress', decompress));

	context.subscriptions.push(vscode.commands.registerCommand('gz.dialogopen', () => {
		vscode.window.showOpenDialog({
			canSelectMany: true,
			canSelectFolders: false,
			filters: {
				'GZIP files': ['gz'],
				'Any files': ['*'],
			}
		}).then(fileUris => {
			if (fileUris)
				fileUris.forEach(function (fileUri) {
					vscode.commands.executeCommand('gz.decompress', fileUri);
				});
		});
	}));
}

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
