const express = require('express');
const router = express.Router();

// Hàm tính tiền nội bộ của Backend
function calculateTaxiFare(distanceKm) {
    let price = 0;

    // 1. Giá mở cửa (2km đầu tiên)
    if (distanceKm <= 2) {
        price = 20000;
    } else {
        price = 20000;

        // 2. Lũy tiến từ km thứ 2 đến km 20
        if (distanceKm <= 20) {
            price += (distanceKm - 2) * 13000;
        }
        // 3. Lũy tiến từ km 21 trở đi
        else {
            price += (18 * 13000);
            price += (distanceKm - 20) * 11000;
        }
    }

    // 4. Phụ thu ban đêm (22h00 - 05h59 sáng)
    const currentHour = new Date().getHours();
    let isNightSurcharge = false;

    if (currentHour >= 22 || currentHour < 5) {
        price = price * 1.2;
        isNightSurcharge = true;
    }

    return {
        total: Math.round(price),
        isNight: isNightSurcharge
    };
}

// ==========================================
// API NHẬN YÊU CẦU TÍNH TIỀN TỪ FRONTEND
// POST /api/fare/calculate
// ==========================================
router.post('/calculate', (req, res) => {
    const { distanceKm } = req.body;

    if (!distanceKm || isNaN(distanceKm)) {
        return res.status(400).json({ success: false, message: 'Dữ liệu khoảng cách không hợp lệ' });
    }

    // Gọi hàm tính toán
    const fareResult = calculateTaxiFare(parseFloat(distanceKm));

    // Trả kết quả về cho Frontend
    res.json({
        success: true,
        data: fareResult
    });
});

module.exports = router;