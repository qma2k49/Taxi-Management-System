const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../dbConfig');
const jwt = require('jsonwebtoken');

// Lấy chìa khóa bảo mật từ file .env
const SECRET_KEY = process.env.JWT_SECRET || 'fallback_secret_key';

// ==========================================
// 1. API ĐĂNG NHẬP (POST /api/auth/login)
// ==========================================
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const pool = await poolPromise;

        // Truy vấn kiểm tra tài khoản trong SQL Server
        const result = await pool.request()
            .input('username', sql.VarChar, username)
            .input('password', sql.VarChar, password)
            .query('SELECT UserID, Username, FullName, RoleID, IsActive FROM Users WHERE Username = @username AND Password = @password');

        if (result.recordset.length > 0) {
            const user = result.recordset[0];

            // Kiểm tra xem tài khoản có bị Admin khóa không
            if (!user.IsActive) {
                return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa!' });
            }

            // Tạo Token mã hóa chứa ID và Role của user
            const token = jwt.sign({ id: user.UserID, role: user.RoleID }, SECRET_KEY, { expiresIn: '1d' }); // Hết hạn sau 1 ngày

            // Trả về Token và thông tin user cho Frontend
            res.json({
                success: true,
                token: token,
                user: { id: user.UserID, username: user.Username, fullName: user.FullName, roleId: user.RoleID }
            });
        } else {
            res.status(401).json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu!' });
        }
    } catch (err) {
        console.error('Lỗi API Login:', err);
        res.status(500).json({ success: false, message: 'Lỗi server hệ thống' });
    }
});

// ==========================================
// 2. API ĐĂNG KÝ (POST /api/auth/register)
// ==========================================
router.post('/register', async (req, res) => {
    // Chỉ cần nhận thông tin cơ bản, RoleID sẽ mặc định là 4 (Khách hàng)
    const { username, password, fullName, phone } = req.body;

    try {
        const pool = await poolPromise;

        // B1: Kiểm tra xem Username đã có ai lấy chưa
        const checkUser = await pool.request()
            .input('username', sql.VarChar, username)
            .query('SELECT UserID FROM Users WHERE Username = @username');

        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ success: false, message: 'Tên đăng nhập này đã có người sử dụng!' });
        }

        // B2: Thêm dữ liệu vào bảng Users
        await pool.request()
            .input('username', sql.VarChar, username)
            .input('password', sql.VarChar, password) // Lưu ý: Thực tế cần mã hóa pass (bcrypt), nhưng ở đây ta dùng text thường để khớp với Mock data Tuần 1
            .input('fullName', sql.NVarChar, fullName)
            .input('phone', sql.VarChar, phone)
            .input('roleId', sql.Int, 4)
            .query('INSERT INTO Users (Username, Password, FullName, Phone, RoleID) VALUES (@username, @password, @fullName, @phone, @roleId)');

        res.status(201).json({ success: true, message: 'Đăng ký tài khoản Khách hàng thành công!' });
    } catch (err) {
        console.error('Lỗi API Register:', err);
        res.status(500).json({ success: false, message: 'Lỗi server hệ thống' });
    }
});

module.exports = router;