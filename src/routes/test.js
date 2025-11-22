const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Todo list for test
router.get('/', (req, res) => {
    const query = 'SELECT * FROM tododb ORDER BY todo_id DESC';
    db.query(query, (err, results) => {
        if (err) throw err;
        res.render('test/todos-list', {
            title: 'Test Todo List',
            user: req.session.user,
            todos: results
        });
    });
});

// Get all users
router.get('/users', (req, res) => {
    const query = 'SELECT * FROM users';
    db.query(query, (err, users) => {
        if (err) throw err;
        res.render('test/users-list', {
            title: 'Users List',
            user: req.session.user,
            users: users
        });
    });
});

// Get todos for a specific user
router.get('/users/:userId/todos', (req, res) => {
    const userId = req.params.userId;
    const userQuery = 'SELECT user_name FROM users WHERE user_id = ?';
    const todosQuery = 'SELECT * FROM tododb WHERE user_id = ? ORDER BY created_at DESC';

    db.query(userQuery, [userId], (err, userResult) => {
        if (err) throw err;
        if (userResult.length === 0) {
            return res.status(404).send('User not found');
        }
        const userName = userResult[0].user_name;

        db.query(todosQuery, [userId], (err, todos) => {
            if (err) throw err;
            res.render('test/user-todos', {
                title: `Todos for ${userName}`,
                user: req.session.user,
                userName: userName,
                todos: todos
            });
        });
    });
});

// Get paginated todos for a specific user
router.get('/users/:userId/todos-page', (req, res) => {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = 3;
    const offset = (page - 1) * limit;

    const userQuery = 'SELECT user_name FROM users WHERE user_id = ?';
    const countQuery = 'SELECT COUNT(*) AS count FROM tododb WHERE user_id = ?';
    
    db.query(userQuery, [userId], (err, userResult) => {
        if (err) throw err;
        if (userResult.length === 0) {
            return res.status(404).send('User not found');
        }
        const userName = userResult[0].user_name;

        db.query(countQuery, [userId], (err, countResult) => {
            if (err) throw err;

            const totalTodos = countResult[0].count;
            const totalPages = Math.ceil(totalTodos / limit);

            const todosQuery = 'SELECT * FROM tododb WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?';
            db.query(todosQuery, [userId, limit, offset], (err, todos) => {
                if (err) throw err;
                res.render('test/user-todos-page', {
                    title: `Todos for ${userName}`,
                    user: req.session.user,
                    userName: userName,
                    todos: todos,
                    userId: userId,
                    currentPage: page,
                    totalPages: totalPages
                });
            });
        });
    });
});

// Show form to insert a new todo
router.get('/todoInsertView', (req, res) => {
    const query = 'SELECT * FROM users';
    db.query(query, (err, users) => {
        if (err) throw err;
        res.render('test/todoInsertView', {
            title: 'Insert New Todo',
            user: req.session.user,
            users: users
        });
    });
});

// Handle form submission for inserting a new todo
router.post('/todoInsertPost', (req, res) => {
    const { user_id, title } = req.body;
    const is_completed = req.body.is_completed ? 1 : 0;
    
    const query = 'INSERT INTO tododb (user_id, title, is_completed) VALUES (?, ?, ?)';
    db.query(query, [user_id, title, is_completed], (err, result) => {
        if (err) throw err;
        res.redirect(`/test/users/${user_id}/todos`);
    });
});

// Show form to modify a todo
router.get('/todoModifyView/:todoId', (req, res) => {
    const { todoId } = req.params;
    const query = 'SELECT * FROM tododb WHERE todo_id = ?';
    db.query(query, [todoId], (err, result) => {
        if (err) throw err;
        if (result.length === 0) {
            return res.status(404).send('Todo not found');
        }
        res.render('test/todoModifyView', {
            title: 'Modify Todo',
            user: req.session.user,
            todo: result[0]
        });
    });
});

// Handle form submission for modifying a todo
router.post('/todoModifyPost/:todoId', (req, res) => {
    const { todoId } = req.params;
    const { title, user_id } = req.body;
    const is_completed = req.body.is_completed ? 1 : 0;

    const query = 'UPDATE tododb SET title = ?, is_completed = ? WHERE todo_id = ?';
    db.query(query, [title, is_completed, todoId], (err, result) => {
        if (err) throw err;
        res.redirect(`/test/users/${user_id}/todos`);
    });
});

// Handle form submission for deleting a todo
router.post('/todoDeletePost/:todoId', (req, res) => {
    const { todoId } = req.params;
    const { user_id } = req.body;
    
    const query = 'DELETE FROM tododb WHERE todo_id = ?';
    db.query(query, [todoId], (err, result) => {
        if (err) throw err;
        res.redirect(`/test/users/${user_id}/todos`);
    });
});

module.exports = router;
