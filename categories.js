// DOM Elements
const categoriesGrid = document.querySelector('.categories-grid');
const addCategoryBtn = document.getElementById('add-category-btn');
const categoryModal = document.getElementById('category-modal');
const closeModal = document.querySelector('.close-modal');
const categoryForm = document.getElementById('category-form');
const cancelCategory = document.getElementById('cancel-category');
const searchInput = document.querySelector('.search-bar input');

// API URL (same as in script.js)
const API_URL = 'http://localhost:3000/api';

// Sample categories data for offline mode
const SAMPLE_CATEGORIES = [
    { id: 1, name: 'Food & Dining', icon: 'fa-utensils', color: '#727cf5', budget: 500, spent: 350, transactions: 15 },
    { id: 2, name: 'Transportation', icon: 'fa-car', color: '#0acf97', budget: 300, spent: 120, transactions: 8 },
    { id: 3, name: 'Entertainment', icon: 'fa-film', color: '#ff9f43', budget: 200, spent: 85, transactions: 4 },
    { id: 4, name: 'Groceries', icon: 'fa-shopping-basket', color: '#fa5c7c', budget: 400, spent: 210, transactions: 6 },
    { id: 5, name: 'Utilities', icon: 'fa-bolt', color: '#323a46', budget: 250, spent: 150, transactions: 3 }
];

// Store categories data
let categories = [];

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    fetchCategories();
    
    // Modal event listeners
    addCategoryBtn.addEventListener('click', openModal);
    closeModal.addEventListener('click', closeModalHandler);
    cancelCategory.addEventListener('click', closeModalHandler);
    categoryForm.addEventListener('submit', handleCategorySubmit);
    
    // Search functionality
    searchInput.addEventListener('input', filterCategories);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === categoryModal) {
            closeModalHandler();
        }
    });
});

// Fetch categories from API
async function fetchCategories() {
    showLoader(categoriesGrid);
    
    try {
        const response = await fetch(`${API_URL}/categories`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        categories = await response.json();
        updateCategoriesUI(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        // Use sample data in offline mode
        categories = [...SAMPLE_CATEGORIES];
        updateCategoriesUI(categories);
        showNotification('Warning: Using offline mode with sample data', 'warning');
    } finally {
        hideLoader();
    }
}

// Add a new category
async function addCategory(categoryData) {
    showLoader(categoriesGrid);
    
    try {
        const response = await fetch(`${API_URL}/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(categoryData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to add category');
        }
        
        const newCategory = await response.json();
        categories.push(newCategory);
        updateCategoriesUI(categories);
        showNotification('Category added successfully!', 'success');
    } catch (error) {
        console.error('Error adding category:', error);
        
        // Offline mode: Create a new category locally
        const newCategory = {
            id: categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1,
            ...categoryData,
            spent: 0,
            transactions: 0
        };
        
        categories.push(newCategory);
        updateCategoriesUI(categories);
        showNotification('Category added in offline mode', 'warning');
    } finally {
        hideLoader();
        closeModalHandler();
    }
}

// Update categories UI
function updateCategoriesUI(categoriesData) {
    categoriesGrid.innerHTML = '';
    
    if (categoriesData.length === 0) {
        categoriesGrid.innerHTML = '<div class="empty-state"><i class="fas fa-tags"></i><h3>No categories found</h3><p>Add your first category to get started</p></div>';
        return;
    }
    
    categoriesData.forEach(category => {
        const percentSpent = category.budget ? Math.min(Math.round((category.spent / category.budget) * 100), 100) : 0;
        
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        categoryCard.style.borderLeft = `4px solid ${category.color}`;
        
        categoryCard.innerHTML = `
            <div class="category-icon" style="background-color: ${hexToRgba(category.color, 0.1)};">
                <i class="fas ${category.icon}" style="color: ${category.color};"></i>
            </div>
            <div class="category-details">
                <h3>${category.name}</h3>
                <p>₹${category.spent.toFixed(2)} spent${category.budget ? ` of ₹${category.budget.toFixed(2)}` : ''}</p>
                <div class="progress-bar">
                    <div class="progress" style="width: ${percentSpent}%; background-color: ${category.color};"></div>
                </div>
                <p class="category-stats">${category.transactions} transactions</p>
            </div>
            <div class="category-actions">
                <button class="btn-icon edit-category" data-id="${category.id}"><i class="fas fa-edit"></i></button>
                <button class="btn-icon delete-category" data-id="${category.id}"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;
        
        categoriesGrid.appendChild(categoryCard);
    });
    
    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.edit-category').forEach(btn => {
        btn.addEventListener('click', () => editCategory(parseInt(btn.dataset.id)));
    });
    
    document.querySelectorAll('.delete-category').forEach(btn => {
        btn.addEventListener('click', () => deleteCategory(parseInt(btn.dataset.id)));
    });
}

// Filter categories based on search input
function filterCategories() {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredCategories = categories.filter(category => 
        category.name.toLowerCase().includes(searchTerm)
    );
    
    updateCategoriesUI(filteredCategories);
}

// Edit category
function editCategory(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    
    // Fill form with category data
    document.getElementById('category-name').value = category.name;
    document.getElementById('category-icon').value = category.icon;
    document.getElementById('category-color').value = category.color;
    document.getElementById('category-budget').value = category.budget || '';
    
    // Change modal title and submit button
    document.querySelector('.modal-header h2').textContent = 'Edit Category';
    document.querySelector('.form-actions .btn-primary').textContent = 'Update Category';
    
    // Store category ID in form
    categoryForm.dataset.categoryId = categoryId;
    
    openModal();
}

// Delete category
async function deleteCategory(categoryId) {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    showLoader(categoriesGrid);
    
    try {
        const response = await fetch(`${API_URL}/categories/${categoryId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete category');
        }
        
        categories = categories.filter(c => c.id !== categoryId);
        updateCategoriesUI(categories);
        showNotification('Category deleted successfully!', 'success');
    } catch (error) {
        console.error('Error deleting category:', error);
        
        // Offline mode: Delete category locally
        categories = categories.filter(c => c.id !== categoryId);
        updateCategoriesUI(categories);
        showNotification('Category deleted in offline mode', 'warning');
    } finally {
        hideLoader();
    }
}

// Handle form submission
function handleCategorySubmit(e) {
    e.preventDefault();
    
    const categoryData = {
        name: document.getElementById('category-name').value,
        icon: document.getElementById('category-icon').value,
        color: document.getElementById('category-color').value,
        budget: parseFloat(document.getElementById('category-budget').value) || null
    };
    
    const categoryId = categoryForm.dataset.categoryId;
    
    if (categoryId) {
        // Update existing category
        updateCategoryById(parseInt(categoryId), categoryData);
    } else {
        // Add new category
        addCategory(categoryData);
    }
}

// Update category by ID
async function updateCategoryById(categoryId, categoryData) {
    showLoader(categoriesGrid);
    
    try {
        const response = await fetch(`${API_URL}/categories/${categoryId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(categoryData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to update category');
        }
        
        const updatedCategory = await response.json();
        
        // Update category in local array
        categories = categories.map(c => c.id === categoryId ? {...c, ...updatedCategory} : c);
        updateCategoriesUI(categories);
        showNotification('Category updated successfully!', 'success');
    } catch (error) {
        console.error('Error updating category:', error);
        
        // Offline mode: Update category locally
        categories = categories.map(c => c.id === categoryId ? {...c, ...categoryData} : c);
        updateCategoriesUI(categories);
        showNotification('Category updated in offline mode', 'warning');
    } finally {
        hideLoader();
        closeModalHandler();
    }
}

// Modal functions
function openModal() {
    categoryModal.style.display = 'block';
    document.body.classList.add('modal-open');
}

function closeModalHandler() {
    categoryModal.style.display = 'none';
    document.body.classList.remove('modal-open');
    categoryForm.reset();
    delete categoryForm.dataset.categoryId;
    
    // Reset modal title and submit button
    document.querySelector('.modal-header h2').textContent = 'Add New Category';
    document.querySelector('.form-actions .btn-primary').textContent = 'Save Category';
}

// Helper functions
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