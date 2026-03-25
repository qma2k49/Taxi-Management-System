const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../dbConfig');

// ==========================================
// 1. API LẤY DANH SÁCH USER (GET /api/users)
// ==========================================
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        // Kết hợp bảng Users và Roles để lấy ra tên Quyền (RoleName) cho dễ nhìn
        const result = await pool.request().query(`
            SELECT u.UserID, u.Username, u.FullName, u.Phone, u.IsActive, r.RoleName 
            FROM Users u
            JOIN Roles r ON u.RoleID = r.RoleID
            ORDER BY u.UserID DESC
        `);

        res.json({ success: true, data: result.recordset });
    } catch (err) {
        console.error('Lỗi lấy danh sách User:', err);
        res.status(500).json({ success: false, message: 'Lỗi truy xuất cơ sở dữ liệu' });
    }
});

// ==========================================
// 2. API THÊM MỚI USER (POST /api/users)
// ==========================================
router.post('/', async (req, res) => {
    const { username, password, fullName, phone, roleId } = req.body;

    try {
        const pool = await poolPromise;

        // Kiểm tra xem Username đã tồn tại chưa
        const checkExist = await pool.request()
            .input('username', sql.VarChar, username)
            .query('SELECT UserID FROM Users WHERE Username = @username');

        if (checkExist.recordset.length > 0) {
            return res.status(400).json({ success: false, message: 'Tên đăng nhập đã tồn tại!' });
        }

        // Thêm người dùng mới
        await pool.request()
            .input('username', sql.VarChar, username)
            .input('password', sql.VarChar, password)
            .input('fullName', sql.NVarChar, fullName)
            .input('phone', sql.VarChar, phone)
            .input('roleId', sql.Int, roleId)
            .query('INSERT INTO Users (Username, Password, FullName, Phone, RoleID) VALUES (@username, @password, @fullName, @phone, @roleId)');

        res.status(201).json({ success: true, message: 'Đã thêm người dùng mới thành công!' });
    } catch (err) {
        console.error('Lỗi thêm User:', err);
        res.status(500).json({ success: false, message: 'Lỗi hệ thống khi thêm User' });
    }
});

// ==========================================
// 3. API KHÓA/MỞ KHÓA TÀI KHOẢN (PUT /api/users/toggle-status/:id)
// ==========================================
router.put('/toggle-status/:id', async (req, res) => {
    const userId = req.params.id;
    const { isActive } = req.body; // Nhận trạng thái mới (1 là Mở, 0 là Khóa)

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, userId)
            .input('isActive', sql.Bit, isActive)
            .query('UPDATE Users SET IsActive = @isActive WHERE UserID = @id');

        res.json({ success: true, message: 'Đã cập nhật trạng thái tài khoản!' });
    } catch (err) {
        console.error('Lỗi cập nhật trạng thái:', err);
        res.status(500).json({ success: false, message: 'Lỗi hệ thống khi cập nhật' });
    }
});

module.exports = router;