// src/routes/admin.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 관리자 체크 미들웨어
function requireAdmin(req, res, next) {
    if (!req.session.user || !req.session.user.isAdmin) {
        return res.status(403).send('관리자만 접근 가능합니다.');
    }
    next();
}

// 관리자 대시보드
router.get('/', requireAdmin, (req, res) => {
    res.render('admin/index', {
        title: '관리자 대시보드',
        user: req.session.user
    });
});

// 전체 게시글 목록 (관리자용, 페이지네이션 + 검색)
router.get('/posts', requireAdmin, (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    const keyword = req.query.keyword ? req.query.keyword.trim() : '';
    const type = req.query.type || '';

    let where = 'WHERE 1=1';
    const params = [];
    const countParams = [];

    if (type === 'FREE' || type === 'NOTICE') {
        where += ' AND type = ?';
        params.push(type);
        countParams.push(type);
    }

    if (keyword) {
        where += ' AND title LIKE ?';
        params.push(`%${keyword}%`);
        countParams.push(`%${keyword}%`);
    }

    const countQuery = `SELECT COUNT(*) AS count FROM board_posts ${where}`;
    db.query(countQuery, countParams, (err, countRows) => {
        if (err) throw err;

        const totalPosts = countRows[0].count;
        const totalPages = Math.ceil(totalPosts / limit) || 1;

        const listQuery = `
            SELECT *
            FROM board_posts
            ${where}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `;
        params.push(limit, offset);

        db.query(listQuery, params, (err, posts) => {
            if (err) throw err;

            res.render('admin/posts', {
                title: '게시글 관리',
                user: req.session.user,
                posts,
                currentPage: page,
                totalPages,
                keyword,
                type
            });
        });
    });
});

// 특정 글을 공지로 변경
// POST /admin/posts/:postId/notice
router.post('/posts/:postId/notice', requireAdmin, (req, res) => {
    const postId = req.params.postId;
    const query = 'UPDATE board_posts SET type = "NOTICE" WHERE post_id = ?';
    db.query(query, [postId], (err) => {
        if (err) throw err;
        res.redirect('/admin/posts');
    });
});

// 특정 글을 자유글로 변경
// POST /admin/posts/:postId/free
router.post('/posts/:postId/free', requireAdmin, (req, res) => {
    const postId = req.params.postId;
    const query = 'UPDATE board_posts SET type = "FREE" WHERE post_id = ?';
    db.query(query, [postId], (err) => {
        if (err) throw err;
        res.redirect('/admin/posts');
    });
});

// 관리자 권한으로 글 삭제
// POST /admin/posts/:postId/delete
router.post('/posts/:postId/delete', requireAdmin, (req, res) => {
    const postId = req.params.postId;
    const query = 'DELETE FROM board_posts WHERE post_id = ?';
    db.query(query, [postId], (err) => {
        if (err) throw err;
        res.redirect('/admin/posts');
    });
});

module.exports = router;