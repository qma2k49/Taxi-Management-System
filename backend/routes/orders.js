const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../dbConfig');

// ==========================================
// API: KHÁCH HÀNG TẠO ĐƠN ĐẶT XE MỚI
// POST /api/orders
// ==========================================
router.post('/', async (req, res) => {
    // Trích xuất dữ liệu từ body của Request
    const {
        orderId, customerId,
        pickupLat, pickupLng,
        dropoffLat, dropoffLng,
        distanceKm, estimatedPrice
    } = req.body;

    // Kiểm tra dữ liệu đầu vào (Validate)
    if (!orderId || !customerId || !pickupLat || !dropoffLat) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin đặt xe bắt buộc!' });
    }

    try {
        const pool = await poolPromise;

        // Lưu vào Database theo đúng Schema bạn đã tạo
        await pool.request()
            .input('orderId', sql.VarChar(50), orderId)
            .input('customerId', sql.Int, customerId)
            .input('pickupLat', sql.Float, pickupLat)
            .input('pickupLng', sql.Float, pickupLng)
            .input('dropoffLat', sql.Float, dropoffLat)
            .input('dropoffLng', sql.Float, dropoffLng)
            .input('distanceKm', sql.Float, distanceKm)
            .input('estimatedPrice', sql.Float, estimatedPrice) // Schema của bạn dùng FLOAT
            .query(`
                INSERT INTO Orders 
                (OrderID, CustomerID, PickupLat, PickupLng, DropoffLat, DropoffLng, DistanceKM, EstimatedPrice)
                VALUES 
                (@orderId, @customerId, @pickupLat, @pickupLng, @dropoffLat, @dropoffLng, @distanceKm, @estimatedPrice)
            `);

        res.status(201).json({ success: true, message: 'Tạo đơn đặt xe thành công!' });

    } catch (err) {
        console.error('Lỗi khi tạo đơn hàng:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi lưu đơn hàng.' });
    }
});

// ==========================================
// API: QUẢN LÝ LẤY DANH SÁCH ĐƠN HÀNG
// GET /api/orders
// ==========================================
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        // Lấy toàn bộ đơn hàng, đơn nào mới đặt thì nổi lên trên cùng (DESC)
        const result = await pool.request().query(`
            SELECT * FROM Orders 
            ORDER BY CreatedAt DESC
        `);

        res.json({ success: true, data: result.recordset });

    } catch (err) {
        console.error('Lỗi khi lấy danh sách đơn hàng:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi truy xuất đơn hàng.' });
    }
});

module.exports = router;