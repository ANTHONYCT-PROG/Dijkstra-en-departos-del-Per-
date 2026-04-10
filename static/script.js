let map;
let markers = {};
let allEdgesPolylines = [];
let shortestPathPolyline = null;
let graphData = null;

// Colores
const COLOR_BASE_EDGE = "#4f46e5";
const COLOR_PATH_EDGE = "#10b981";

async function initMap() {
    // Coordenadas centrales de Perú
    const peruCenter = { lat: -9.189967, lng: -75.015152 };

    // Inicializar Google Maps
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 5,
        center: peruCenter,
        disableDefaultUI: true, // UI Minimalista
        zoomControl: true,
        // Tema Oscuro para el Mapa
        styles: [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            {
                featureType: "administrative.locality",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }],
            },
            {
                featureType: "water",
                elementType: "geometry",
                stylers: [{ color: "#17263c" }],
            },
            {
                featureType: "water",
                elementType: "labels.text.fill",
                stylers: [{ color: "#515c6d" }],
            },
        ],
    });

    // Obtener datos del Grafo Inicial desde el Servidor Python
    await loadInitialGraph();
}

async function loadInitialGraph() {
    try {
        const response = await fetch('/api/graph_data');
        graphData = await response.json();

        const deps = graphData.departamentos;
        const ady = graphData.adyacencias;

        const startSelect = document.getElementById('start-node');
        const endSelect = document.getElementById('end-node');
        
        startSelect.innerHTML = '<option value="" disabled selected>Selecciona origen</option>';
        endSelect.innerHTML = '<option value="" disabled selected>Selecciona destino</option>';

        // Dibujar Marcadores y Llenar Selects
        for (const [name, coords] of Object.entries(deps)) {
            // Llenar HTML select
            startSelect.innerHTML += `<option value="${name}">${name}</option>`;
            endSelect.innerHTML += `<option value="${name}">${name}</option>`;

            // Crear Marcador en el Mapa
            const marker = new google.maps.Marker({
                position: coords,
                map: map,
                title: name,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 6,
                    fillColor: "#ffffff",
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: COLOR_BASE_EDGE,
                }
            });
            markers[name] = marker;
        }

        // Dibujar Aristas base (las conexiones reales)
        const drawnSet = new Set();
        for (const [node, neighbors] of Object.entries(ady)) {
            for (const neighbor of neighbors) {
                // Prevenir dibujar la misma linea 2 veces (A->B y B->A)
                const edgeKey1 = `${node}-${neighbor}`;
                const edgeKey2 = `${neighbor}-${node}`;

                if (!drawnSet.has(edgeKey1) && !drawnSet.has(edgeKey2)) {
                    drawnSet.add(edgeKey1);

                    const lineCoordinates = [
                        deps[node],
                        deps[neighbor]
                    ];

                    const edgeLine = new google.maps.Polyline({
                        path: lineCoordinates,
                        geodesic: true,
                        strokeColor: COLOR_BASE_EDGE,
                        strokeOpacity: 0.15,
                        strokeWeight: 2,
                    });

                    edgeLine.setMap(map);
                    allEdgesPolylines.push(edgeLine);
                }
            }
        }
    } catch (error) {
        console.error("Error cargando el grafo: ", error);
        alert("Atención: Asegúrate de que el backend de Python esté corriendo (app.py).");
    }
}


document.getElementById('calculate-btn').addEventListener('click', async () => {
    const start = document.getElementById('start-node').value;
    const end = document.getElementById('end-node').value;

    if (!start || !end) {
        alert("Por favor selecciona un origen y un destino.");
        return;
    }

    if (start === end) {
        alert("El origen y el destino deben ser diferentes.");
        return;
    }

    const btnBtn = document.querySelector('#calculate-btn span:first-child');
    const loader = document.getElementById('btn-loader');
    
    // UI Loading state
    btnBtn.textContent = "Calculando...";
    loader.classList.remove('hidden');
    document.getElementById('calculate-btn').disabled = true;

    try {
        const response = await fetch('/api/dijkstra', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ start, end })
        });

        const data = await response.json();
        
        if (data.error) {
            alert(data.error);
        } else {
            drawShortestPath(data.path, data.path_coords);
            updateUIResults(data.distance_km, data.path);
        }

    } catch (error) {
        console.error("Error calculando dijkstra: ", error);
    } finally {
        // UI Reset
        btnBtn.textContent = "Encontrar Ruta Más Corta";
        loader.classList.add('hidden');
        document.getElementById('calculate-btn').disabled = false;
    }
});


function drawShortestPath(pathNames, pathCoords) {
    // Limpiar polilínea anterior si existe
    if (shortestPathPolyline) {
        shortestPathPolyline.setMap(null);
    }

    // Resetear markers al estado normal
    for (const mk in markers) {
        markers[mk].setIcon({
            path: google.maps.SymbolPath.CIRCLE,
            scale: 6,
            fillColor: "#ffffff",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: COLOR_BASE_EDGE,
        });
    }

    // Centrar mapa de manera que se vea la ruta
    const bounds = new google.maps.LatLngBounds();
    pathCoords.forEach(c => bounds.extend(new google.maps.LatLng(c.lat, c.lng)));
    map.fitBounds(bounds);

    // Dibujar nueva ruta brillante
    shortestPathPolyline = new google.maps.Polyline({
        path: pathCoords,
        geodesic: true,
        strokeColor: COLOR_PATH_EDGE, // Color Vibrante (Verde Esmeralda)
        strokeOpacity: 1.0,
        strokeWeight: 6,
    });
    shortestPathPolyline.setMap(map);

    // Animar marcadores en la ruta
    pathNames.forEach((name, idx) => {
        const marker = markers[name];
        marker.setIcon({
            path: google.maps.SymbolPath.CIRCLE,
            scale: idx === 0 || idx === pathNames.length - 1 ? 8 : 6, // Origen y destino más grandes
            fillColor: COLOR_PATH_EDGE,
            fillOpacity: 1,
            strokeWeight: 3,
            strokeColor: "#ffffff",
        });
        
        // Efecto visual: Rebote al origen y destino
        if (idx === 0 || idx === pathNames.length - 1) {
             marker.setAnimation(google.maps.Animation.DROP);
        }
    });
}

function updateUIResults(distance, path) {
    const resultsCard = document.getElementById('results-card');
    const distanceVal = document.getElementById('distance-val');
    const pathStepsContainer = document.getElementById('path-steps');

    resultsCard.classList.remove('hidden');
    
    // Animate Number (Simple)
    distanceVal.textContent = distance;

    // Build Steps HTML
    pathStepsContainer.innerHTML = '';
    
    path.forEach((node, index) => {
        const div = document.createElement('div');
        div.className = index === 0 || index === path.length - 1 ? 'path-step highlight' : 'path-step';
        
        div.innerHTML = `
            <div class="step-dot"></div>
            <div class="step-label">${node}</div>
        `;
        pathStepsContainer.appendChild(div);
    });
}
