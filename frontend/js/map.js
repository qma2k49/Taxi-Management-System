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
            // Lấy khoảng cách KM
            const distanceKm = (data.routes[0].distance / 1000).toFixed(1);

            // GỌI HÀM TÍNH TIỀN LŨY TIẾN VỪA TẠO
            const fareResult = calculateTaxiFare(distanceKm);

            // Lưu vào biến toàn cục để chuẩn bị gửi lên Server khi bấm "Đặt xe"
            currentDistanceKm = distanceKm;
            currentEstimatedPrice = fareResult.total;

            // Định dạng tiền tệ Việt Nam
            const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(fareResult.total);

            // Tạo câu thông báo giá tiền (Kiểm tra xem có bị phụ thu đêm không)
            let priceMessage = `Khoảng cách: ${distanceKm} km<br>Giá cước dự kiến: <strong>${formattedPrice}</strong>`;
            if (fareResult.isNight) {
                priceMessage += `<br><span style="color: #dc3545; font-size: 12px;">(Đã bao gồm 20% phụ thu ban đêm)</span>`;
            }

            // Hiển thị lên màn hình (Popup ở giữa đường đi)
            const midPoint = Math.floor(routeCoordinates.length / 2);
            L.popup()
                .setLatLng([routeCoordinates[midPoint][0], routeCoordinates[midPoint][1]])
                .setContent(priceMessage)
                .openOn(map);

            // Bật sáng nút Đặt xe
            const bookBtn = document.getElementById('book-btn');
            if (bookBtn) {
                bookBtn.disabled = false;
                bookBtn.style.backgroundColor = '#0d6efd';
                bookBtn.innerText = 'Đặt xe ngay';
            }
        }
        else {
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

// === TÍNH NĂNG TÌM KIẾM ĐỊA ĐIỂM (GEOCODING) ===

const pickupInput = document.getElementById('pickup-input');
const dropoffInput = document.getElementById('dropoff-input');
const pickupSuggestions = document.getElementById('pickup-suggestions');
const dropoffSuggestions = document.getElementById('dropoff-suggestions');

let searchTimeout; // Biến lưu trữ thời gian chờ (Debounce)

// 1. Hàm Debounce: Lắng nghe sự kiện gõ phím
function handleInput(e, suggestionsList, type) {
    const query = e.target.value.trim();

    clearTimeout(searchTimeout); // Hủy lệnh gọi cũ nếu người dùng đang gõ liên tục

    if (!query) {
        suggestionsList.classList.add('hidden');
        return;
    }

    // Đợi người dùng ngừng gõ 500ms thì mới gọi API
    searchTimeout = setTimeout(() => {
        fetchLocations(query, suggestionsList, type);
    }, 500);
}

// 2. Hàm Gọi API Nominatim
async function fetchLocations(query, suggestionsList, type) {
    try {
        // Gọi API của OpenStreetMap, giới hạn kết quả ở Việt Nam (countrycodes=vn)
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=vn&limit=5`);
        const data = await response.json();

        suggestionsList.innerHTML = ''; // Xóa các kết quả gợi ý cũ

        if (data.length === 0) {
            suggestionsList.innerHTML = '<li style="color: red;">Không tìm thấy địa điểm.</li>';
            suggestionsList.classList.remove('hidden');
            return;
        }

        // 3. Đổ dữ liệu ra danh sách <li>
        data.forEach(place => {
            const li = document.createElement('li');
            li.innerText = place.display_name; // Tên địa chỉ đầy đủ

            // Xử lý sự kiện khi khách hàng bấm chọn 1 gợi ý
            li.addEventListener('click', () => {
                selectLocation(place, type, suggestionsList);
            });

            suggestionsList.appendChild(li);
        });

        suggestionsList.classList.remove('hidden'); // Hiện danh sách lên
    } catch (error) {
        console.error('Lỗi gọi API tìm kiếm:', error);
    }
}

// Gắn sự kiện gõ phím (input) cho 2 ô tìm kiếm
pickupInput.addEventListener('input', (e) => handleInput(e, pickupSuggestions, 'pickup'));
dropoffInput.addEventListener('input', (e) => handleInput(e, dropoffSuggestions, 'dropoff'));

// 4. Hàm xử lý khi khách chọn một địa chỉ từ danh sách
function selectLocation(place, type, suggestionsList) {
    // Chuyển đổi tọa độ từ chuỗi (string) sang số thập phân (float)
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);

    if (type === 'pickup') {
        // Cập nhật ô input
        pickupInput.value = place.display_name;

        // Lưu vào biến tọa độ hệ thống (biến toàn cục đã khai báo từ Tuần 2)
        pickupCoords = { lat: lat, lng: lng };

        // Hiệu ứng "bay" bản đồ đến điểm đón với mức zoom 16
        map.flyTo([lat, lng], 16, { duration: 1.5 });

        // Vẽ cờ Xanh (Điểm đón)
        if (pickupMarker) map.removeLayer(pickupMarker); // Xóa cờ cũ nếu có
        pickupMarker = L.marker([lat, lng], { icon: pickupIcon }).addTo(map)
            .bindPopup("<b>📍 Điểm đón:</b><br>" + place.display_name).openPopup();

        // Đổi trạng thái để hệ thống biết tiếp theo cần chọn điểm trả
        if (currentSelectionStep === 1) currentSelectionStep = 2;

    } else { // type === 'dropoff'
        // Cập nhật ô input
        dropoffInput.value = place.display_name;

        // Lưu vào biến tọa độ hệ thống
        dropoffCoords = { lat: lat, lng: lng };

        // Hiệu ứng "bay" bản đồ đến điểm trả
        map.flyTo([lat, lng], 16, { duration: 1.5 });

        // Vẽ cờ Đỏ (Điểm đến)
        if (dropoffMarker) map.removeLayer(dropoffMarker);
        dropoffMarker = L.marker([lat, lng], { icon: dropoffIcon }).addTo(map)
            .bindPopup("<b>🚩 Điểm đến:</b><br>" + place.display_name).openPopup();
    }

    // Giấu danh sách gợi ý đi sau khi chọn xong
    suggestionsList.classList.add('hidden');

    console.log(`Đã ghim cờ ${type} tại: ${lat}, ${lng}`);

    // === ĐIỂM SÁNG GIÁ NHẤT: KÍCH HOẠT TÍNH TIỀN ===
    // Nếu hệ thống phát hiện đã có đủ cả điểm đón và điểm trả, lập tức vẽ đường và tính giá!
    if (pickupCoords && dropoffCoords) {
        // Hàm này chúng ta đã viết sẵn từ Tuần 2
        calculateRouteAndPrice(pickupCoords, dropoffCoords);
    }
}

// 5. Tính năng phụ: Bấm ra ngoài vùng tìm kiếm thì tự động giấu danh sách
document.addEventListener('click', (e) => {
    if (!e.target.closest('.autocomplete-container')) {
        pickupSuggestions.classList.add('hidden');
        dropoffSuggestions.classList.add('hidden');
    }
});

// Hàm tính cước taxi chuẩn thực tế
function calculateTaxiFare(distanceKm) {
    let price = 0;

    // 1. Giá mở cửa (2km đầu tiên)
    if (distanceKm <= 2) {
        price = 20000;
    } else {
        price = 20000; // Tiền cố định cho 2km đầu

        // 2. Lũy tiến từ km thứ 2 đến km 20
        if (distanceKm <= 20) {
            price += (distanceKm - 2) * 13000;
        }
        // 3. Lũy tiến từ km 21 trở đi
        else {
            price += (18 * 13000); // Trả cho đoạn từ km 2 đến km 20
            price += (distanceKm - 20) * 11000; // Trả cho đoạn từ km 21 trở đi
        }
    }

    // 4. Phụ thu ban đêm (22h00 - 05h59 sáng)
    const currentHour = new Date().getHours();
    let isNightSurcharge = false;

    if (currentHour >= 22 || currentHour < 5) {
        price = price * 1.2; // Tăng 20%
        isNightSurcharge = true;
    }

    return {
        total: Math.round(price), // Làm tròn số tiền để không bị lẻ đồng
        isNight: isNightSurcharge
    };
}