// 1. Khởi tạo bản đồ và gắn vào thẻ div có id="map"
// Tọa độ [21.028511, 105.804817] là khu vực Hà Nội. Mức zoom 13 là độ thu phóng vừa phải.
const map = L.map('map').setView([21.028511, 105.804817], 13);

// 2. Kéo lớp bản đồ (Tile Layer) từ OpenStreetMap về hiển thị
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

// In log ra console để xác nhận bản đồ đã load thành công
console.log("Bản đồ OpenStreetMap đã được khởi tạo thành công!");

// Khai báo icon màu xanh (Điểm đón) và màu đỏ (Điểm trả) từ thư viện bên ngoài
const greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Các biến lưu trữ tọa độ và marker
let pickupMarker = null;
let dropoffMarker = null;
let pickupCoords = null;
let dropoffCoords = null;

// Biến kiểm soát trạng thái: 1 = Đang chọn điểm đón, 2 = Đang chọn điểm trả
let currentSelectionStep = 1;

// Lắng nghe sự kiện click trên bản đồ
map.on('click', function (e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    if (currentSelectionStep === 1) {
        // Xóa marker cũ nếu có
        if (pickupMarker) map.removeLayer(pickupMarker);

        // Tạo marker Xanh
        pickupMarker = L.marker([lat, lng], { icon: greenIcon }).addTo(map)
            .bindPopup('<b>Điểm đón</b>').openPopup();

        pickupCoords = { lat, lng };

        // Hiển thị tọa độ lên ô input
        document.getElementById('pickup-input').value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

        // Chuyển sang bước chọn điểm đến
        currentSelectionStep = 2;

    } else if (currentSelectionStep === 2) {
        // Xóa marker cũ nếu có
        if (dropoffMarker) map.removeLayer(dropoffMarker);

        // Tạo marker Đỏ
        dropoffMarker = L.marker([lat, lng], { icon: redIcon }).addTo(map)
            .bindPopup('<b>Điểm đến</b>').openPopup();

        dropoffCoords = { lat, lng };

        // Hiển thị tọa độ lên ô input
        document.getElementById('dropoff-input').value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

        // Reset về bước 1 để người dùng có thể click chọn lại từ đầu nếu nhầm
        currentSelectionStep = 1;

        // Mở khóa nút Đặt xe khi đã có đủ 2 tọa độ
        document.getElementById('book-btn').disabled = false;

        // (Sắp tới ở Nhiệm vụ 3 sẽ gọi hàm tính khoảng cách ở đây)
        console.log("Đã lấy được tọa độ đi/đến, chuẩn bị tính khoảng cách...");
    }
});