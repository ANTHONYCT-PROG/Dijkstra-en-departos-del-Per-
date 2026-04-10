import math
import heapq
from grafo_peru import DEPARTAMENTOS, ADYACENCIAS

def haversine_distance(lat1, lon1, lat2, lon2):

    R = 6371.0  

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

    graph = build_graph()

    
    pq = [(0, start)]

    
    min_dist = {node: float('inf') for node in graph}
    min_dist[start] = 0

    
    previous = {node: None for node in graph}

    while pq:
        current_dist, current_node = heapq.heappop(pq)

        
        if current_node == end:
            break

        
        if current_dist > min_dist[current_node]:
            continue

        
        for neighbor, weight in graph[current_node].items():
            distance = current_dist + weight

            
            if distance < min_dist[neighbor]:
                min_dist[neighbor] = distance
                previous[neighbor] = current_node
                heapq.heappush(pq, (distance, neighbor))

    
    path = []
    curr = end

    
    if previous[end] is None and start != end:
        return float('inf'), []

    while curr is not None:
        path.append(curr)
        curr = previous[curr]

    path.reverse()

    return min_dist[end], path
