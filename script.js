// DOM Elements
const locationInput = document.getElementById('locationInput');
const searchBtn = document.getElementById('searchBtn');
const distanceValue = document.getElementById('distanceValue');
const myLocationText = document.getElementById('myLocationText');
const targetLocationText = document.getElementById('targetLocationText');
const errorMessage = document.getElementById('errorMessage');

// Apps State
let map;
let userMarker = null;
let targetMarker = null;
let routeLine = null;
let userPosition = null;

// Initialize Map
function initMap() {
    // Default view (0,0) zoom 2 usually, but we'll wait for user location
    map = L.map('map').setView([0, 0], 2);

    // Dark Mode Tiles (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);
}

// Get User Location
function getUserLocation() {
    if (!navigator.geolocation) {
        showError("Geolocation is not supported by your browser.");
        myLocationText.textContent = "Not Supported";
        return;
    }

    myLocationText.textContent = "Locating...";

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            userPosition = { lat: latitude, lng: longitude };

            // Update UI
            myLocationText.textContent = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

            // Update Map
            if (userMarker) map.removeLayer(userMarker);

            // Custom Icon for User
            const userIcon = L.divIcon({
                className: 'user-marker-icon',
                html: `<div style="background-color: #6366f1; width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.3);"></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });

            userMarker = L.marker([latitude, longitude], { icon: userIcon })
                .addTo(map)
                .bindPopup("You are here")
                .openPopup();

            map.setView([latitude, longitude], 13);
        },
        (error) => {
            console.error(error);
            showError("Unable to retrieve your location.");
            myLocationText.textContent = "Unavailable";
        },
        { enableHighAccuracy: true }
    );
}

// Search Location (Geocoding)
async function searchLocation() {
    const query = locationInput.value.trim();
    if (!query) return;

    // Clear previous errors
    errorMessage.textContent = "";

    try {
        searchBtn.disabled = true;
        searchBtn.style.opacity = "0.7";

        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);

        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();

        if (data && data.length > 0) {
            const result = data[0];
            const targetLat = parseFloat(result.lat);
            const targetLng = parseFloat(result.lon);
            const displayName = result.display_name.split(',')[0]; // First part of address

            // Update UI
            targetLocationText.textContent = displayName;

            // Handle Target Marker
            if (targetMarker) map.removeLayer(targetMarker);

            const targetIcon = L.divIcon({
                className: 'target-marker-icon',
                html: `<div style="background-color: #ec4899; width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 0 4px rgba(236, 72, 153, 0.3);"></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });

            targetMarker = L.marker([targetLat, targetLng], { icon: targetIcon })
                .addTo(map)
                .bindPopup(result.display_name);

            // Calculate Distance
            if (userPosition) {
                calculateAndShowDistance(targetLat, targetLng);
            } else {
                map.setView([targetLat, targetLng], 13);
                showError("User location not found. Cannot calculate distance.");
            }

        } else {
            showError("Location not found. Please try again.");
        }

    } catch (error) {
        console.error(error);
        showError("An error occurred while searching.");
    } finally {
        searchBtn.disabled = false;
        searchBtn.style.opacity = "1";
    }
}

// Calculate Distance and Draw Line
function calculateAndShowDistance(targetLat, targetLng) {
    const userLatLng = L.latLng(userPosition.lat, userPosition.lng);
    const targetLatLng = L.latLng(targetLat, targetLng);

    // Distance in meters
    const distanceMeters = userLatLng.distanceTo(targetLatLng);
    const distanceKm = (distanceMeters / 1000).toFixed(2);

    // Update Value with animation
    animateValue(distanceValue, parseFloat(distanceValue.innerText), parseFloat(distanceKm), 1000);

    // Draw Line
    if (routeLine) map.removeLayer(routeLine);

    routeLine = L.polyline([userLatLng, targetLatLng], {
        color: '#a855f7',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10',
        lineCap: 'round'
    }).addTo(map);

    // Fit Bounds
    map.fitBounds(L.latLngBounds(userLatLng, targetLatLng), { padding: [50, 50] });
}

// Error Helper
function showError(msg) {
    errorMessage.textContent = msg;
    setTimeout(() => {
        errorMessage.textContent = "";
    }, 5000);
}



// UI Animation Helper
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = (progress * (end - start) + start).toFixed(2);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Event Listeners
searchBtn.addEventListener('click', searchLocation);
locationInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchLocation();
});

// Start
initMap();
getUserLocation();
