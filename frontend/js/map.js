let currentOrderId = null; // Lưu ID của đơn vừa đặt
let checkOrderStatusInterval = null; // Lưu vòng lặp kiểm tra

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

// Lưu trữ tạm thời thông tin cuốc xe
let currentDistanceKm = 0;
let currentEstimatedPrice = 0;

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

        // Gọi hàm tính toán
        calculateRouteAndPrice(pickupCoords, dropoffCoords);
    }
});


// Biến lưu trữ lớp vẽ đường đi (để xóa đi vẽ lại khi người dùng chọn điểm khác)
let routeLayer = null;

// Hàm gọi API OSRM để tính khoảng cách và vẽ đường
async function calculateRouteAndPrice(pickup, dropoff) {
    // Chú ý: API OSRM yêu cầu định dạng tọa độ là Kinh độ (lng), Vĩ độ (lat)
    const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}?overview=full&geometries=geojson`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];

            // 1. Tính khoảng cách (OSRM trả về đơn vị mét, cần đổi sang km)
            const distanceKm = parseFloat((route.distance / 1000).toFixed(1));

            // 2. TÍNH TIỀN DỰ KIẾN THEO CƯỚC BẬC THANG
            let price = 0;

            if (distanceKm <= 1) {
                // Mở cửa 1km đầu tiên: 20.000đ (Đi chưa tới 1km vẫn tính 20k)
                price = 20000;
            } else if (distanceKm <= 25) {
                // Từ km thứ 2 đến km 25: 20.000đ + (Số km vượt 1) * 14.000đ
                price = 20000 + ((distanceKm - 1) * 14000);
            } else {
                // Từ km 26 trở đi: 20.000đ (1km đầu) + 336.000đ (24km tiếp theo) + (Số km vượt 25) * 12.000đ
                price = 20000 + (24 * 14000) + ((distanceKm - 25) * 12000);
            }

            // Làm tròn số tiền (nếu có lẻ)
            price = Math.round(price);

            // Gán vào biến toàn cục để chuẩn bị tạo đơn
            currentDistanceKm = distanceKm;
            currentEstimatedPrice = price;

            // Định dạng tiền tệ Việt Nam (VD: 15000 -> 15.000 ₫)
            const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

            // 3. Hiển thị thông tin lên Bảng điều khiển
            document.getElementById('distance-info').innerText = `Khoảng cách: ${distanceKm} km`;
            document.getElementById('price-info').innerText = `Dự kiến: ${formattedPrice}`;

            // 4. Vẽ đường đi trên bản đồ
            // Nếu đã có đường vẽ trước đó thì xóa đi
            if (routeLayer) {
                map.removeLayer(routeLayer);
            }

            // Tạo đường mới từ dữ liệu GeoJSON trả về
            routeLayer = L.geoJSON(route.geometry, {
                style: {
                    color: '#0d6efd', // Màu xanh dương đậm, nổi bật trên nền bản đồ
                    weight: 5,        // Độ dày của đường
                    opacity: 0.8
                }
            }).addTo(map);

            // 5. Tự động thu phóng bản đồ để hiển thị trọn vẹn cả chuyến đi
            map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });

        } else {
            alert("Không tìm thấy tuyến đường hợp lệ giữa 2 điểm này!");
        }
    } catch (error) {
        console.error("Lỗi khi kết nối với OSRM API:", error);
        alert("Có lỗi xảy ra khi tính toán quãng đường. Vui lòng thử lại!");
    }
}

// Xử lý sự kiện khi Khách hàng bấm "Đặt xe ngay"
// Khởi tạo kết nối tới Backend (đảm bảo server Node.js của bạn đang chạy ở cổng 3000)
const socket = io('http://localhost:3000');

currentOrderId = null; // Lưu ID của đơn vừa đặt để theo dõi

// Xử lý sự kiện khi Khách hàng bấm "Đặt xe ngay"
const bookBtn = document.getElementById('book-btn');

if (bookBtn) {
    bookBtn.addEventListener('click', function () {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));

        if (!currentUser || currentUser.roleId !== 4) {
            alert("Vui lòng đăng nhập lại với tư cách Khách hàng!");
            return;
        }

        const newOrder = {
            orderId: "ORD" + new Date().getTime(),
            customerId: currentUser.id,
            customerName: currentUser.fullName,
            pickupLat: pickupCoords.lat,
            pickupLng: pickupCoords.lng,
            dropoffLat: dropoffCoords.lat,
            dropoffLng: dropoffCoords.lng,
            distanceKM: currentDistanceKm,
            estimatedPrice: currentEstimatedPrice,
            status: 'Đang chờ'
        };

        currentOrderId = newOrder.orderId;

        // BẮN SỰ KIỆN LÊN SERVER THAY VÌ LƯU LOCALSTORAGE
        socket.emit('customer_book_ride', newOrder);

        // Cập nhật giao diện (Khóa nút)
        bookBtn.innerText = 'Đang tìm tài xế gần nhất...';
        bookBtn.disabled = true;
        bookBtn.style.backgroundColor = '#6c757d';
        currentSelectionStep = 3;

        console.log("Đã gửi đơn hàng lên Server:", newOrder);
    });
}

// LẮNG NGHE SỰ KIỆN TỪ SERVER: Khi có tài xế nhận cuốc
socket.on('ride_accepted_success', (acceptData) => {
    // Chỉ xử lý nếu đúng là đơn của mình vừa đặt
    if (acceptData.orderId === currentOrderId) {
        bookBtn.innerText = `🚕 Tài xế ${acceptData.driverName} đang tới đón bạn!`;
        bookBtn.style.backgroundColor = '#198754';
        bookBtn.style.color = '#ffffff';

        alert(`Tin vui! Tài xế ${acceptData.driverName} đã nhận cuốc xe của bạn!`);
    }
});