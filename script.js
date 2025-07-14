/**
 * Code Pencil v1.0
 * Copyright (c) PØWR¹
 * powr-one.com
 */

// ======================
// DOM ELEMENTS
// ======================
const codeEditor = document.getElementById('code-editor');
const outputFrame = document.getElementById('output-frame');
const charCount = document.getElementById('char-count');
const lineCount = document.getElementById('line-count');
const currentFile = document.getElementById('current-file');
const notifications = document.getElementById('notifications');
const projectFilesContainer = document.getElementById('project-files');

// Buttons
const btnClearMenu = document.getElementById('btn-clear-menu');
const btnCopyMenu = document.getElementById('btn-copy-menu');
const btnPasteMenu = document.getElementById('btn-paste-menu');
const btnRun = document.getElementById('btn-run');
const btnReset = document.getElementById('btn-reset');
const btnNew = document.getElementById('btn-new');
const btnExport = document.getElementById('btn-export');
const btnImport = document.getElementById('btn-import');
const btnShare = document.getElementById('btn-share');

// ======================
// STATE MANAGEMENT
// ======================
let appState = {
  files: {},
  currentFilename: '',
  lines: 0,
  chars: 0
};

// ======================
// FILE MANAGEMENT
// ======================
function createDefaultFiles() {
  return {
    'index.html': {
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Project</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Hello World!</h1>
  <script src="script.js"></script>
</body>
</html>`,
      type: 'html'
    },
    'style.css': {
      content: `body {
  font-family: Arial, sans-serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  line-height: 1.6;
}`,
      type: 'css'
    },
    'script.js': {
      content: `console.log('Hello from Code Pencil!');`,
      type: 'js'
    }
  };
}

function createFileElement(filename) {
  const fileBtn = document.createElement('div');
  fileBtn.className = 'flex-button file-btn';
  fileBtn.innerHTML = `
    <i class="fas fa-file${filename.endsWith('.html') ? '-code' : 
      filename.endsWith('.css') ? '-alt' : 
      filename.endsWith('.js') ? '-code' : ''}"></i>
    <span class="meta">${filename}</span>
  `;
  
  fileBtn.addEventListener('click', () => loadFile(filename));
  return fileBtn;
}

function renderFileList() {
  projectFilesContainer.innerHTML = '';
  Object.keys(appState.files).forEach(filename => {
    projectFilesContainer.appendChild(createFileElement(filename));
  });
}

function loadFile(filename) {
  if (appState.files[filename]) {
    codeEditor.value = appState.files[filename].content;
    appState.currentFilename = filename;
    calculateStats();
  }
}

function saveCurrentFile() {
  if (appState.currentFilename) {
    appState.files[appState.currentFilename].content = codeEditor.value;
  }
}

function createNewFile() {
  const fileName = prompt('Enter new file name (with extension):', 'newfile.js');
  if (fileName && fileName.trim()) {
    if (!appState.files[fileName]) {
      appState.files[fileName] = {
        content: '',
        type: fileName.split('.').pop()
      };
      renderFileList();
      loadFile(fileName);
      showNotification(`File ${fileName} created`);
    } else {
      showNotification('File already exists!', true);
    }
  }
}

function resetProject() {
  if (confirm('Are you sure you want to reset the project? All files will be lost.')) {
    appState.files = createDefaultFiles();
    renderFileList();
    loadFile('index.html');
    showNotification('Project reset to initial state');
  }
}

// ======================
// EXPORT/IMPORT FUNCTIONS
// ======================
async function exportToZip() {
  try {
    const zip = new JSZip();
    
    // Add all files to zip
    Object.keys(appState.files).forEach(filename => {
      zip.file(filename, appState.files[filename].content);
    });
    
    const content = await zip.generateAsync({type: 'blob'});
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'code-pencil-project.zip';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Project exported as ZIP');
  } catch (err) {
    showNotification('Export failed: ' + err, true);
  }
}

async function importFromZip() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.zip';
  
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const zip = new JSZip();
      const content = await zip.loadAsync(file);
      const newFiles = {};
      
      // Process each file in the zip
      for (const [filename, fileData] of Object.entries(content.files)) {
        if (!fileData.dir) {
          const fileContent = await fileData.async('text');
          newFiles[filename] = {
            content: fileContent,
            type: filename.split('.').pop()
          };
        }
      }
      
      if (Object.keys(newFiles).length > 0) {
        appState.files = newFiles;
        renderFileList();
        loadFile(Object.keys(newFiles)[0]);
        showNotification('Project imported successfully');
      } else {
        showNotification('No valid files found in ZIP', true);
      }
    } catch (err) {
      showNotification('Import failed: ' + err, true);
    }
  };
  
  input.click();
}

function shareProject() {
  let sharedText = '';
  
  // Create combined text with all files
  Object.keys(appState.files).forEach(filename => {
    sharedText += `${filename}\n\n${appState.files[filename].content}\n\n`;
  });
  
  // Remove last two newlines
  sharedText = sharedText.trim();
  
  // Try Web Share API first
  if (navigator.share) {
    navigator.share({
      title: 'My Code Pencil Project',
      text: sharedText
    }).catch(err => {
      // Fallback to clipboard if share fails
      copyToClipboard(sharedText);
    });
  } else {
    // Fallback to clipboard
    copyToClipboard(sharedText);
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
    .then(() => showNotification('Project copied to clipboard'))
    .catch(err => showNotification('Failed to copy: ' + err, true));
}

// ======================
// CORE FUNCTIONS
// ======================
function updateStatusBar() {
  charCount.querySelector('.meta').textContent = `${appState.chars} chars`;
  lineCount.querySelector('.meta').textContent = `${appState.lines} lines`;
  currentFile.querySelector('.meta').textContent = appState.currentFilename;
  currentFile.querySelector('.meta').style.color = 'var(--powr1-blue)';
}

function calculateStats() {
  saveCurrentFile();
  appState.lines = codeEditor.value.split('\n').length;
  appState.chars = codeEditor.value.length;
  updateStatusBar();
}

function clearEditor() {
  if (confirm('Are you sure you want to clear the editor?')) {
    codeEditor.value = '';
    calculateStats();
    showNotification('Editor cleared');
  }
}

async function copyCode() {
  try {
    await navigator.clipboard.writeText(codeEditor.value);
    showNotification('Code copied to clipboard');
  } catch (err) {
    showNotification('Failed to copy: ' + err, true);
  }
}

async function pasteCode() {
  try {
    const text = await navigator.clipboard.readText();
    codeEditor.value = text;
    calculateStats();
    showNotification('Content pasted');
  } catch (err) {
    showNotification('Paste failed. Click to try again', true);
    notifications.onclick = () => pasteCode();
  }
}

function runCode() {
  saveCurrentFile();
  
  // Generate full HTML with all files
  let htmlContent = '';
  let cssContent = '';
  let jsContent = '';
  
  // Extract content from all files
  Object.keys(appState.files).forEach(filename => {
    if (filename.endsWith('.html')) {
      htmlContent = appState.files[filename].content;
    } else if (filename.endsWith('.css')) {
      cssContent = appState.files[filename].content;
    } else if (filename.endsWith('.js')) {
      jsContent = appState.files[filename].content;
    }
  });
  
  // Combine all into one HTML
  let fullHtml = htmlContent;
  
  // Inject CSS if exists
  if (cssContent) {
    if (fullHtml.includes('</head>')) {
      fullHtml = fullHtml.replace('</head>', `<style>${cssContent}</style></head>`);
    } else {
      fullHtml = fullHtml.replace('<head>', `<head><style>${cssContent}</style>`);
    }
  }
  
  // Inject JS if exists
  if (jsContent) {
    if (fullHtml.includes('</body>')) {
      fullHtml = fullHtml.replace('</body>', `<script>${jsContent}</script></body>`);
    } else {
      fullHtml += `<script>${jsContent}</script>`;
    }
  }
  
  outputFrame.srcdoc = fullHtml;
  showNotification('Code executed');
}

function showNotification(message, isError = false) {
  notifications.innerHTML = `<span class="meta">${message}</span>`;
  notifications.style.background = isError ? 'var(--powr1-red)' : 'var(--powr1-black)';
  notifications.style.color = isError ? 'var(--powr1-white)' : 'var(--powr1-light)';
  notifications.style.display = 'flex';

  setTimeout(() => {
    notifications.style.display = 'none';
    notifications.onclick = null;
  }, 3000);
}

// ======================
// EVENT LISTENERS
// ======================
codeEditor.addEventListener('input', calculateStats);
btnClearMenu.addEventListener('click', clearEditor);
btnCopyMenu.addEventListener('click', copyCode);
btnPasteMenu.addEventListener('click', pasteCode);
btnRun.addEventListener('click', runCode);
btnReset.addEventListener('click', resetProject);
btnNew.addEventListener('click', createNewFile);
btnExport.addEventListener('click', exportToZip);
btnImport.addEventListener('click', importFromZip);
btnShare.addEventListener('click', shareProject);

// ======================
// INITIALIZATION
// ======================
function init() {
  appState.files = createDefaultFiles();
  renderFileList();
  loadFile('index.html');
  outputFrame.sandbox = 'allow-scripts allow-same-origin';
  console.log('Code Pencil v1.0 initialized');
}

init();
