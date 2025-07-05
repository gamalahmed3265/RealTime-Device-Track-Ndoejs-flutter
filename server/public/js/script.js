const socket = io();
const map = L.map("map").setView([0, 0], 2);
const markers = {};

// Initialize map
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

// Geolocation handling
let watchId = null;

if (navigator.geolocation) {
  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;

      socket.emit("send-location", { latitude, longitude }, (response) => {
        if (response.status !== "success") {
          console.error("Failed to send location:", response.message);
        }
      });
    },
    (error) => {
      console.error("Geolocation error:", error.message);
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0, // لا نستخدم المواقع المخزنة
    }
  );
}

// Clean up on disconnect
socket.on("disconnect", () => {
  if (watchId && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
});

// Handle received locations
socket.on("receive-location", (data) => {
  const { id, latitude, longitude } = data;

  if (!latitude || !longitude) return;

  if (markers[id]) {
    markers[id].setLatLng([latitude, longitude]);
  } else {
    markers[id] = L.marker([latitude, longitude]).addTo(map);
  }

  // تحديث مركز الخريطة للموقع الجديد
  map.setView([latitude, longitude], 16);
});

// Handle user disconnection
socket.on("user-disconnect", (id) => {
  if (markers[id]) {
    map.removeLayer(markers[id]);
    delete markers[id];
  }
});
