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
    
    # Build the adjacency list from the MST
    for u, v, _ in mst:
        tree[u].append(v)
        tree[v].append(u)

    binary_tree = {}
    visited = set()

    # Define a helper function to recursively place nodes in the binary tree
    def insert_into_binary_tree(parent_node, current_node):
        if current_node in visited:
            return
        
        visited.add(current_node)
        
        # Initialize the current node in the binary tree if not present
        if current_node not in binary_tree:
            binary_tree[current_node] = {"value": current_node, "left": None, "right": None}
        
        # Compare values and insert them in the correct position
        if parent_node is not None:
            if current_node < parent_node["value"]:
                if parent_node["left"] is None:
                    parent_node["left"] = binary_tree[current_node]
                else:
                    insert_into_binary_tree(parent_node["left"], current_node)
            else:
                if parent_node["right"] is None:
                    parent_node["right"] = binary_tree[current_node]
                else:
                    insert_into_binary_tree(parent_node["right"], current_node)

    # Start the tree with the root node and add all children
    queue = deque([root])
    binary_tree[root] = {"value": root, "left": None, "right": None}
    while queue:
        node = queue.popleft()

        for child in tree[node]:
            if child not in visited:
                insert_into_binary_tree(binary_tree[node], child)
                queue.append(child)

    return binary_tree

def array_to_string(array):
    # Initialize an empty string
    result_string = ""
    
    # Iterate over the array and append each value to the result_string
    for element in array:
        result_string += str(element) + " "
    
    # Return the final string with the trailing space removed
    return result_string.strip()



def in_order_traversal(node_value, binary_tree, result=None):
    if result is None:
        result = []

    # Check if the node exists in the tree
    if node_value is None or node_value not in binary_tree:
        return result

    # Get the current node from the binary tree
    node = binary_tree[node_value]

    # Recursively traverse the left subtree
    left_child = node.get("left")
    if left_child:
        in_order_traversal(left_child, binary_tree, result)

    # Visit the current node and append its value
    result.append(node["value"])

    # Recursively traverse the right subtree
    right_child = node.get("right")
    if right_child:
        in_order_traversal(right_child, binary_tree, result)

    return result


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
    print(node_names[0])
    #binary_tree = mst_to_ordered_binary_tree(mst, root_node)
    #in_order_matrix=in_order_traversal(root_node, binary_tree)
    #in_order=array_to_string(in_order_matrix)


    # Prepare the binary tree data for the D3.js visualization
    #def format_tree_for_d3(node, tree):
        #if node is None:
        #    return None
        #left_child = tree[node]["left"]
        #right_child = tree[node]["right"]
        #return {
        #    "value": node,
       #     "left": format_tree_for_d3(left_child, tree) if left_child else None,
      #      "right": format_tree_for_d3(right_child, tree) if right_child else None
     #   }

    #d3_tree = format_tree_for_d3(root_node, binary_tree)

    return jsonify({
        'root_node': node_names[0],
        'mst': mst,
        #'binary_tree': d3_tree,
        #'in_order': in_order # Placeholder for the in-order traversal result
    })

if __name__ == '__main__':
    app.run(debug=True)