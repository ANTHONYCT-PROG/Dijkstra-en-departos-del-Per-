from flask import Flask, render_template, request, jsonify
from grafo_peru import DEPARTAMENTOS, ADYACENCIAS
from dijkstra import dijkstra_shortest_path, build_graph

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/graph_data', methods=['GET'])
def get_graph_data():

    return jsonify({
        "departamentos": DEPARTAMENTOS,
        "adyacencias": ADYACENCIAS
    })

@app.route('/api/dijkstra', methods=['POST'])
def calculate_dijkstra():

    data = request.get_json()
    start = data.get("start")
    end = data.get("end")

    if not start or not end:
        return jsonify({"error": "Falta origen o destino"}), 400

    if start not in DEPARTAMENTOS or end not in DEPARTAMENTOS:
        return jsonify({"error": "Departamento inválido"}), 400

    
    min_dist, path_nodes = dijkstra_shortest_path(start, end)

    
    path_coords = []
    for node in path_nodes:
        path_coords.append({
            "name": node,
            "lat": DEPARTAMENTOS[node]["lat"],
            "lng": DEPARTAMENTOS[node]["lng"]
        })

    return jsonify({
        "distance_km": round(min_dist, 2),
        "path": path_nodes,
        "path_coords": path_coords
    })

if __name__ == '__main__':

    app.run(debug=True, port=5000)
