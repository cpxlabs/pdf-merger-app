const fs = require('node:fs');
const path = require('node:path');
const { app, BrowserWindow } = require('electron');

const outputPath = path.resolve(__dirname, '..', 'docs', 'app-screenshot.png');
const targetUrl = process.env.SCREENSHOT_URL || 'http://127.0.0.1:4173/';

app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-dev-shm-usage');
app.commandLine.appendSwitch('disable-software-rasterizer');

async function capture() {
  const window = new BrowserWindow({
    width: 1440,
    height: 1400,
    show: false,
    backgroundColor: '#0b1020',
  });

  try {
    await window.loadURL(targetUrl);
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const image = await window.webContents.capturePage();
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, image.toPNG());
  } finally {
    window.destroy();
  }
}

app.whenReady()
  .then(capture)
  .then(() => app.quit())
  .catch((error) => {
    console.error(error);
    app.exit(1);
  });
