from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from collections import defaultdict, deque

#app = Flask(__name__)

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)  # Enable CORS for the Flask app

@app.route('/')
def index():
    return render_template('index.html')

def mst_to_ordered_binary_tree(mst, root):
    tree = defaultdict(list)
    for u, v, _ in mst:
        tree[u].append(v)
        tree[v].append(u)

    binary_tree = {}
    visited = set()
    queue = deque([(root, None)])

    while queue:
        node, parent = queue.popleft()
        if node in visited:
            continue
        visited.add(node)

        children = [n for n in tree[node] if n != parent]
        
        # Binary tree node should have at most two children (left and right)
        binary_tree[node] = {
            "value": node,
            "left": children[0] if len(children) > 0 else None,
            "right": children[1] if len(children) > 1 else None
        }

        if len(children) > 0:
            queue.append((children[0], node))
        if len(children) > 1:
            queue.append((children[1], node))

    return binary_tree


# Function to process the graph and return the MST and binary tree
@app.route('/process', methods=['POST'])
def process():
    data = request.json
    node_names = data['node_names']
    adjacency_matrix = data['adjacency_matrix']
    num_edges = data['num_edges']
    edge_names = data['edge_names']
    incidence_matrix = data['incidence_matrix']
    weights = data['weights']

    # Initialize the graph for Kruskal's algorithm
    class Graph:
        def __init__(self, nodes):
            self.nodes = nodes
            self.edges = []

        def add_edge(self, u, v, w):
            self.edges.append([u, v, w])

        def find(self, parent, i):
            if parent[i] == i:
                return i
            return self.find(parent, parent[i])

        def union(self, parent, rank, x, y):
            xroot = self.find(parent, x)
            yroot = self.find(parent, y)
            if rank[xroot] < rank[yroot]:
                parent[xroot] = yroot
            elif rank[yroot] < rank[xroot]:
                parent[yroot] = xroot
            else:
                parent[yroot] = xroot
                rank[xroot] += 1

        def kruskal_mst(self):
            result = []
            self.edges = sorted(self.edges, key=lambda item: item[2])
            parent, rank = {}, {}
            for node in self.nodes:
                parent[node] = node
                rank[node] = 0
            e = 0
            i = 0
            while e < len(self.nodes) - 1 and i < len(self.edges):
                u, v, w = self.edges[i]
                i += 1
                x = self.find(parent, u)
                y = self.find(parent, v)
                if x != y:
                    e += 1
                    result.append([u, v, w])
                    self.union(parent, rank, x, y)
            return result

    graph = Graph(node_names)

    # Add edges from the incidence matrix
    for i, node in enumerate(node_names):
        for j, val in enumerate(incidence_matrix[i]):
            if val == 1:
                for k in range(len(node_names)):
                    if k != i and incidence_matrix[k][j] == 1:
                        u = node
                        v = node_names[k]
                        weight = weights[edge_names[j]]
                        graph.add_edge(u, v, weight)

    # Run Kruskal's Algorithm
    mst = graph.kruskal_mst()

    # Convert the MST result to a binary tree
    root_node = node_names[0]
    binary_tree = mst_to_ordered_binary_tree(mst, root_node)

    # Prepare the binary tree data for the D3.js visualization
    def format_tree_for_d3(node, tree):
        if node is None:
            return None
        left_child = tree[node]["left"]
        right_child = tree[node]["right"]
        return {
            "value": node,
            "left": format_tree_for_d3(left_child, tree) if left_child else None,
            "right": format_tree_for_d3(right_child, tree) if right_child else None
        }

    d3_tree = format_tree_for_d3(root_node, binary_tree)

    return jsonify({
        'mst': mst,
        'binary_tree': d3_tree,
        'in_order': "Traversal data here"  # Placeholder for the in-order traversal result
    })

if __name__ == '__main__':
    app.run(debug=True)