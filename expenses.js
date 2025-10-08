// DOM Elements
const addExpenseBtn = document.getElementById('add-expense-btn');
const expenseModal = document.getElementById('expense-modal');
const closeModalBtn = document.querySelector('.close-modal');
const cancelExpenseBtn = document.getElementById('cancel-expense');
const expenseForm = document.getElementById('expense-form');
const expensesList = document.getElementById('expenses-list');
const categoryFilter = document.getElementById('category-filter');
const sortFilter = document.getElementById('sort-filter');

// API URL - change this to match your backend
const API_URL = 'http://localhost:3000/api';

// Sample expenses data (fallback when backend is unavailable)
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

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
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
    
    // Filter and sort events
    categoryFilter.addEventListener('change', filterExpenses);
    sortFilter.addEventListener('change', filterExpenses);
});

// API Functions
async function fetchExpenses() {
    try {
        showLoader(true);
        const response = await fetch(`${API_URL}/expenses`);
        if (!response.ok) throw new Error('Failed to fetch expenses');
        expenses = await response.json();
        filterExpenses();
        showLoader(false);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        // Use sample data when backend is unavailable
        expenses = [...SAMPLE_EXPENSES];
        filterExpenses();
        showNotification('Using sample data (backend unavailable)', 'warning');
        showLoader(false);
    }
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
        filterExpenses();
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
        filterExpenses();
        showNotification('Expense added in offline mode', 'warning');
        showLoader(false);
    }
}

// Filter and sort expenses
function filterExpenses() {
    const categoryValue = categoryFilter.value;
    const sortValue = sortFilter.value;
    
    // Filter by category
    let filteredExpenses = expenses;
    if (categoryValue !== 'all') {
        filteredExpenses = expenses.filter(exp => exp.category === categoryValue);
    }
    
    // Sort expenses
    switch (sortValue) {
        case 'date-desc':
            filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'date-asc':
            filteredExpenses.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'amount-desc':
            filteredExpenses.sort((a, b) => b.amount - a.amount);
            break;
        case 'amount-asc':
            filteredExpenses.sort((a, b) => a.amount - b.amount);
            break;
    }
    
    updateExpensesList(filteredExpenses);
}

// Update expenses list
function updateExpensesList(filteredExpenses) {
    const expensesToShow = filteredExpenses || expenses;
    expensesList.innerHTML = '';
    
    if (expensesToShow.length === 0) {
        expensesList.innerHTML = '<div class="no-expenses">No expenses found</div>';
        return;
    }
    
    expensesToShow.forEach(expense => {
        const expenseEl = document.createElement('div');
        expenseEl.className = 'expense-item';
        
        const categoryColor = getCategoryColor(expense.category);
        const formattedDate = formatDate(expense.date);
        
        expenseEl.innerHTML = `
            <div class="expense-category" style="background-color: ${categoryColor}">
                <i class="${getCategoryIcon(expense.category)}"></i>
            </div>
            <div class="expense-details">
                <h3>${expense.title}</h3>
                <p class="expense-date">${formattedDate}</p>
                <p class="expense-notes">${expense.notes || 'No notes'}</p>
            </div>
            <div class="expense-amount">₹${expense.amount.toFixed(2)}</div>
        `;
        
        expensesList.appendChild(expenseEl);
    });
}

// Modal functions
function openModal() {
    expenseModal.style.display = 'block';
    document.getElementById('expense-title').focus();
}

function closeModal() {
    expenseModal.style.display = 'none';
    expenseForm.reset();
    document.getElementById('expense-date').valueAsDate = new Date();
}

// Form submission
function handleExpenseSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(expenseForm);
    const expenseData = {
        title: formData.get('title'),
        amount: parseFloat(formData.get('amount')),
        category: formData.get('category'),
        date: new Date(formData.get('date')).toISOString(),
        notes: formData.get('notes')
    };
    
    addExpense(expenseData);
    closeModal();
}

// Helper functions
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function getCategoryName(category) {
    const categories = {
        food: 'Food & Dining',
        transportation: 'Transportation',
        entertainment: 'Entertainment',
        groceries: 'Groceries',
        utilities: 'Utilities',
        other: 'Other'
    };
    return categories[category] || 'Other';
}

function getCategoryColor(category) {
    const colors = {
        food: 'rgba(114, 124, 245, 0.1)',
        transportation: 'rgba(10, 207, 151, 0.1)',
        entertainment: 'rgba(255, 159, 67, 0.1)',
        groceries: 'rgba(250, 92, 124, 0.1)',
        utilities: 'rgba(50, 58, 70, 0.1)',
        other: 'rgba(108, 117, 125, 0.1)'
    };
    return colors[category] || 'rgba(108, 117, 125, 0.1)';
}

function getCategoryIcon(category) {
    const icons = {
        food: 'fas fa-utensils',
        transportation: 'fas fa-car',
        entertainment: 'fas fa-film',
        groceries: 'fas fa-shopping-basket',
        utilities: 'fas fa-bolt',
        other: 'fas fa-tag'
    };
    return icons[category] || 'fas fa-tag';
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

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-times-circle'}"></i>
        </div>
        <div class="notification-message">{message}</div>
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Hide and remove notification
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}