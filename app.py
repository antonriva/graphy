# app.py
from flask import Flask, request, jsonify, render_template
import json
from collections import defaultdict, deque

app = Flask(__name__)

def index():
    return render_template('index.html')
"""
def get_adjacency_matrix():
    num_nodes = int(input("Enter the number of nodes: "))
    node_names = input("Enter the names of the nodes (separated by spaces): ").split()

    adjacency_matrix = []
    print("Enter the adjacency matrix row by row:")
    for _ in range(num_nodes):
        row = list(map(int, input().split()))
        adjacency_matrix.append(row)

    return node_names, adjacency_matrix

def get_incidence_matrix(node_names):
    num_edges = int(input("Enter the number of edges: "))
    edge_names = input("Enter the names of the edges (separated by spaces): ").split()

    incidence_matrix = []
    print("Enter the incidence matrix row by row:")
    for _ in range(len(node_names)):
        row = list(map(int, input().split()))
        incidence_matrix.append(row)

    return edge_names, incidence_matrix

def get_weights(edge_names):
    weights = {}
    print("Enter the weights for each edge:")
    for edge in edge_names:
        weight = float(input(f"Weight for edge {edge}: "))
        weights[edge] = weight
    return weights

# Collect data
node_names, adjacency_matrix = get_adjacency_matrix()
edge_names, incidence_matrix = get_incidence_matrix(node_names)
weights = get_weights(edge_names)

# Map node names to indices
node_indices = {name: idx for idx, name in enumerate(node_names)}
idx_to_name = {idx: name for name, idx in node_indices.items()}
"""

# Implement Kruskal's Algorithm
class Graph:
    def __init__(self, nodes):
        self.nodes = nodes
        self.edges = []

    # Function to add an edge
    def add_edge(self, u, v, w):
        self.edges.append([u, v, w])

    # Find function for union-find
    def find(self, parent, i):
        if parent[i] == i:
            return i
        return self.find(parent, parent[i])

    # Union function for union-find
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

    # Kruskal's algorithm
    def kruskal_mst(self):
        result = []
        i = 0
        e = 0

        # Sort edges based on weight
        self.edges = sorted(self.edges, key=lambda item: item[2])

        parent = {}
        rank = {}

        for node in self.nodes:
            parent[node] = node
            rank[node] = 0

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

# Create graph
graph = Graph(node_names)

# Add edges from the incidence matrix
for i, node in enumerate(node_names):
    for j, val in enumerate(incidence_matrix[i]):
        if val == 1:
            # Find the other node connected by this edge
            for k in range(len(node_names)):
                if k != i and incidence_matrix[k][j] == 1:
                    u = node
                    v = node_names[k]
                    edge_name = edge_names[j]
                    weight = weights[edge_name]
                    graph.add_edge(u, v, weight)

# Remove duplicate edges
graph.edges = [list(t) for t in {tuple(sorted([u, v]) + [w]) for u, v, w in graph.edges}]

# Run Kruskal's Algorithm
mst = graph.kruskal_mst()
print("Edges in the MST:")
for u, v, w in mst:
    print(f"{u} -- {v} == {w}")
# Convert MST to Binary Tree
from collections import defaultdict, deque

# Modified function to construct binary tree with value-based ordering (numbers or letters)
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
        
        # Separate children based on whether they are smaller or larger than the node
        children = sorted([n for n in tree[node] if n != parent], key=lambda x: x)

        binary_tree[node] = [None, None]  # Initialize left and right as None
        
        if len(children) > 0:
            # The smaller value goes to the left
            binary_tree[node][0] = children[0]  # Left child
            queue.append((children[0], node))  # Add to queue for processing
            
        if len(children) > 1:
            # The larger value goes to the right
            binary_tree[node][1] = children[1]  # Right child
            queue.append((children[1], node))  # Add to queue for processing

    return binary_tree

# Choose a root node arbitrarily
root_node = node_names[0]
binary_tree = mst_to_ordered_binary_tree(mst, root_node)

# Print the entire binary tree result with left and right children
print("Ordered Binary Tree Structure (smaller values on the left, larger values on the right):")
for node, children in binary_tree.items():
    print(f"Node: {node}, Left: {children[0]}, Right: {children[1]}")

# Prepare data for D3.js
#def tree_to_json(node, tree, visited=None):
#    if visited is None:
#        visited = set()
#    visited.add(node)
#    children = []
#    for child in tree.get(node, []):
#        if child not in visited:
#            children.append(tree_to_json(child, tree, visited))
#    return {"name": node, "children": children}

#tree_data = tree_to_json(root_node, binary_tree)

# Perform In-Order Traversal
def in_order_traversal(node, tree, visited=None, result=None):
    if visited is None:
        visited = set()
    if result is None:
        result = []

    if node is None:
        return result

    # Traverse the left subtree
    left_child = tree.get(node, [None, None])[0]
    if left_child:
        in_order_traversal(left_child, tree, visited, result)

    # Visit the node
    result.append(node)

    # Traverse the right subtree
    right_child = tree.get(node, [None, None])[1]
    if right_child:
        in_order_traversal(right_child, tree, visited, result)

    return result

in_order = in_order_traversal(root_node, binary_tree)
print("In-Order Traversal:")
print(in_order)

# Define Flask routes
#@app.route('/')
#def index():
#    return render_template('index.html', tree_data=json.dumps(tree_data), in_order=in_order)

#if __name__ == '__main__':
#    app.run(debug=True)
