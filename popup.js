// Popup.js - Handles UI interactions and settings management

// DOM Elements
const enableToggle = document.getElementById('enableToggle');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const urlInput = document.getElementById('urlInput');
const urlButton = document.getElementById('urlButton');
const previewSection = document.getElementById('previewSection');
const previewContainer = document.getElementById('previewContainer');
const previewImage = document.getElementById('previewImage');
const previewVideo = document.getElementById('previewVideo');
const removeBtn = document.getElementById('removeBtn');
const customizeSection = document.getElementById('customizeSection');
const opacitySlider = document.getElementById('opacitySlider');
const opacityValue = document.getElementById('opacityValue');
const blurSlider = document.getElementById('blurSlider');
const blurValue = document.getElementById('blurValue');
const overlaySlider = document.getElementById('overlaySlider');
const overlayValue = document.getElementById('overlayValue');
const bgSize = document.getElementById('bgSize');
const bgPosition = document.getElementById('bgPosition');
const presetItems = document.querySelectorAll('.preset-item');
const resetBtn = document.getElementById('resetBtn');
const applyBtn = document.getElementById('applyBtn');
const statusMessage = document.getElementById('statusMessage');

// Preset gradients
const presets = {
  'gradient-purple': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'gradient-blue': 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
  'gradient-sunset': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'gradient-dark': 'linear-gradient(135deg, #232526 0%, #414345 100%)',
  'gradient-matrix': 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
  'gradient-neon': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
};

// Load saved settings
async function loadSettings() {
  const settings = await chrome.storage.local.get([
    'enabled',
    'backgroundType',
    'backgroundData',
    'opacity',
    'blur',
    'overlay',
    'size',
    'position'
  ]);

  // Apply loaded settings to UI
  enableToggle.checked = settings.enabled !== false;
  opacitySlider.value = settings.opacity || 60;
  blurSlider.value = settings.blur || 0;
  overlaySlider.value = settings.overlay || 40;
  bgSize.value = settings.size || 'cover';
  bgPosition.value = settings.position || 'center';

  updateSliderValues();

  // Show preview if background exists
  if (settings.backgroundData) {
    showPreview(settings.backgroundType, settings.backgroundData);
  }
}

// Save settings
async function saveSettings() {
  const settings = {
    enabled: enableToggle.checked,
    opacity: parseInt(opacitySlider.value),
    blur: parseInt(blurSlider.value),
    overlay: parseInt(overlaySlider.value),
    size: bgSize.value,
    position: bgPosition.value
  };

  await chrome.storage.local.set(settings);
}

// Update slider value displays
function updateSliderValues() {
  opacityValue.textContent = `${opacitySlider.value}%`;
  blurValue.textContent = `${blurSlider.value}px`;
  overlayValue.textContent = `${overlaySlider.value}%`;
}

// Show preview
function showPreview(type, data) {
  previewSection.style.display = 'block';
  customizeSection.style.display = 'block';

  if (type === 'image' || type === 'gradient') {
    previewImage.src = data;
    previewImage.style.display = 'block';
    previewVideo.style.display = 'none';
  } else if (type === 'video') {
    previewVideo.src = data;
    previewVideo.style.display = 'block';
    previewImage.style.display = 'none';
    previewVideo.play();
  }
}

// Hide preview
function hidePreview() {
  previewSection.style.display = 'none';
  customizeSection.style.display = 'none';
  previewImage.src = '';
  previewVideo.src = '';
}

// Show status message
function showStatus(message, type = 'success') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message show ${type}`;
  
  setTimeout(() => {
    statusMessage.classList.remove('show');
  }, 3000);
}

// Handle file upload
function handleFileUpload(file) {
  if (!file) return;

  const reader = new FileReader();
  
  reader.onload = async (e) => {
    const data = e.target.result;
    const type = file.type.startsWith('video/') ? 'video' : 'image';

    // Save to storage
    await chrome.storage.local.set({
      backgroundType: type,
      backgroundData: data
    });

    showPreview(type, data);
    showStatus('Background uploaded successfully!');
  };

  reader.readAsDataURL(file);
}

// Handle URL import
async function handleUrlImport(url) {
  if (!url) {
    showStatus('Please enter a valid URL', 'error');
    return;
  }

  try {
    // Check if it's a video URL
    const isVideo = url.match(/\.(mp4|webm|ogg)$/i);
    const type = isVideo ? 'video' : 'image';

    // Save URL directly (browser will fetch it)
    await chrome.storage.local.set({
      backgroundType: type,
      backgroundData: url
    });

    showPreview(type, url);
    showStatus('Background imported successfully!');
    urlInput.value = '';
  } catch (error) {
    showStatus('Failed to import URL', 'error');
  }
}

// Apply changes to active tab
async function applyChanges() {
  await saveSettings();
  
  // Send message to content script to reload background
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'reloadBackground' });
    }
  });

  showStatus('Changes applied!');
}

// Reset to default
async function resetToDefault() {
  await chrome.storage.local.remove([
    'backgroundType',
    'backgroundData',
    'opacity',
    'blur',
    'overlay',
    'size',
    'position'
  ]);

  hidePreview();
  loadSettings();
  applyChanges();
  showStatus('Reset to default');
}

// Event Listeners

// Toggle enable/disable
enableToggle.addEventListener('change', async () => {
  await saveSettings();
  applyChanges();
});

// Upload area click
uploadArea.addEventListener('click', () => {
  fileInput.click();
});

// File input change
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  handleFileUpload(file);
});

// Drag and drop
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  
  const file = e.dataTransfer.files[0];
  handleFileUpload(file);
});

// URL import
urlButton.addEventListener('click', () => {
  handleUrlImport(urlInput.value);
});

urlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    handleUrlImport(urlInput.value);
  }
});

// Remove background
removeBtn.addEventListener('click', async () => {
  await chrome.storage.local.remove(['backgroundType', 'backgroundData']);
  hidePreview();
  applyChanges();
  showStatus('Background removed');
});

// Slider changes
opacitySlider.addEventListener('input', updateSliderValues);
blurSlider.addEventListener('input', updateSliderValues);
overlaySlider.addEventListener('input', updateSliderValues);

// Preset backgrounds
presetItems.forEach(item => {
  item.addEventListener('click', async () => {
    const preset = item.dataset.preset;
    const gradient = presets[preset];

    // Create a canvas with the gradient
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    // Parse gradient and draw it
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    
    // Extract colors from CSS gradient
    if (preset === 'gradient-purple') {
      grad.addColorStop(0, '#667eea');
      grad.addColorStop(1, '#764ba2');
    } else if (preset === 'gradient-blue') {
      grad.addColorStop(0, '#00c6ff');
      grad.addColorStop(1, '#0072ff');
    } else if (preset === 'gradient-sunset') {
      grad.addColorStop(0, '#fa709a');
      grad.addColorStop(1, '#fee140');
    } else if (preset === 'gradient-dark') {
      grad.addColorStop(0, '#232526');
      grad.addColorStop(1, '#414345');
    } else if (preset === 'gradient-matrix') {
      grad.addColorStop(0, '#0f2027');
      grad.addColorStop(0.5, '#203a43');
      grad.addColorStop(1, '#2c5364');
    } else if (preset === 'gradient-neon') {
      grad.addColorStop(0, '#f093fb');
      grad.addColorStop(1, '#f5576c');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/png');

    await chrome.storage.local.set({
      backgroundType: 'gradient',
      backgroundData: dataUrl
    });

    showPreview('gradient', dataUrl);
    showStatus('Preset applied!');
  });
});

// Apply button
applyBtn.addEventListener('click', applyChanges);

// Reset button
resetBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to reset all settings?')) {
    resetToDefault();
  }
});

// Load settings on popup open
loadSettings();
