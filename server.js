const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/')));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Add response time middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${duration}ms`);
  });
  next();
});

// Data storage - in a real app, this would be a database
let expenses = [
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

// Routes
// Get all expenses
app.get('/api/expenses', (req, res) => {
    res.json(expenses);
});

// Get expense by ID
app.get('/api/expenses/:id', (req, res) => {
    const expense = expenses.find(exp => exp.id === parseInt(req.params.id));
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json(expense);
});

// Create new expense
app.post('/api/expenses', (req, res) => {
    const { title, amount, category, date, notes } = req.body;
    
    // Validate request
    if (!title || !amount || !category) {
        return res.status(400).json({ message: 'Please provide title, amount, and category' });
    }
    
    const newExpense = {
        id: expenses.length > 0 ? Math.max(...expenses.map(exp => exp.id)) + 1 : 1,
        title,
        amount: parseFloat(amount),
        category,
        date: date || new Date().toISOString(),
        notes: notes || ''
    };
    
    expenses.unshift(newExpense);
    res.status(201).json(newExpense);
});

// Update expense
app.put('/api/expenses/:id', (req, res) => {
    const expense = expenses.find(exp => exp.id === parseInt(req.params.id));
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    
    const { title, amount, category, date, notes } = req.body;
    
    // Update expense properties
    if (title) expense.title = title;
    if (amount) expense.amount = parseFloat(amount);
    if (category) expense.category = category;
    if (date) expense.date = date;
    if (notes !== undefined) expense.notes = notes;
    
    res.json(expense);
});

// Delete expense
app.delete('/api/expenses/:id', (req, res) => {
    const index = expenses.findIndex(exp => exp.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ message: 'Expense not found' });
    
    const deletedExpense = expenses.splice(index, 1)[0];
    res.json(deletedExpense);
});

// Get expense statistics
app.get('/api/statistics', (req, res) => {
    // Calculate total expenses
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalCount = expenses.length;
    
    // Count expenses by category
    const categoryCounts = {};
    const categoryTotals = {};
    expenses.forEach(expense => {
        if (categoryCounts[expense.category]) {
            categoryCounts[expense.category].count++;
            categoryCounts[expense.category].amount += expense.amount;
        } else {
            categoryCounts[expense.category] = {
                count: 1,
                amount: expense.amount
            };
        }
        
        if (!categoryTotals[expense.category]) {
            categoryTotals[expense.category] = 0;
        }
        categoryTotals[expense.category] += expense.amount;
    });
    
    // Calculate average daily spend
    let avgDailySpend = 0;
    if (expenses.length > 0) {
        const today = new Date();
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(today.getDate() - 7);
        
        const recentExpenses = expenses.filter(exp => new Date(exp.date) >= oneWeekAgo);
        const recentTotal = recentExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        avgDailySpend = recentTotal / 7;
    }
    
    // Get recent expenses (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentExpenses = expenses.filter(expense => 
        new Date(expense.date) >= thirtyDaysAgo
    );
    
    const recentTotal = recentExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Add cache control headers
    res.set('Cache-Control', 'public, max-age=30'); // Cache for 30 seconds
    
    res.json({
        total: {
            count: totalCount,
            amount: totalAmount
        },
        categories: categoryCounts,
        categoryTotals,
        recent: {
            count: recentExpenses.length,
            amount: recentTotal
        },
        avgDailySpend: parseFloat(avgDailySpend.toFixed(2))
    });
});

// Serve the main HTML file for any other route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});