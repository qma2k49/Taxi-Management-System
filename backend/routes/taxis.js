const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../dbConfig');

// Lấy danh sách toàn bộ xe
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Taxis ORDER BY TaxiID DESC');
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        console.error('Lỗi lấy danh sách Taxi:', err);
        res.status(500).json({ success: false, message: 'Lỗi truy xuất cơ sở dữ liệu' });
    }
});

// Thêm xe mới
router.post('/', async (req, res) => {
    const { licensePlate, vehicleType, status } = req.body;

    try {
        const pool = await poolPromise;

        // Kiểm tra biển số tồn tại
        const checkExist = await pool.request()
            .input('licensePlate', sql.VarChar, licensePlate)
            .query('SELECT TaxiID FROM Taxis WHERE LicensePlate = @licensePlate');

        if (checkExist.recordset.length > 0) {
            return res.status(400).json({ success: false, message: 'Biển số xe đã tồn tại!' });
        }

        await pool.request()
            .input('licensePlate', sql.VarChar, licensePlate)
            .input('vehicleType', sql.NVarChar, vehicleType)
            .input('status', sql.NVarChar, status || 'Rảnh')
            .query('INSERT INTO Taxis (LicensePlate, VehicleType, Status) VALUES (@licensePlate, @vehicleType, @status)');

        res.status(201).json({ success: true, message: 'Thêm xe thành công!' });
    } catch (err) {
        console.error('Lỗi thêm Taxi:', err);
        res.status(500).json({ success: false, message: 'Lỗi hệ thống khi thêm xe' });
    }
});

// Cập nhật trạng thái / cập nhật thông tin xe
router.put('/:id', async (req, res) => {
    const taxiId = req.params.id;
    const { licensePlate, vehicleType, status } = req.body;

    try {
        const pool = await poolPromise;
        
        // Kiểm tra xem biển số mới có trùng xe khác không
        const checkExist = await pool.request()
            .input('licensePlate', sql.VarChar, licensePlate)
            .input('taxiId', sql.Int, taxiId)
            .query('SELECT TaxiID FROM Taxis WHERE LicensePlate = @licensePlate AND TaxiID != @taxiId');

        if (checkExist.recordset.length > 0) {
            return res.status(400).json({ success: false, message: 'Biển số xe đã tồn tại cho một xe khác!' });
        }

        await pool.request()
            .input('id', sql.Int, taxiId)
            .input('licensePlate', sql.VarChar, licensePlate)
            .input('vehicleType', sql.NVarChar, vehicleType)
            .input('status', sql.NVarChar, status)
            .query('UPDATE Taxis SET LicensePlate = @licensePlate, VehicleType = @vehicleType, Status = @status WHERE TaxiID = @id');

        res.json({ success: true, message: 'Cập nhật thông tin xe thành công!' });
    } catch (err) {
        console.error('Lỗi cập nhật Taxi:', err);
        res.status(500).json({ success: false, message: 'Lỗi hệ thống khi cập nhật xe' });
    }
});

// Xóa xe
router.delete('/:id', async (req, res) => {
    const taxiId = req.params.id;

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, taxiId)
            .query('DELETE FROM Taxis WHERE TaxiID = @id');

        res.json({ success: true, message: 'Xóa xe thành công!' });
    } catch (err) {
        console.error('Lỗi xóa Taxi:', err);
        res.status(500).json({ success: false, message: 'Lỗi hệ thống khi xóa xe' });
    }
});

module.exports = router;
