// Khởi tạo bản đồ, tạm lấy tâm ở Hà Nội
const map = L.map('map').setView([21.028511, 105.804817], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

// Icon xe taxi
const taxiIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/75/75733.png', // URL icon taxi miễn phí
    iconSize: [40, 40],
    iconAnchor: [20, 20]
});

let driverMarker = null;

// Hàm lấy vị trí hiện tại (GPS)
function locateDriver() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                // Cập nhật góc nhìn bản đồ
                map.setView([lat, lng], 16);

                // Vẽ hoặc cập nhật marker xe taxi
                if (driverMarker) {
                    driverMarker.setLatLng([lat, lng]);
                } else {
                    driverMarker = L.marker([lat, lng], { icon: taxiIcon }).addTo(map)
                        .bindPopup('<b>Vị trí hiện tại của bạn</b>').openPopup();
                }
                console.log(`Đã lấy được vị trí GPS: ${lat}, ${lng}`);
            },
            (error) => {
                console.error("Lỗi lấy vị trí: ", error);
                alert("Không thể lấy được vị trí. Đang hiển thị vị trí mặc định.");
                // Vẽ marker ở vị trí mặc định nếu lỗi
                driverMarker = L.marker([21.028511, 105.804817], { icon: taxiIcon }).addTo(map);
            },
            { enableHighAccuracy: true } // Yêu cầu GPS độ chính xác cao
        );
    } else {
        alert("Trình duyệt của bạn không hỗ trợ định vị GPS.");
    }
}

// Gọi hàm ngay khi mở trang
locateDriver();

// Xử lý nút gạt trạng thái (Online / Offline)
const statusToggleBtn = document.getElementById('status-toggle');
let isOnline = false;

statusToggleBtn.addEventListener('click', () => {
    isOnline = !isOnline;

    if (isOnline) {
        statusToggleBtn.classList.remove('offline');
        statusToggleBtn.classList.add('online');
        statusToggleBtn.innerText = 'Sẵn sàng nhận cuốc';
        // (Sau này có thể code thêm đoạn lưu trạng thái này vào mock data/LocalStorage để Manager thấy)
    } else {
        statusToggleBtn.classList.remove('online');
        statusToggleBtn.classList.add('offline');
        statusToggleBtn.innerText = 'Đang nghỉ';
    }
});

// Các biến kiểm soát Pop-up
const orderModal = document.getElementById('new-order-modal');
let isModalOpen = false; // Tránh việc bật liên tục nhiều Pop-up
let currentPendingOrder = null;
let ignoredOrders = []; // Danh sách các ID đơn hàng tài xế đã bấm "Bỏ qua"

// 1. Vòng lặp "Radar" quét đơn hàng mỗi 3 giây
setInterval(() => {
    // Chỉ quét khi tài xế đã gạt nút "Sẵn sàng nhận cuốc" VÀ không có Pop-up nào đang mở
    if (!isOnline || isModalOpen) return;

    // Lấy danh sách đơn hàng từ hệ thống
    let orders = JSON.parse(localStorage.getItem('orders')) || [];

    // Tìm đơn hàng hợp lệ: Trạng thái là "Đang chờ" VÀ chưa bị tài xế này bỏ qua
    let pendingOrder = [...orders].reverse().find(o => o.status === 'Đang chờ' && !ignoredOrders.includes(o.orderId));

    if (pendingOrder) {
        showNewOrderModal(pendingOrder);
    }
}, 3000);

// 2. Hàm hiển thị Pop-up
function showNewOrderModal(order) {
    isModalOpen = true;
    currentPendingOrder = order;

    // Đổ dữ liệu vào HTML
    document.getElementById('order-distance').innerText = `Khoảng cách: ${order.distanceKM} km`;

    const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.estimatedPrice);
    document.getElementById('order-price').innerText = `${formattedPrice}`;

    // Hiển thị Pop-up
    orderModal.classList.remove('hidden');

    // Tạo âm thanh bíp bíp nhỏ (Tuỳ chọn)
    console.log("🔔 Đã phát hiện đơn hàng mới:", order.orderId);
}

// 3. Xử lý khi tài xế bấm "Bỏ qua"
document.getElementById('btn-reject').addEventListener('click', () => {
    // Lưu ID đơn này lại để vòng lặp sau không quét trúng nó nữa
    ignoredOrders.push(currentPendingOrder.orderId);

    // Đóng Pop-up và reset trạng thái
    orderModal.classList.add('hidden');
    isModalOpen = false;
    currentPendingOrder = null;
});

// Xử lý nút "Nhận cuốc" (Sẽ triển khai ở Nhiệm vụ 3)
document.getElementById('btn-accept').addEventListener('click', () => {
    alert("Chuẩn bị viết logic nhận đơn!");
});