let isFirstLoad = true;

async function fetchOrders() {
    const tbody = document.getElementById('orders-table-body');

    // SỬA LẠI ĐOẠN NÀY: Chỉ hiện chữ "Đang tải" ở lần đầu tiên
    if (isFirstLoad) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666;">Đang tải dữ liệu...</td></tr>';
    }

    try {
        const response = await fetch('http://localhost:3000/api/orders');
        const result = await response.json();

        if (result.success) {
            let htmlContent = ''; // Tạo một biến chứa HTML tạm để nhét vào 1 lần (chống giật)

            if (result.data.length === 0) {
                htmlContent = '<tr><td colspan="6" style="text-align: center;">Chưa có đơn đặt xe nào.</td></tr>';
            } else {
                // Duyệt vòng lặp forEach y hệt như code cũ của bạn
                result.data.forEach(order => {
                    const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.EstimatedPrice);
                    const orderDate = new Date(order.CreatedAt).toLocaleString('vi-VN');

                    let statusClass = 'status-waiting';
                    if (order.Status === 'Đang chạy') statusClass = 'status-running';
                    if (order.Status === 'Hoàn thành') statusClass = 'status-done';

                    htmlContent += `
                        <tr>
                            <td><strong>${order.OrderID}</strong></td>
                            <td>Khách #${order.CustomerID}</td>
                            <td>${order.DistanceKM} km</td>
                            <td style="color: #dc3545; font-weight: bold;">${formattedPrice}</td>
                            <td>${orderDate}</td>
                            <td><span class="status-badge ${statusClass}">${order.Status}</span></td>
                        </tr>
                    `;
                });
            }

            // Ghi đè giao diện 1 lần duy nhất bằng dữ liệu mới và tắt cờ FirstLoad
            tbody.innerHTML = htmlContent;
            isFirstLoad = false;
        }
    } catch (error) {
        console.error("Lỗi khi tải danh sách đơn hàng:", error);
    }
}

// 1. Chạy ngay lần đầu tiên khi mở trang
window.onload = fetchOrders;

// 2. Thiết lập chạy ngầm tự động mỗi 5 giây (5000 milliseconds)
setInterval(() => fetchOrders(false), 5000);