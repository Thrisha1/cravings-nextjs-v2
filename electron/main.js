const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // In development, load from localhost
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('https://cravings.live');
  } else {
    // In production, load the built files
    win.loadFile(path.join(__dirname, '../out/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle silent printing
ipcMain.handle('silent-print', async (event, content) => {
  let printWindow = null;
  try {
    printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      }
    });

    // Load the content
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(content)}`);
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Print with specific options
    const data = await printWindow.webContents.print({
      silent: true,
      printBackground: true,
      copies: 1,
      pageSize: 'A4',
      margins: {
        marginType: 'none'
      }
    }, (success, errorType) => {
      if (!success) {
        console.error('Print failed:', errorType);
      }
    });

    // Wait a bit to ensure printing completes
    await new Promise(resolve => setTimeout(resolve, 2000));

    return { 
      success: true, 
      data
    };
  } catch (error) {
    console.error('Printing error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to print. Please check if printer is connected.'
    };
  } finally {
    if (printWindow) {
      printWindow.close();
    }
  }
}); 