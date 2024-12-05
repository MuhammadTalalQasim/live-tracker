let map;
let carMarker;

function calculateRoute(map, origin, destination) {
    const directionsService = new google.maps.DirectionsService();

    const request = {
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(destination.lat, destination.lng),
        travelMode: google.maps.TravelMode.DRIVING,
    };

    return new Promise((resolve, reject) => {
        directionsService.route(request, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                resolve(result);
            } else {
                reject(`Directions request failed due to ${status}`);
            }
        });
    });
}

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 20,
        center: { lat: 0, lng: 0 },
    });

    carMarker = new google.maps.Marker({
        map: map,
        icon: {
            url: "https://i.pinimg.com/474x/8d/21/7b/8d217b1000b642005fea7b6fd6c3d967.jpg",
            scaledSize: new google.maps.Size(40, 40),
        },
    });

    document.getElementById("routeForm").addEventListener("submit", function (e) {
        e.preventDefault();

        const startLat = parseFloat(document.getElementById("startLat").value);
        const startLng = parseFloat(document.getElementById("startLng").value);
        const endLat = parseFloat(document.getElementById("endLat").value);
        const endLng = parseFloat(document.getElementById("endLng").value);

        const origin = { lat: startLat, lng: startLng };
        const destination = { lat: endLat, lng: endLng };

        calculateRoute(map, origin, destination).then(
            (result) => {
                const routeLatLngs = result.routes[0].legs[0].steps.flatMap(step =>
                    step.lat_lngs.map(latlng => ({ lat: latlng.lat(), lng: latlng.lng() }))
                );

                moveCar(routeLatLngs);
            },
            (error) => {
                alert(error);
            }
        );
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
