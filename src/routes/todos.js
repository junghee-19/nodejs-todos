// src/routes/todos.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 로그인이 꼭 필요하지는 않게, 있으면 사용 / 없으면 익명 처리
function getWriterInfo(req) {
    if (req.session && req.session.user) {
        return {
            writer_id: req.session.user.id,
            writer_name: req.session.user.name
        };
    }
    return {
        writer_id: null,
        writer_name: '익명'
    };
}

// 글쓰기 폼
// GET /todos/write
router.get('/write', (req, res) => {
    res.render('index/write', {
        title: '새 글 작성',
        user: req.session.user || null,
        post: null
    });
});

// 글 작성 처리
// POST /todos/write
router.post('/write', (req, res) => {
    const { title, content } = req.body;
    const writer = getWriterInfo(req);

    const insertQuery = `
        INSERT INTO board_posts (title, content, writer_id, writer_name)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        insertQuery,
        [title, content, writer.writer_id, writer.writer_name],
        (err) => {
            if (err) throw err;
            res.redirect('/board');
        }
    );
});

// 글 수정 폼
// GET /todos/:postId/edit
router.get('/:postId/edit', (req, res) => {
    const postId = req.params.postId;
    const query = 'SELECT * FROM board_posts WHERE post_id = ?';

    db.query(query, [postId], (err, rows) => {
        if (err) throw err;
        if (rows.length === 0) {
            return res.status(404).send('게시글을 찾을 수 없습니다.');
        }

        res.render('index/edit', {
            title: '게시글 수정',
            user: req.session.user || null,
            post: rows[0]
        });
    });
});

// 글 수정 처리
// POST /todos/:postId/edit
router.post('/:postId/edit', (req, res) => {
    const postId = req.params.postId;
    const { title, content } = req.body;

    const updateQuery = `
        UPDATE board_posts
        SET title = ?, content = ?
        WHERE post_id = ?
    `;

    db.query(updateQuery, [title, content, postId], (err) => {
        if (err) throw err;
        res.redirect('/board/' + postId);
    });
});

// 글 삭제
// POST /todos/:postId/delete
router.post('/:postId/delete', (req, res) => {
    const postId = req.params.postId;
    const deleteQuery = 'DELETE FROM board_posts WHERE post_id = ?';

    db.query(deleteQuery, [postId], (err) => {
        if (err) throw err;
        res.redirect('/board');
    });
});

module.exports = router;