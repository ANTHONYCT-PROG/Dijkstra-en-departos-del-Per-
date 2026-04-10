import math
import heapq
from grafo_peru import DEPARTAMENTOS, ADYACENCIAS

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calcula la distancia geodésica entre dos puntos en la tierra usando sus latitudes y longitudes
    (Fórmula de Haversine). Retorna distancia en Kilómetros.
    """
    R = 6371.0  # Radio de la Tierra en km

    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)

    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad

    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    distance = R * c
    return distance

def build_graph():
    """
    Construye el grafo donde cada arista tiene como peso la distancia en KM (Haversine).
    """
    graph = {}
    for node in DEPARTAMENTOS:
        graph[node] = {}
        for neighbor in ADYACENCIAS[node]:
            dist = haversine_distance(
                DEPARTAMENTOS[node]['lat'], DEPARTAMENTOS[node]['lng'],
                DEPARTAMENTOS[neighbor]['lat'], DEPARTAMENTOS[neighbor]['lng']
            )
            graph[node][neighbor] = dist
    return graph

def dijkstra_shortest_path(start, end):
    """
    Toma un departamento de inicio (start) y uno de destino (end),
    retorna (distancia_minima_total, [ruta_ordenada_por_nodos]).
    """
    graph = build_graph()
    
    # Cola de prioridad que guarda tuplas (distancia_acumulada, nodo_actual)
    pq = [(0, start)]
    
    # Diccionario para rastrear la mínima distancia conocida hacia un nodo
    min_dist = {node: float('inf') for node in graph}
    min_dist[start] = 0
    
    # Diccionario para reconstruir el camino ("de dónde vine para llegar acá rápido")
    previous = {node: None for node in graph}
    
    while pq:
        current_dist, current_node = heapq.heappop(pq)
        
        # Si llegamos al destino, no es necesario seguir explorando desde aquí.
        if current_node == end:
            break
            
        # Si extraemos una ruta que ya sabemos que es peor de la que encontramos, la saltamos
        if current_dist > min_dist[current_node]:
            continue
            
        # Explorar vecinos
        for neighbor, weight in graph[current_node].items():
            distance = current_dist + weight
            
            # Si encontramos un camino más corto hacia un vecino...
            if distance < min_dist[neighbor]:
                min_dist[neighbor] = distance
                previous[neighbor] = current_node
                heapq.heappush(pq, (distance, neighbor))
                
    # Reconstruir camino y retornar formátos legibles
    path = []
    curr = end
    
    # Validar si no pudimos llegar (ej. partes de grafo desconectadas). En Perú todo conecta.
    if previous[end] is None and start != end:
        return float('inf'), []
        
    while curr is not None:
        path.append(curr)
        curr = previous[curr]
        
    path.reverse()
    
    return min_dist[end], path
