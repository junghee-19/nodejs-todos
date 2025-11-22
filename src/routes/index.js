// src/routes/index.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 홈 -> 게시판 목록으로 이동
router.get('/', (req, res) => {
    res.redirect('/board');
});

// 게시판 목록 + 페이지네이션 + 제목 검색
router.get('/board', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;                       // 한 페이지당 10개
    const offset = (page - 1) * limit;

    const keyword = req.query.keyword ? req.query.keyword.trim() : '';

    // 검색 조건
    let where = 'WHERE 1=1';
    const params = [];
    const countParams = [];

    if (keyword) {
        where += ' AND title LIKE ?';
        params.push(`%${keyword}%`);
        countParams.push(`%${keyword}%`);
    }

    // 전체 개수
    const countQuery = `SELECT COUNT(*) AS count FROM board_posts ${where}`;

    db.query(countQuery, countParams, (err, countRows) => {
        if (err) throw err;

        const totalPosts = countRows[0].count;
        const totalPages = Math.ceil(totalPosts / limit) || 1;

        // 실제 목록 가져오기
        const listQuery = `
            SELECT *
            FROM board_posts
            ${where}
            ORDER BY post_id DESC
            LIMIT ? OFFSET ?
        `;
        params.push(limit, offset);

        db.query(listQuery, params, (err, posts) => {
            if (err) throw err;

            res.render('index/list', {
                title: '자유게시판',
                user: req.session.user || null,  // 로그인 안 쓰면 그냥 null
                posts,
                currentPage: page,
                totalPages,
                keyword
            });
        });
    });
});

// 게시글 본문 보기 + 조회수 증가
router.get('/board/:postId', (req, res) => {
    const postId = req.params.postId;

    // 1) 조회수 +1
    const hitQuery = 'UPDATE board_posts SET view_count = view_count + 1 WHERE post_id = ?';

    db.query(hitQuery, [postId], (err) => {
        if (err) throw err;

        // 2) 글 내용 조회
        const selectQuery = 'SELECT * FROM board_posts WHERE post_id = ?';

        db.query(selectQuery, [postId], (err, rows) => {
            if (err) throw err;
            if (rows.length === 0) {
                return res.status(404).send('게시글을 찾을 수 없습니다.');
            }

            const post = rows[0];

            res.render('index/detail', {
                title: post.title,
                user: req.session.user || null,
                post
            });
        });
    });
});

module.exports = router;