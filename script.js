// DOM Elements
const addExpenseBtn = document.getElementById('add-expense-btn');
const expenseModal = document.getElementById('expense-modal');
const closeModalBtn = document.querySelector('.close-modal');
const cancelExpenseBtn = document.getElementById('cancel-expense');
const expenseForm = document.getElementById('expense-form');

// API URL - change this to match your backend
const API_URL = 'http://localhost:3000/api';

// Sample expenses data (fallback when backend is not available)
const SAMPLE_EXPENSES = [
    {
        id: 1,
        title: 'Dinner at Restaurant',
        amount: 85.00,
        category: 'food',
        date: new Date().toISOString(),
        notes: 'Dinner with friends'
    },
    {
        id: 2,
        title: 'Grocery Shopping',
        amount: 120.50,
        category: 'groceries',
        date: new Date(Date.now() - 86400000).toISOString(), // yesterday
        notes: 'Weekly groceries'
    },
    {
        id: 3,
        title: 'Gas Station',
        amount: 45.00,
        category: 'transportation',
        date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        notes: 'Filled up the tank'
    },
    {
        id: 4,
        title: 'Movie Tickets',
        amount: 32.00,
        category: 'entertainment',
        date: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        notes: 'Weekend movie'
    }
];

// Expenses data
let expenses = [];

// API Functions
async function fetchExpenses() {
    try {
        showLoader(false);
        const response = await fetch(`${API_URL}/expenses`);
        if (!response.ok) throw new Error('Failed to fetch expenses');
        expenses = await response.json();
        updateExpensesList();
        updateStats();
        showLoader(false);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        // Use sample data when backend is unavailable
        expenses = [...SAMPLE_EXPENSES];
        updateExpensesList();
        updateStats();
        showNotification('Using sample data (backend unavailable)', 'warning');
        showLoader(false);
    }
}

// Show/hide loader
function showLoader(show) {
    const loader = document.getElementById('loader') || createLoader();
    loader.style.display = show ? 'flex' : 'none';
}

// Create loader if it doesn't exist
function createLoader() {
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.innerHTML = '<div class="spinner"></div>';
    loader.style.position = 'fixed';
    loader.style.top = '0';
    loader.style.left = '0';
    loader.style.width = '100%';
    loader.style.height = '100%';
    loader.style.backgroundColor = 'rgba(255,255,255,0.7)';
    loader.style.display = 'none';
    loader.style.justifyContent = 'center';
    loader.style.alignItems = 'center';
    loader.style.zIndex = '9999';
    document.body.appendChild(loader);
    return loader;
}

async function addExpense(expenseData) {
    try {
        showLoader(true);
        const response = await fetch(`${API_URL}/expenses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(expenseData)
        });
        
        if (!response.ok) throw new Error('Failed to add expense');
        
        const newExpense = await response.json();
        expenses.unshift(newExpense);
        updateExpensesList();
        updateStats();
        showNotification('Expense added successfully!');
        showLoader(false);
    } catch (error) {
        console.error('Error adding expense:', error);
        // Handle offline mode
        const newExpense = {
            id: expenses.length > 0 ? Math.max(...expenses.map(exp => exp.id)) + 1 : 1,
            ...expenseData,
            date: expenseData.date || new Date().toISOString()
        };
        expenses.unshift(newExpense);
        updateExpensesList();
        updateStats();
        showNotification('Expense added in offline mode', 'warning');
        showLoader(false);
    }
}

async function fetchStatistics() {
    try {
        const response = await fetch(`${API_URL}/statistics`);
        if (!response.ok) throw new Error('Failed to fetch statistics');
        const stats = await response.json();
        updateStatsWithData(stats);
    } catch (error) {
        console.error('Error fetching statistics:', error);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the app
    initApp();
    
    // Fetch data from API
    fetchExpenses();
    
    // Modal events
    addExpenseBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelExpenseBtn.addEventListener('click', closeModal);
    
    // Form submission
    expenseForm.addEventListener('submit', handleExpenseSubmit);
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === expenseModal) {
            closeModal();
        }
    });
    
    // Set today's date as default in the form
    document.getElementById('expense-date').valueAsDate = new Date();
});

// Initialize the app
function initApp() {
    // Set active navigation based on hash
    setActiveNavigation();
    
    // Handle navigation clicks
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', function() {
            document.querySelectorAll('.nav-menu li').forEach(item => {
                item.classList.remove('active');
            });
            this.parentElement.classList.add('active');
        });
    });
}

// Set active navigation based on current page
function setActiveNavigation() {
    // For index.html, set Dashboard as active
    const navLinks = document.querySelectorAll('.nav-menu a');
    if (!navLinks || navLinks.length === 0) return;
    
    // Set the first item (Dashboard) as active for index.html
    navLinks[0].parentElement.classList.add('active');
}

// Open the expense modal
function openModal() {
    expenseModal.classList.add('show');
}

// Close the expense modal
function closeModal() {
    expenseModal.classList.remove('show');
    expenseForm.reset();
    document.getElementById('expense-date').valueAsDate = new Date();
}

// Handle expense form submission
function handleExpenseSubmit(e) {
    e.preventDefault();
    
    // Get form values
    const title = document.getElementById('expense-title').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;
    const date = document.getElementById('expense-date').valueAsDate;
    const notes = document.getElementById('expense-notes').value;
    
    // Validate form
    if (!title || isNaN(amount) || amount <= 0 || !category || !date) {
        alert('Please fill in all required fields correctly.');
        return;
    }
    
    // Create expense data object
    const expenseData = {
        title,
        amount,
        category,
        date: date.toISOString(),
        notes
    };
    
    // Add expense via API
    addExpense(expenseData);
    
    // Close modal
    closeModal();
}

// Update statistics with data from API
function updateStatsWithData(stats) {
    // Update total amount
    document.querySelector('.total-amount').textContent = `₹${stats.total.amount.toFixed(2)}`;
    
    // Update total count
    document.querySelector('.total-count').textContent = stats.total.count;
    
    // Update category stats if needed
    // This would depend on your UI implementation
}

// Update the expenses list in the UI
function updateExpensesList() {
    const expenseList = document.querySelector('.expense-list');
    expenseList.innerHTML = '';
    
    // Get first 4 expenses for the recent list
    const recentExpenses = expenses.slice(0, 4);
    
    recentExpenses.forEach(expense => {
        // Determine icon based on category
        let icon = 'fas fa-receipt';
        let color = '#727cf5';
        
        switch(expense.category) {
            case 'food':
                icon = 'fas fa-utensils';
                color = '#727cf5';
                break;
            case 'groceries':
                icon = 'fas fa-shopping-basket';
                color = '#ff9f43';
                break;
            case 'transportation':
                icon = 'fas fa-gas-pump';
                color = '#0acf97';
                break;
            case 'entertainment':
                icon = 'fas fa-film';
                color = '#fa5c7c';
                break;
            case 'shopping':
                icon = 'fas fa-shopping-bag';
                color = '#727cf5';
                break;
            case 'utilities':
                icon = 'fas fa-bolt';
                color = '#ff9f43';
                break;
            case 'health':
                icon = 'fas fa-heartbeat';
                color = '#0acf97';
                break;
        }
        
        // Format date
        const dateStr = formatDate(expense.date);
        
        // Create expense item
        const expenseItem = document.createElement('div');
        expenseItem.className = 'expense-item';
        expenseItem.innerHTML = `
            <div class="expense-icon" style="background-color: rgba(${hexToRgb(color)}, 0.1);">
                <i class="${icon}" style="color: ${color};"></i>
            </div>
            <div class="expense-details">
                <h4>${expense.title}</h4>
                <p>${getCategoryName(expense.category)}</p>
            </div>
            <div class="expense-date">
                <p>${dateStr}</p>
            </div>
            <div class="expense-amount">
                <p>-₹${expense.amount.toFixed(2)}</p>
            </div>
        `;
        
        expenseList.appendChild(expenseItem);
    });
}

// Update statistics
function updateStats() {
    // Calculate total expenses
    const totalExpenses = expenses.reduce((total, expense) => total + expense.amount, 0);
    document.querySelector('.stat-value').textContent = `₹${totalExpenses.toFixed(2)}`;
    
    // Update transaction count
    document.querySelectorAll('.stat-value')[1].textContent = expenses.length;
}

// Helper function to format date
function formatDate(date) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const expenseDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (expenseDate.getTime() === today.getTime()) {
        return 'Today';
    } else if (expenseDate.getTime() === yesterday.getTime()) {
        return 'Yesterday';
    } else {
        const diff = Math.floor((today - expenseDate) / (1000 * 60 * 60 * 24));
        if (diff < 7) {
            return `${diff} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }
}

// Helper function to get category name
function getCategoryName(category) {
    switch(category) {
        case 'food': return 'Food & Dining';
        case 'groceries': return 'Groceries';
        case 'transportation': return 'Transportation';
        case 'entertainment': return 'Entertainment';
        case 'shopping': return 'Shopping';
        case 'utilities': return 'Utilities';
        case 'health': return 'Health';
        default: return 'Other';
    }
}

// Helper function to convert hex to rgb
function hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `${r}, ${g}, ${b}`;
}

// Show notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-check-circle"></i>
            <p>${message}</p>
        </div>
    `;
    
    // Add styles
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = 'var(--secondary-color)';
    notification.style.color = 'white';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '8px';
    notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
    notification.style.zIndex = '1000';
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(20px)';
    notification.style.transition = 'all 0.3s ease';
    
    // Style the content
    notification.querySelector('.notification-content').style.display = 'flex';
    notification.querySelector('.notification-content').style.alignItems = 'center';
    notification.querySelector('.notification-content i').style.marginRight = '10px';
    notification.querySelector('.notification-content i').style.fontSize = '20px';
    
    // Add to body
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}