const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const { PDFDocument } = require('pdf-lib');

const isDev = Boolean(process.env.ELECTRON_RENDERER_URL);

function normalizePdfName(fileName) {
  if (!fileName || typeof fileName !== 'string') {
    return 'merged_document.pdf';
  }

  const trimmed = fileName.trim();
  if (!trimmed) {
    return 'merged_document.pdf';
  }

  return trimmed.toLowerCase().endsWith('.pdf') ? trimmed : `${trimmed}.pdf`;
}

function mapFile(filePath) {
  return {
    name: path.basename(filePath),
    path: filePath,
    directory: path.dirname(filePath),
  };
}

async function listPdfFiles(folderPath) {
  const entries = await fs.readdir(folderPath, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === '.pdf')
    .map((entry) => path.join(folderPath, entry.name))
    .sort((left, right) => left.localeCompare(right))
    .map(mapFile);
}

async function mergePdfFiles(inputFiles, outputPath) {
  const mergedPdf = await PDFDocument.create();

  for (const inputFile of inputFiles) {
    const fileBuffer = await fs.readFile(inputFile);
    const sourcePdf = await PDFDocument.load(fileBuffer);
    const pageIndexes = sourcePdf.getPageIndices();
    const copiedPages = await mergedPdf.copyPages(sourcePdf, pageIndexes);

    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const outputBytes = await mergedPdf.save();
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, outputBytes);
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1320,
    height: 900,
    minWidth: 1100,
    minHeight: 760,
    backgroundColor: '#0b1020',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
    return;
  }

  mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

ipcMain.handle('pdf:select-files', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select PDF files',
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
  });

  if (result.canceled) {
    return [];
  }

  return result.filePaths.map(mapFile);
});

ipcMain.handle('pdf:select-folder', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select a folder with PDF files',
    properties: ['openDirectory'],
  });

  if (result.canceled || !result.filePaths[0]) {
    return { folderPath: '', files: [] };
  }

  const folderPath = result.filePaths[0];
  const files = await listPdfFiles(folderPath);

  return { folderPath, files };
});

ipcMain.handle('pdf:select-output-folder', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select output folder',
    properties: ['openDirectory', 'createDirectory'],
  });

  if (result.canceled) {
    return '';
  }

  return result.filePaths[0] || '';
});

ipcMain.handle('pdf:merge', async (_, payload) => {
  const files = Array.isArray(payload?.files) ? payload.files : [];
  const outputFolder = payload?.outputFolder;
  const outputName = normalizePdfName(payload?.outputName);

  if (files.length < 2) {
    throw new Error('Select at least two PDF files.');
  }

  if (!outputFolder) {
    throw new Error('Choose an output folder.');
  }

  for (const filePath of files) {
    await fs.access(filePath);
  }

  const outputPath = path.join(outputFolder, outputName);
  await mergePdfFiles(files, outputPath);

  return {
    outputPath,
    fileCount: files.length,
  };
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
