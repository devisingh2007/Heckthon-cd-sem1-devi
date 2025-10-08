// DOM Elements
const reportPeriod = document.getElementById('report-period');
const exportReportBtn = document.getElementById('export-report-btn');
const printReportBtn = document.getElementById('print-report-btn');
const categoryChart = document.getElementById('category-chart');
const trendChart = document.getElementById('trend-chart');
const tableFilter = document.getElementById('table-filter');
const searchInput = document.querySelector('.search-bar input');
const reportTableBody = document.getElementById('report-table-body');

// API URL (same as in script.js)
const API_URL = 'http://localhost:3000/api';

// Sample data for offline mode
const SAMPLE_EXPENSES = [
    { id: 1, date: '2023-05-28', description: 'Grocery Shopping', category: 'Groceries', amount: 85.42, categoryColor: '#fa5c7c' },
    { id: 2, date: '2023-05-26', description: 'Restaurant Dinner', category: 'Food & Dining', amount: 64.30, categoryColor: '#727cf5' },
    { id: 3, date: '2023-05-25', description: 'Uber Ride', category: 'Transportation', amount: 18.75, categoryColor: '#0acf97' },
    { id: 4, date: '2023-05-22', description: 'Movie Tickets', category: 'Entertainment', amount: 32.50, categoryColor: '#ff9f43' },
    { id: 5, date: '2023-05-20', description: 'Electricity Bill', category: 'Utilities', amount: 95.00, categoryColor: '#323a46' },
    { id: 6, date: '2023-05-18', description: 'Coffee Shop', category: 'Food & Dining', amount: 12.40, categoryColor: '#727cf5' },
    { id: 7, date: '2023-05-15', description: 'Gas Station', category: 'Transportation', amount: 45.80, categoryColor: '#0acf97' },
    { id: 8, date: '2023-05-12', description: 'Online Shopping', category: 'Shopping', amount: 78.50, categoryColor: '#6c757d' },
    { id: 9, date: '2023-05-10', description: 'Phone Bill', category: 'Utilities', amount: 55.00, categoryColor: '#323a46' },
    { id: 10, date: '2023-05-05', description: 'Lunch with Friends', category: 'Food & Dining', amount: 32.80, categoryColor: '#727cf5' }
];

// Store expenses data
let expenses = [];
let filteredExpenses = [];
let currentPage = 1;
const itemsPerPage = 5;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    fetchExpenses();
    
    // Filter and export event listeners
    reportPeriod.addEventListener('change', handlePeriodChange);
    tableFilter.addEventListener('change', filterTable);
    searchInput.addEventListener('input', filterTable);
    exportReportBtn.addEventListener('click', exportReport);
    printReportBtn.addEventListener('click', printReport);
    
    // Pagination event listeners
    document.querySelectorAll('.btn-page').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!btn.classList.contains('active')) {
                currentPage = parseInt(btn.textContent);
                updateTablePagination();
            }
        });
    });
    
    document.querySelector('.pagination-controls .fa-chevron-right').parentElement.addEventListener('click', () => {
        if (currentPage < Math.ceil(filteredExpenses.length / itemsPerPage)) {
            currentPage++;
            updateTablePagination();
        }
    });
    
    document.querySelector('.pagination-controls .fa-chevron-left').parentElement.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updateTablePagination();
        }
    });
});

// Fetch expenses from API
async function fetchExpenses() {
    showLoader(document.querySelector('.reports-section'));
    
    try {
        const response = await fetch(`${API_URL}/expenses`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        expenses = await response.json();
        filteredExpenses = [...expenses];
        updateReportsUI();
    } catch (error) {
        console.error('Error fetching expenses:', error);
        // Use sample data in offline mode
        expenses = [...SAMPLE_EXPENSES];
        filteredExpenses = [...expenses];
        updateReportsUI();
        showNotification('Warning: Using offline mode with sample data', 'warning');
    } finally {
        hideLoader();
    }
}

// Update reports UI
function updateReportsUI() {
    updateSummaryCards();
    updateCharts();
    updateTable();
}

// Update summary cards
function updateSummaryCards() {
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const avgDailySpend = calculateAverageDailySpend(filteredExpenses);
    const topCategory = findTopCategory(filteredExpenses);
    
    // Update total expenses card
    document.querySelector('.report-cards .report-value').textContent = `₹${totalExpenses.toFixed(2)}`;
    
    // Update average daily spend card
    document.querySelectorAll('.report-cards .report-value')[1].textContent = `₹${avgDailySpend.toFixed(2)}`;
    
    // Update top category card
    if (topCategory) {
        document.querySelectorAll('.report-cards .report-value')[2].textContent = topCategory.category;
        document.querySelectorAll('.report-cards .report-trend')[2].textContent = 
            `₹${topCategory.amount.toFixed(2)} (${Math.round((topCategory.amount / totalExpenses) * 100)}% of total)`;
    }
}

// Calculate average daily spend
function calculateAverageDailySpend(expenses) {
    if (expenses.length === 0) return 0;
    
    const dates = expenses.map(expense => new Date(expense.date));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    const daysDiff = Math.max(1, Math.round((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1);
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    return totalAmount / daysDiff;
}

// Find top category
function findTopCategory(expenses) {
    if (expenses.length === 0) return null;
    
    const categoryTotals = {};
    
    expenses.forEach(expense => {
        if (!categoryTotals[expense.category]) {
            categoryTotals[expense.category] = 0;
        }
        categoryTotals[expense.category] += expense.amount;
    });
    
    let topCategory = null;
    let maxAmount = 0;
    
    for (const category in categoryTotals) {
        if (categoryTotals[category] > maxAmount) {
            maxAmount = categoryTotals[category];
            topCategory = category;
        }
    }
    
    return { category: topCategory, amount: maxAmount };
}

// Update charts
function updateCharts() {
    updateCategoryChart();
    updateTrendChart();
}

// Update category chart
function updateCategoryChart() {
    const categoryData = {};
    const categoryColors = {};
    
    filteredExpenses.forEach(expense => {
        if (!categoryData[expense.category]) {
            categoryData[expense.category] = 0;
            categoryColors[expense.category] = expense.categoryColor || getRandomColor();
        }
        categoryData[expense.category] += expense.amount;
    });
    
    const categories = Object.keys(categoryData);
    const amounts = Object.values(categoryData);
    const colors = categories.map(category => categoryColors[category]);
    
    if (window.categoryChartInstance) {
        window.categoryChartInstance.destroy();
    }
    
    window.categoryChartInstance = new Chart(categoryChart, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Update trend chart
function updateTrendChart() {
    // Group expenses by month
    const monthlyData = {};
    
    filteredExpenses.forEach(expense => {
        const date = new Date(expense.date);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = 0;
        }
        monthlyData[monthYear] += expense.amount;
    });
    
    // Sort months chronologically
    const sortedMonths = Object.keys(monthlyData).sort();
    const monthLabels = sortedMonths.map(month => {
        const [year, monthNum] = month.split('-');
        return `${getMonthName(parseInt(monthNum) - 1)} ${year}`;
    });
    const monthlyAmounts = sortedMonths.map(month => monthlyData[month]);
    
    if (window.trendChartInstance) {
        window.trendChartInstance.destroy();
    }
    
    window.trendChartInstance = new Chart(trendChart, {
        type: 'line',
        data: {
            labels: monthLabels,
            datasets: [{
                label: 'Monthly Expenses',
                data: monthlyAmounts,
                borderColor: '#727cf5',
                backgroundColor: 'rgba(114, 124, 245, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => `₹${value}`
                    }
                }
            }
        }
    });
}

// Update table
function updateTable() {
    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex);
    
    reportTableBody.innerHTML = '';
    
    if (paginatedExpenses.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="4" class="empty-table">No expenses found</td>';
        reportTableBody.appendChild(emptyRow);
        return;
    }
    
    paginatedExpenses.forEach(expense => {
        const row = document.createElement('tr');
        
        const date = new Date(expense.date);
        const formattedDate = `${getMonthName(date.getMonth())} ${date.getDate()}, ${date.getFullYear()}`;
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${expense.description}</td>
            <td><span class="category-tag" style="background-color: ${hexToRgba(expense.categoryColor || '#6c757d', 0.1)}; color: ${expense.categoryColor || '#6c757d'};">${expense.category}</span></td>
            <td>₹${expense.amount.toFixed(2)}</td>
        `;
        
        reportTableBody.appendChild(row);
    });
    
    updateTablePagination();
}

// Update table pagination
function updateTablePagination() {
    const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
    const paginationInfo = document.querySelector('.pagination-info');
    const paginationControls = document.querySelector('.pagination-controls');
    
    // Update pagination info
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, filteredExpenses.length);
    paginationInfo.textContent = `Showing ${startItem}-${endItem} of ${filteredExpenses.length} entries`;
    
    // Update pagination buttons
    const pageButtons = paginationControls.querySelectorAll('.btn-page');
    pageButtons.forEach((btn, index) => {
        const pageNum = index + 1;
        btn.textContent = pageNum;
        btn.classList.toggle('active', pageNum === currentPage);
        btn.style.display = pageNum <= totalPages ? 'inline-block' : 'none';
    });
    
    // Update arrow buttons
    paginationControls.querySelector('.fa-chevron-left').parentElement.disabled = currentPage === 1;
    paginationControls.querySelector('.fa-chevron-right').parentElement.disabled = currentPage === totalPages;
    
    // Update table content
    updateTable();
}

// Filter table based on search and category filter
function filterTable() {
    const searchTerm = searchInput.value.toLowerCase();
    const categoryFilter = tableFilter.value;
    
    filteredExpenses = expenses.filter(expense => {
        const matchesSearch = expense.description.toLowerCase().includes(searchTerm) || 
                             expense.category.toLowerCase().includes(searchTerm);
        const matchesCategory = categoryFilter === 'all' || 
                               (categoryFilter === 'food' && expense.category === 'Food & Dining') ||
                               (categoryFilter === 'transport' && expense.category === 'Transportation') ||
                               (categoryFilter === 'entertainment' && expense.category === 'Entertainment') ||
                               (categoryFilter === 'groceries' && expense.category === 'Groceries') ||
                               (categoryFilter === 'utilities' && expense.category === 'Utilities');
        
        return matchesSearch && matchesCategory;
    });
    
    currentPage = 1;
    updateReportsUI();
}

// Handle period change
function handlePeriodChange() {
    const period = reportPeriod.value;
    const today = new Date();
    let startDate;
    
    switch (period) {
        case 'week':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 7);
            break;
        case 'month':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            break;
        case 'quarter':
            const quarter = Math.floor(today.getMonth() / 3);
            startDate = new Date(today.getFullYear(), quarter * 3, 1);
            break;
        case 'year':
            startDate = new Date(today.getFullYear(), 0, 1);
            break;
        case 'custom':
            // Show custom date picker (not implemented in this demo)
            showNotification('Custom date range picker not implemented in demo', 'info');
            return;
    }
    
    // Filter expenses by date
    filteredExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startDate && expenseDate <= today;
    });
    
    // Update period display in report cards
    const periodText = getPeriodDisplayText(period, startDate, today);
    document.querySelectorAll('.report-period').forEach(el => {
        el.textContent = periodText;
    });
    
    currentPage = 1;
    updateReportsUI();
}

// Get period display text
function getPeriodDisplayText(period, startDate, endDate) {
    switch (period) {
        case 'week':
            return `${formatShortDate(startDate)} - ${formatShortDate(endDate)}`;
        case 'month':
            return `${getMonthName(endDate.getMonth())} ${endDate.getFullYear()}`;
        case 'quarter':
            const quarter = Math.floor(endDate.getMonth() / 3) + 1;
            return `Q${quarter} ${endDate.getFullYear()}`;
        case 'year':
            return endDate.getFullYear().toString();
        default:
            return `${formatShortDate(startDate)} - ${formatShortDate(endDate)}`;
    }
}

// Export report
function exportReport() {
    showNotification('Report exported successfully!', 'success');
}

// Print report
function printReport() {
    window.print();
}

// Helper functions
function getMonthName(monthIndex) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthIndex];
}

function formatShortDate(date) {
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

function hexToRgba(hex, alpha = 1) {
    if (!hex || hex === '#') return `rgba(108, 117, 125, ${alpha})`;
    
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getRandomColor() {
    const colors = ['#727cf5', '#0acf97', '#fa5c7c', '#ff9f43', '#323a46', '#6c757d'];
    return colors[Math.floor(Math.random() * colors.length)];
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