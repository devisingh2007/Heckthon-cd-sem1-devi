// DOM Elements
const budgetMonth = document.getElementById('budget-month');
const addBudgetBtn = document.getElementById('add-budget-btn');
const budgetModal = document.getElementById('budget-modal');
const closeModal = document.querySelector('.close-modal');
const budgetForm = document.getElementById('budget-form');
const cancelBudget = document.getElementById('cancel-budget');
const budgetCategories = document.querySelector('.budget-categories');

// API URL (same as in script.js)
const API_URL = 'http://localhost:3000/api';

// Sample budgets data for offline mode
const SAMPLE_BUDGETS = [
    { id: 1, category: 'Food & Dining', amount: 500, spent: 350, icon: 'fa-utensils', color: '#727cf5' },
    { id: 2, category: 'Transportation', amount: 300, spent: 120, icon: 'fa-car', color: '#0acf97' },
    { id: 3, category: 'Entertainment', amount: 200, spent: 85, icon: 'fa-film', color: '#ff9f43' },
    { id: 4, category: 'Groceries', amount: 400, spent: 210, icon: 'fa-shopping-basket', color: '#fa5c7c' },
    { id: 5, category: 'Utilities', amount: 250, spent: 150, icon: 'fa-bolt', color: '#323a46' }
];

// Store budgets data
let budgets = [];

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    fetchBudgets();
    
    // Modal event listeners
    addBudgetBtn.addEventListener('click', openModal);
    closeModal.addEventListener('click', closeModalHandler);
    cancelBudget.addEventListener('click', closeModalHandler);
    budgetForm.addEventListener('submit', handleBudgetSubmit);
    
    // Budget month change
    budgetMonth.addEventListener('change', fetchBudgets);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === budgetModal) {
            closeModalHandler();
        }
    });
    
    // Add event listeners to edit buttons
    document.querySelectorAll('.budget-actions .btn-icon').forEach(btn => {
        btn.addEventListener('click', function() {
            const budgetCard = this.closest('.budget-card');
            const categoryName = budgetCard.querySelector('h3').textContent;
            editBudget(categoryName);
        });
    });
});

// Fetch budgets from API
async function fetchBudgets() {
    showLoader(budgetCategories);
    
    try {
        const month = budgetMonth.value;
        const response = await fetch(`${API_URL}/budgets?month=${month}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        budgets = await response.json();
        updateBudgetsUI(budgets);
    } catch (error) {
        console.error('Error fetching budgets:', error);
        // Use sample data in offline mode
        budgets = [...SAMPLE_BUDGETS];
        updateBudgetsUI(budgets);
        showNotification('Warning: Using offline mode with sample data', 'warning');
    } finally {
        hideLoader();
    }
}

// Add a new budget
async function addBudget(budgetData) {
    showLoader(budgetCategories);
    
    try {
        const response = await fetch(`${API_URL}/budgets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(budgetData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to add budget');
        }
        
        const newBudget = await response.json();
        budgets.push(newBudget);
        updateBudgetsUI(budgets);
        showNotification('Budget added successfully!', 'success');
    } catch (error) {
        console.error('Error adding budget:', error);
        
        // Offline mode: Create a new budget locally
        const newBudget = {
            id: budgets.length > 0 ? Math.max(...budgets.map(b => b.id)) + 1 : 1,
            ...budgetData,
            spent: 0,
            icon: getCategoryIcon(budgetData.category),
            color: getCategoryColor(budgetData.category)
        };
        
        budgets.push(newBudget);
        updateBudgetsUI(budgets);
        showNotification('Budget added in offline mode', 'warning');
    } finally {
        hideLoader();
        closeModalHandler();
    }
}

// Update budgets UI
function updateBudgetsUI(budgetsData) {
    // Update total budget summary
    updateBudgetSummary(budgetsData);
    
    // Update category budgets
    updateCategoryBudgets(budgetsData);
}

// Update budget summary
function updateBudgetSummary(budgetsData) {
    const totalBudget = budgetsData.reduce((sum, budget) => sum + budget.amount, 0);
    const totalSpent = budgetsData.reduce((sum, budget) => sum + budget.spent, 0);
    const remaining = totalBudget - totalSpent;
    const percentUsed = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    
    // Update summary values
    document.querySelector('.budget-total .value').textContent = `₹${totalBudget.toFixed(2)}`;
    document.querySelector('.budget-spent .value').textContent = `₹${totalSpent.toFixed(2)}`;
    document.querySelector('.budget-remaining .value').textContent = `₹${remaining.toFixed(2)}`;
    
    // Update progress bar
    document.querySelector('.budget-progress .progress').style.width = `${percentUsed}%`;
    document.querySelector('.progress-stats span:first-child').textContent = `${percentUsed}% of budget used`;
    
    // Calculate days remaining in month
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysRemaining = lastDay - today.getDate();
    document.querySelector('.progress-stats span:last-child').textContent = `${daysRemaining} days remaining`;
}

// Update category budgets
function updateCategoryBudgets(budgetsData) {
    budgetCategories.innerHTML = '<h2>Category Budgets</h2>';
    
    if (budgetsData.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <i class="fas fa-piggy-bank"></i>
            <h3>No budgets found</h3>
            <p>Add your first budget to get started</p>
        `;
        budgetCategories.appendChild(emptyState);
        return;
    }
    
    budgetsData.forEach(budget => {
        const percentSpent = budget.amount > 0 ? Math.round((budget.spent / budget.amount) * 100) : 0;
        const remaining = budget.amount - budget.spent;
        
        const budgetCard = document.createElement('div');
        budgetCard.className = 'budget-card';
        
        budgetCard.innerHTML = `
            <div class="budget-card-header">
                <div class="category-info">
                    <div class="category-icon" style="background-color: ${hexToRgba(budget.color, 0.1)};">
                        <i class="fas ${budget.icon}" style="color: ${budget.color};"></i>
                    </div>
                    <h3>${budget.category}</h3>
                </div>
                <div class="budget-actions">
                    <button class="btn-icon edit-budget" data-category="${budget.category}"><i class="fas fa-edit"></i></button>
                </div>
            </div>
            <div class="budget-card-body">
                <div class="budget-amounts">
                    <div class="budget-amount">
                        <span class="label">Budget:</span>
                        <span class="value">₹${budget.amount.toFixed(2)}</span>
                    </div>
                    <div class="budget-amount">
                        <span class="label">Spent:</span>
                        <span class="value">₹${budget.spent.toFixed(2)}</span>
                    </div>
                    <div class="budget-amount">
                        <span class="label">Remaining:</span>
                        <span class="value">₹${remaining.toFixed(2)}</span>
                    </div>
                </div>
                <div class="budget-progress">
                    <div class="progress-bar">
                        <div class="progress" style="width: ${percentSpent}%; background-color: ${budget.color};"></div>
                    </div>
                    <div class="progress-percentage">${percentSpent}%</div>
                </div>
            </div>
        `;
        
        budgetCategories.appendChild(budgetCard);
    });
    
    // Add event listeners to edit buttons
    document.querySelectorAll('.edit-budget').forEach(btn => {
        btn.addEventListener('click', () => editBudget(btn.dataset.category));
    });
}

// Edit budget
function editBudget(category) {
    const budget = budgets.find(b => b.category === category);
    if (!budget) return;
    
    // Fill form with budget data
    document.getElementById('budget-category').value = budget.category;
    document.getElementById('budget-amount').value = budget.amount;
    
    // Change modal title and submit button
    document.querySelector('.modal-header h2').textContent = 'Edit Budget';
    document.querySelector('.form-actions .btn-primary').textContent = 'Update Budget';
    
    // Store budget category in form
    budgetForm.dataset.category = budget.category;
    
    openModal();
}

// Handle form submission
function handleBudgetSubmit(e) {
    e.preventDefault();
    
    const budgetData = {
        category: document.getElementById('budget-category').value,
        amount: parseFloat(document.getElementById('budget-amount').value),
        period: document.getElementById('budget-period').value
    };
    
    const category = budgetForm.dataset.category;
    
    if (category) {
        // Update existing budget
        updateBudgetByCategory(category, budgetData);
    } else {
        // Add new budget
        addBudget(budgetData);
    }
}

// Update budget by category
async function updateBudgetByCategory(category, budgetData) {
    showLoader(budgetCategories);
    
    try {
        const budget = budgets.find(b => b.category === category);
        if (!budget) throw new Error('Budget not found');
        
        const response = await fetch(`${API_URL}/budgets/${budget.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(budgetData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to update budget');
        }
        
        const updatedBudget = await response.json();
        
        // Update budget in local array
        budgets = budgets.map(b => b.category === category ? {...b, ...updatedBudget} : b);
        updateBudgetsUI(budgets);
        showNotification('Budget updated successfully!', 'success');
    } catch (error) {
        console.error('Error updating budget:', error);
        
        // Offline mode: Update budget locally
        budgets = budgets.map(b => b.category === category ? {...b, ...budgetData} : b);
        updateBudgetsUI(budgets);
        showNotification('Budget updated in offline mode', 'warning');
    } finally {
        hideLoader();
        closeModalHandler();
    }
}

// Modal functions
function openModal() {
    budgetModal.style.display = 'block';
    document.body.classList.add('modal-open');
}

function closeModalHandler() {
    budgetModal.style.display = 'none';
    document.body.classList.remove('modal-open');
    budgetForm.reset();
    delete budgetForm.dataset.category;
    
    // Reset modal title and submit button
    document.querySelector('.modal-header h2').textContent = 'Add Budget';
    document.querySelector('.form-actions .btn-primary').textContent = 'Save Budget';
}

// Helper functions
function getCategoryIcon(category) {
    const icons = {
        'Food & Dining': 'fa-utensils',
        'Transportation': 'fa-car',
        'Entertainment': 'fa-film',
        'Groceries': 'fa-shopping-basket',
        'Utilities': 'fa-bolt'
    };
    
    return icons[category] || 'fa-tag';
}

function getCategoryColor(category) {
    const colors = {
        'Food & Dining': '#727cf5',
        'Transportation': '#0acf97',
        'Entertainment': '#ff9f43',
        'Groceries': '#fa5c7c',
        'Utilities': '#323a46'
    };
    
    return colors[category] || '#6c757d';
}

function hexToRgba(hex, alpha = 1) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Loader functions
function showLoader(container) {
    const loader = createLoader();
    container.appendChild(loader);
}

function hideLoader() {
    const loader = document.querySelector('.loader');
    if (loader) {
        loader.remove();
    }
}

function createLoader() {
    const loader = document.createElement('div');
    loader.className = 'loader';
    loader.innerHTML = '<div class="spinner"></div>';
    return loader;
}

// Notification function
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
        </div>
        <div class="notification-content">
            <p>${message}</p>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Add event listener to close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.remove();
        }
    }, 5000);
}