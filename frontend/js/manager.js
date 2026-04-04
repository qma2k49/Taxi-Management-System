let isFirstLoad = true;

async function fetchOrders(isManualRefresh = false) {
    const tbody = document.getElementById('orders-table-body');

    // Chỉ hiện chữ "Đang tải" nếu là lần tải đầu tiên hoặc bấm nút bằng tay
    if (isFirstLoad || isManualRefresh) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #94a3b8;">Đang tải dữ liệu mới nhất...</td></tr>';
    }

    try {
        const response = await fetch('http://localhost:3000/api/orders');
        const result = await response.json();

        if (result.success) {
            let htmlContent = ''; // Gom toàn bộ HTML vào một biến chữ để tránh giật lag UI

            if (result.data.length === 0) {
                htmlContent = '<tr><td colspan="6" style="text-align: center; padding: 40px;">Chưa có đơn đặt xe nào trong hệ thống.</td></tr>';
            } else {
                result.data.forEach((order, index) => {
                    const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.EstimatedPrice);

                    // Format giờ VN (VD: 14:30:00 - 15/10/2023)
                    const orderDate = new Date(order.CreatedAt).toLocaleString('vi-VN', { hour12: false });

                    let statusClass = 'status-waiting';
                    if (order.Status === 'Đang chạy') statusClass = 'status-running';
                    if (order.Status === 'Hoàn thành') statusClass = 'status-done';

                    // Thêm animation delay cho mỗi hàng để tạo hiệu ứng rơi xuống tuần tự (Cascade)
                    const animationDelay = isFirstLoad ? `style="animation-delay: ${index * 0.05}s"` : '';

                    htmlContent += `
                        <tr ${animationDelay}>
                            <td>${order.OrderID}</td>
                            <td>👤 Khách #${order.CustomerID}</td>
                            <td><strong style="color: #3b82f6;">${order.DistanceKM} km</strong></td>
                            <td class="price-text">${formattedPrice}</td>
                            <td>${orderDate}</td>
                            <td><span class="status-badge ${statusClass}">${order.Status}</span></td>
                        </tr>
                    `;
                });
            }

            // Gắn toàn bộ HTML mới vào bảng cùng 1 lúc (chống nháy màn hình)
            tbody.innerHTML = htmlContent;
            isFirstLoad = false;
        }
    } catch (error) {
        console.error("Lỗi mạng:", error);
        if (isFirstLoad) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Mất kết nối với máy chủ Backend!</td></tr>`;
        }
    }
}

// 1. Chạy ngay lần đầu tiên khi mở trang
window.onload = fetchOrders;

// 2. Thiết lập chạy ngầm tự động mỗi 5 giây (5000 milliseconds)
setInterval(() => fetchOrders(false), 5000);