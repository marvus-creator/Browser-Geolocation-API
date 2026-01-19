function getHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

async function calculateDistance() {
    const city = document.getElementById('cityInput').value;
    const resultArea = document.getElementById('resultArea');
    const loader = document.getElementById('loader');

    if (!city) {
        alert("Please enter a destination!");
        return;
    }

    loader.classList.remove('hidden');
    resultArea.innerHTML = "";

    navigator.geolocation.getCurrentPosition(async (position) => {
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`);
            const data = await response.json();

            if (data.length === 0) {
                resultArea.innerHTML = "❌ Could not find that place.";
            } else {
                const targetLat = parseFloat(data[0].lat);
                const targetLon = parseFloat(data[0].lon);
                const targetName = data[0].display_name;

                const distance = getHaversineDistance(userLat, userLon, targetLat, targetLon);

                resultArea.innerHTML = `
                    <p><strong>From:</strong> Your Location</p>
                    <p><strong>To:</strong> ${targetName}</p>
                    <div class="distance-val">${distance.toFixed(2)} km</div>
                    <p>(${ (distance * 0.621371).toFixed(2) } miles)</p>
                `;
            }
        } catch (error) {
            resultArea.innerHTML = "❌ Error connecting to the search service.";
        }
        loader.classList.add('hidden');

    }, (err) => {
        loader.classList.add('hidden');
        resultArea.innerHTML = "❌ Please enable location access in your browser.";
    });
}
