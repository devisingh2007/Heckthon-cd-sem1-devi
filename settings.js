// DOM Elements
const saveSettingsBtn = document.getElementById('save-settings-btn');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const themeSelect = document.getElementById('theme-select');
const currencySelect = document.getElementById('currency-select');
const dateFormatSelect = document.getElementById('date-format-select');
const toggleSwitches = document.querySelectorAll('.toggle-switch input');

// Sample user settings for offline mode
const SAMPLE_USER_SETTINGS = {
    theme: 'light',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    dashboardView: 'summary',
    showRecentTransactions: true,
    notifications: {
        email: true,
        push: true,
        sms: false,
        budgetAlerts: true,
        unusualActivity: true,
        weeklySummary: true
    }
};

// Initialize settings
document.addEventListener('DOMContentLoaded', () => {
    // Load settings from localStorage or use defaults
    loadSettings();
    
    // Set up event listeners
    setupEventListeners();
    
    // Show notification that we're in offline mode
    showNotification('Using offline mode. Changes will be saved locally.', 'warning');
});

// Event Listeners
function setupEventListeners() {
    // Tab navigation
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
    
    // Save settings button
    saveSettingsBtn.addEventListener('click', saveSettings);
    
    // Theme change
    themeSelect.addEventListener('change', () => {
        applyTheme(themeSelect.value);
    });
    
    // Toggle switches animation
    toggleSwitches.forEach(toggle => {
        toggle.addEventListener('change', () => {
            const toggleLabel = toggle.closest('.toggle-switch');
            if (toggle.checked) {
                toggleLabel.classList.add('active');
            } else {
                toggleLabel.classList.remove('active');
            }
        });
    });
    
    // Enable/disable 2FA options
    const twoFAToggle = document.querySelector('#security-tab .toggle-switch input');
    const authMethodSelect = document.getElementById('auth-method-select');
    
    if (twoFAToggle && authMethodSelect) {
        twoFAToggle.addEventListener('change', () => {
            if (twoFAToggle.checked) {
                authMethodSelect.disabled = false;
                authMethodSelect.parentElement.parentElement.classList.remove('disabled');
            } else {
                authMethodSelect.disabled = true;
                authMethodSelect.parentElement.parentElement.classList.add('disabled');
            }
        });
    }
}

// Switch between settings tabs
function switchTab(tabName) {
    // Update active tab button
    tabButtons.forEach(btn => {
        if (btn.getAttribute('data-tab') === tabName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Show active tab content
    tabContents.forEach(content => {
        if (content.id === `${tabName}-tab`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

// Load settings from localStorage or use defaults
function loadSettings() {
    try {
        const savedSettings = JSON.parse(localStorage.getItem('userSettings')) || SAMPLE_USER_SETTINGS;
        
        // Apply saved settings to form elements
        themeSelect.value = savedSettings.theme || 'light';
        currencySelect.value = savedSettings.currency || 'USD';
        dateFormatSelect.value = savedSettings.dateFormat || 'MM/DD/YYYY';
        
        // Apply theme
        applyTheme(savedSettings.theme);
        
        // Set dashboard view
        const dashboardViewSelect = document.getElementById('dashboard-view-select');
        if (dashboardViewSelect) {
            dashboardViewSelect.value = savedSettings.dashboardView || 'summary';
        }
        
        // Set toggle switches
        const showRecentToggle = document.querySelector('#preferences-tab .toggle-switch input');
        if (showRecentToggle) {
            showRecentToggle.checked = savedSettings.showRecentTransactions !== false;
        }
        
        // Set notification toggles
        if (savedSettings.notifications) {
            const notificationToggles = document.querySelectorAll('#notifications-tab .toggle-switch input');
            if (notificationToggles.length >= 6) {
                notificationToggles[0].checked = savedSettings.notifications.email !== false;
                notificationToggles[1].checked = savedSettings.notifications.push !== false;
                notificationToggles[2].checked = savedSettings.notifications.sms === true;
                notificationToggles[3].checked = savedSettings.notifications.budgetAlerts !== false;
                notificationToggles[4].checked = savedSettings.notifications.unusualActivity !== false;
                notificationToggles[5].checked = savedSettings.notifications.weeklySummary !== false;
            }
        }
        
    } catch (error) {
        console.error('Error loading settings:', error);
        showNotification('Error loading settings. Using defaults.', 'error');
    }
}

// Save settings to localStorage
function saveSettings() {
    // Show loader
    showLoader();
    
    try {
        // Collect settings from form elements
        const settings = {
            theme: themeSelect.value,
            currency: currencySelect.value,
            dateFormat: dateFormatSelect.value,
            dashboardView: document.getElementById('dashboard-view-select')?.value || 'summary',
            showRecentTransactions: document.querySelector('#preferences-tab .toggle-switch input')?.checked !== false,
            notifications: {
                email: document.querySelectorAll('#notifications-tab .toggle-switch input')[0]?.checked !== false,
                push: document.querySelectorAll('#notifications-tab .toggle-switch input')[1]?.checked !== false,
                sms: document.querySelectorAll('#notifications-tab .toggle-switch input')[2]?.checked === true,
                budgetAlerts: document.querySelectorAll('#notifications-tab .toggle-switch input')[3]?.checked !== false,
                unusualActivity: document.querySelectorAll('#notifications-tab .toggle-switch input')[4]?.checked !== false,
                weeklySummary: document.querySelectorAll('#notifications-tab .toggle-switch input')[5]?.checked !== false
            }
        };
        
        // Save to localStorage
        localStorage.setItem('userSettings', JSON.stringify(settings));
        
        // Hide loader and show success notification
        hideLoader();
        showNotification('Settings saved successfully!', 'success');
        
    } catch (error) {
        console.error('Error saving settings:', error);
        hideLoader();
        showNotification('Error saving settings. Please try again.', 'error');
    }
}

// Apply theme to the application
function applyTheme(theme) {
    const body = document.body;
    
    // Remove existing theme classes
    body.classList.remove('theme-light', 'theme-dark', 'theme-system');
    
    // Add selected theme class
    body.classList.add(`theme-${theme}`);
    
    // Save theme preference to localStorage
    localStorage.setItem('theme', theme);
}

// Show loader
function showLoader() {
    // Check if loader exists, if not create it
    let loader = document.querySelector('.settings-loader');
    
    if (!loader) {
        loader = document.createElement('div');
        loader.className = 'settings-loader';
        loader.innerHTML = '<div class="loader-spinner"></div>';
        document.body.appendChild(loader);
    }
    
    loader.style.display = 'flex';
}

// Hide loader
function hideLoader() {
    const loader = document.querySelector('.settings-loader');
    if (loader) {
        loader.style.display = 'none';
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.querySelector('.notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // Set notification content and type
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    // Show notification
    notification.style.display = 'block';
    notification.style.opacity = '1';
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 300);
    }, 3000);
}