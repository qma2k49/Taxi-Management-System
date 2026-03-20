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

// Khởi tạo kết nối tới Backend
const socket = io('http://localhost:3000');

const orderModal = document.getElementById('new-order-modal');
let isModalOpen = false;
let currentPendingOrder = null;
let ignoredOrders = [];

// LẮNG NGHE SỰ KIỆN TỪ SERVER: Khi có khách hàng đặt xe
socket.on('new_ride_request', (order) => {
    // Bỏ qua nếu tài xế đang nghỉ, đang bận Pop-up khác, hoặc đã từng bấm "Bỏ qua" đơn này
    if (!isOnline || isModalOpen || ignoredOrders.includes(order.orderId)) return;

    showNewOrderModal(order);
});

function showNewOrderModal(order) {
    isModalOpen = true;
    currentPendingOrder = order;

    document.getElementById('order-distance').innerText = `Khoảng cách: ${order.distanceKM} km`;
    const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.estimatedPrice);
    document.getElementById('order-price').innerText = `${formattedPrice}`;

    orderModal.classList.remove('hidden');
    console.log("🔔 Đã phát hiện đơn hàng mới từ Server:", order.orderId);
}

// Xử lý nút "Bỏ qua"
document.getElementById('btn-reject').addEventListener('click', () => {
    ignoredOrders.push(currentPendingOrder.orderId);
    orderModal.classList.add('hidden');
    isModalOpen = false;
    currentPendingOrder = null;
});

// Xử lý nút "Nhận cuốc"
document.getElementById('btn-accept').addEventListener('click', () => {
    if (!currentPendingOrder) return;

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    // Đóng gói thông tin xác nhận
    const acceptData = {
        orderId: currentPendingOrder.orderId,
        driverId: currentUser.id,
        driverName: currentUser.fullName
    };

    // BẮN SỰ KIỆN LÊN SERVER: Báo rằng tôi đã nhận đơn này
    socket.emit('driver_accept_ride', acceptData);

    // Cập nhật giao diện tài xế
    orderModal.classList.add('hidden');
    isModalOpen = false;

    statusToggleBtn.innerText = 'Đang phục vụ khách';
    statusToggleBtn.classList.remove('online');
    statusToggleBtn.style.backgroundColor = '#fd7e14';

    alert(`Đã nhận cuốc thành công! Hãy di chuyển đến điểm đón.`);
    currentPendingOrder = null;
});