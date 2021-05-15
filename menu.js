const { 
    app, 
    Menu, 
    shell, 
    BrowserWindow,
    ipcMain,
    globalShortcut,
    dialog
} = require('electron');
const fs = require('fs');


app.on('ready', () => {
    globalShortcut.register('CommandOrControl+S', () => {
        saveFile();
    });
    globalShortcut.register('CommandOrControl+O', () => {
        loadFile();
    });
});

const template = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Open',
                accelerator: 'CommandOrControl+O',
                click() {
                    loadFile();
                }
            },
            {
                label: 'Save',
                accelerator: 'CommandOrControl+S',
                click() {
                    saveFile();
                }
            }
        ]
    },
    {
        role: 'help',
        submenu: [
            {
                label: 'About Editor Component',
                click() {
                    shell.openExternal('https://simplemde.com/');
                }
            }
        ]
    },
    {
        label: 'Format',
        submenu: [
            {
                label: 'Toggle Bold',
                click() {
                    const window = BrowserWindow.getFocusedWindow();
                    window.webContents.send(
                        'editor-event',
                        'toggle-bold'
                    );
                }
            }
        ]
    }
];

if (process.env.DEBUG) {
    template.push({
        label: 'Debugging',
        submenu: [
            {
                label: 'Dev Tools',
                role: 'toggleDevTools'
            },
            { type: 'separator' },
            {
                role: 'reload',
                accelerator: 'Alt+R'
            }
        ]
    });
}

const menu = Menu.buildFromTemplate(template);

ipcMain.on('editor-reply', (event, arg) => {
    console.log(`Received reply from web page: ${arg}`);
});

ipcMain.on('save', (event, arg) => {
    console.log(`Saving content of the file`);
    console.log(arg);

    const window = BrowserWindow.getFocusedWindow();
    const options = {
        title: 'Save markdown file',
        filters: [
            {
                name: 'MyFile',
                extensions: ['md']
            }
        ]
    };
    dialog.showSaveDialog(window, options).then(file => {
        if (!file.canceled) {
            console.log(`Saving content to the file: ${file.filePath.toString()}`);
            fs.writeFile(file.filePath.toString(),
              arg, function (err) {
                  if (err) throw err;
                  console.log('Saved!');
              });
        }
    }).catch(err => {
        console.log(err)
    });
});

function saveFile() {
    console.log('Saving the file');
    const window = BrowserWindow.getFocusedWindow();
    window.webContents.send('editor-event', 'save');
}

function loadFile() {
    const window = BrowserWindow.getFocusedWindow();
    const options = {
        title: 'Pick a markdown file',
        filters: [
            { name: 'Markdown files', extensions: ['md'] },
            { name: 'Text files', extensions: ['txt'] }
        ]
    };
    dialog.showOpenDialog(window, options).then(filePath => {
        if (filePath.canceled === false) {
            console.log(`Selected file paths: ${filePath.filePaths}`);
            const content = fs.readFileSync(filePath.filePaths.toString()).toString();
            window.webContents.send('load', content);
        }
    }).catch(err => {
        console.log(err)
    });
}

module.exports = menu;