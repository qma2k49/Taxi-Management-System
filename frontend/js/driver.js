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