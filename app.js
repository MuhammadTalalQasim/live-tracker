let map;
let carMarker;
let userMarker;

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 15,
        center: { lat: 0, lng: 0 }, // mera Default center
    });

    carMarker = new google.maps.Marker({
        map: map,
        icon: {
            url: "https://i.pinimg.com/474x/8d/21/7b/8d217b1000b642005fea7b6fd6c3d967.jpg",
            scaledSize: new google.maps.Size(40, 40),
        },
    });

    const useCurrentLocationCheckbox = document.getElementById("useCurrentLocation");
    const startAddressInput = document.getElementById("startAddress");

    useCurrentLocationCheckbox.addEventListener("change", (e) => {
        if (e.target.checked) {
            startAddressInput.required = false;
            populateCurrentLocation();
        } else {
            startAddressInput.value = ""; 
            startAddressInput.required = true; 
        }
    });

    document.getElementById("routeForm").addEventListener("submit", async (e) => {
        e.preventDefault();

        const startAddress = startAddressInput.value.trim();
        const endAddress = document.getElementById("endAddress").value.trim();

        if (!startAddress || !endAddress) {
            alert("Both start and end addresses are required.");
            return;
        }

        try {
            const origin = await geocodeAddress(startAddress);
            const destination = await geocodeAddress(endAddress);
            const routeResult = await calculateRoute(map, origin, destination);
            const routeLatLngs = routeResult.routes[0].legs[0].steps.flatMap((step) =>
                step.lat_lngs.map((latlng) => ({ lat: latlng.lat(), lng: latlng.lng() }))
            );
            moveCar(routeLatLngs);
        } catch (error) {
            alert("Error resolving addresses: " + error.message);
        }
    });

    trackCurrentLocation(); // yaha sa real-time location tracking ho gi
}

function populateCurrentLocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const location = { lat: latitude, lng: longitude };

                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ location }, (results, status) => {
                    if (status === "OK" && results[0]) {
                        document.getElementById("startAddress").value = results[0].formatted_address;
                        map.setCenter(location);
                        carMarker.setPosition(location);
                    } else {
                        console.error("Reverse geocoding failed: " + status);
                    }
                });
            },
            (error) => {
                alert("Unable to retrieve your location. " + error.message);
            }
        );
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

function geocodeAddress(address) {
    const geocoder = new google.maps.Geocoder();
    return new Promise((resolve, reject) => {
        geocoder.geocode({ address }, (results, status) => {
            if (status === "OK") {
                resolve(results[0].geometry.location);
            } else {
                reject(new Error("Geocoding failed: " + status));
            }
        });
    });
}

function calculateRoute(map, origin, destination) {
    const directionsService = new google.maps.DirectionsService();
    const request = {
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
    };
    return new Promise((resolve, reject) => {
        directionsService.route(request, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                resolve(result);
            } else {
                reject(new Error("Directions request failed: " + status));
            }
        });
    });
}

function moveCar(positions) {
    let curPosIndex = 0;
    const interval = setInterval(() => {
        carMarker.setPosition(positions[curPosIndex]);
        map.setCenter(positions[curPosIndex]);

        if (curPosIndex === positions.length - 1) {
            clearInterval(interval);
        }

        curPosIndex++;
    }, 300);
}

function trackCurrentLocation() {
    const locationUpdateDiv = document.createElement("div");
    locationUpdateDiv.style.position = "absolute";
    locationUpdateDiv.style.bottom = "20px";
    locationUpdateDiv.style.right = "20px";
    locationUpdateDiv.style.padding = "10px";
    locationUpdateDiv.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    locationUpdateDiv.style.color = "#fff";
    locationUpdateDiv.style.borderRadius = "5px";
    locationUpdateDiv.style.zIndex = "1000";
    locationUpdateDiv.textContent = "Fetching location...";
    document.body.appendChild(locationUpdateDiv);

    if (navigator.geolocation) {
        userMarker = new google.maps.Marker({
            map: map,
            icon: {
                url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                scaledSize: new google.maps.Size(30, 30),
            },
        });

        setInterval(() => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const currentPosition = { lat: latitude, lng: longitude };

                    userMarker.setPosition(currentPosition);
                    map.setCenter(currentPosition);

                    const currentTime = new Date().toLocaleTimeString();
                    locationUpdateDiv.textContent = `Updated at: ${currentTime} (Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)})`;
                },
                (error) => console.error("Error getting location:", error),
                { enableHighAccuracy: true }
            );
        }, 2000);
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}
