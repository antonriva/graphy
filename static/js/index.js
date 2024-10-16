// Function to draw the binary tree using D3.js
function drawBinaryTree(root) {
    // Clear any existing SVG elements
    d3.select("#tree").select("svg").remove();

    var margin = { top: 40, right: 120, bottom: 20, left: 120 },
        width = 960 - margin.right - margin.left,
        height = 600 - margin.top - margin.bottom;

    var i = 0;

    // Create a tree layout with specified size
    var tree = d3.layout.tree()
        .size([width, height]);

    // Define the diagonal projection for the links (vertical layout)
    var diagonal = d3.svg.diagonal()
        .projection(function (d) { return [d.x, d.y]; });

    // Create the SVG container and set up zooming and panning
    var svg = d3.select("#tree").append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
        .call(d3.behavior.zoom().scaleExtent([0.5, 2]).on("zoom", zoom))
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    function zoom() {
        svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    // Compute the new tree layout
    var nodes = tree.nodes(root),
        links = tree.links(nodes);

    // Normalize for fixed-depth (vertical spacing between nodes)
    nodes.forEach(function (d) { d.y = d.depth * 100; });

    // Declare the nodes
    var node = svg.selectAll("g.node")
        .data(nodes, function (d) { return d.id || (d.id = ++i); });

    // Enter the nodes
    var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        // Position the nodes based on their x and y attributes
        .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });

    // Add circles for the nodes
    nodeEnter.append("circle")
        .attr("r", 20)
        .style("fill", "#fff")
        .style("stroke", "steelblue")
        .style("stroke-width", "3px");

    // Add labels inside the circles
    nodeEnter.append("text")
        .attr("dy", ".35em") // Center vertically
        .attr("text-anchor", "middle") // Center horizontally
        .text(function (d) { return d.name; })
        .style("font-size", "12px");

    // Declare the links
    var link = svg.selectAll("path.link")
        .data(links, function (d) { return d.target.id; });

    // Enter the links
    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", diagonal)
        .style("fill", "none")
        .style("stroke", "#ccc")
        .style("stroke-width", "2px");
}

// Function to convert the binary tree to the visual tree structure
function convertToVisualTree(node) {
    if (!node) return null;

    // Create a new object with 'name' and 'children' properties
    const visualNode = {
        name: node.name,
        children: []
    };

    // Recursively convert left and right children
    if (node.left) {
        visualNode.children.push(convertToVisualTree(node.left));
    }

    if (node.right) {
        visualNode.children.push(convertToVisualTree(node.right));
    }

    // If there are no children, delete the 'children' property
    if (visualNode.children.length === 0) {
        delete visualNode.children;
    }

    return visualNode;
}

// Handle form submission and process the graph
document.getElementById('graphForm').addEventListener('submit', function (event) {
    event.preventDefault();

    // Gather input from the form
    let nodeNames = document.getElementById('nodeNames').value.trim().split(/\s+/);
    let adjacencyMatrixInput = document.getElementById('adjacencyMatrix').value.trim();
    let adjacencyMatrix = adjacencyMatrixInput.split('\n').map(row => row.trim().split(/\s+/).map(Number));
    let numEdges = parseInt(document.getElementById('numEdges').value);
    let edgeNames = document.getElementById('edgeNames').value.trim().split(/\s+/);
    let incidenceMatrixInput = document.getElementById('incidenceMatrix').value.trim();
    let incidenceMatrix = incidenceMatrixInput.split('\n').map(row => row.trim().split(/\s+/).map(Number));
    let weightsInput = document.getElementById('weights').value.trim();
    let edgeWeights = weightsInput.split('\n').reduce((acc, line) => {
        let [edge, weight] = line.trim().split(/\s+/);
        acc[edge] = parseFloat(weight);
        return acc;
    }, {});

    // Prepare data object
    const data = {
        nodeNames: nodeNames,
        adjacencyMatrix: adjacencyMatrix,
        incidenceMatrix: incidenceMatrix,
        edgeNames: edgeNames,
        edgeWeights: edgeWeights
    };

    // Function to parse input data
    function parseInput(data) {
        const {
            nodeNames,
            adjacencyMatrix,
            incidenceMatrix,
            edgeNames,
            edgeWeights
        } = data;

        // Build nodes
        const nodes = {};
        nodeNames.forEach(name => {
            nodes[name] = { name, edges: [], left: null, right: null };
        });

        // Build edges with weights
        const edges = [];
        edgeNames.forEach((edgeName, index) => {
            const connectedNodes = [];
            incidenceMatrix.forEach((row, nodeIndex) => {
                if (row[index] === 1) {
                    connectedNodes.push(nodeNames[nodeIndex]);
                }
            });
            if (connectedNodes.length === 2) {
                edges.push({
                    name: edgeName,
                    nodes: connectedNodes,
                    weight: edgeWeights[edgeName]
                });
            }
            // Allow loops (edges connecting a node to itself) if needed
            else if (connectedNodes.length === 1) {
                edges.push({
                    name: edgeName,
                    nodes: [connectedNodes[0], connectedNodes[0]],
                    weight: edgeWeights[edgeName]
                });
            }
        });

        return { nodes, edges };
    }

    // Function to apply Kruskal's algorithm
    function kruskal(nodes, edges) {
        // Initialize parent for union-find
        const parent = {};
        Object.keys(nodes).forEach(node => {
            parent[node] = node;
        });

        function find(node) {
            if (parent[node] !== node) {
                parent[node] = find(parent[node]); // Path compression
            }
            return parent[node];
        }

        function union(nodeA, nodeB) {
            const rootA = find(nodeA);
            const rootB = find(nodeB);
            if (rootA !== rootB) {
                parent[rootB] = rootA;
                return true; // Union performed
            }
            return false; // Already connected
        }

        // Sort edges by weight
        edges.sort((a, b) => a.weight - b.weight);

        // Build MST
        const mstEdges = [];
        edges.forEach(edge => {
            const [nodeA, nodeB] = edge.nodes;
            if (find(nodeA) !== find(nodeB)) {
                union(nodeA, nodeB);
                mstEdges.push(edge);
                // Add edge to node connections
                nodes[nodeA].edges.push(nodeB);
                nodes[nodeB].edges.push(nodeA);
            }
            // Else, edge creates a cycle and is skipped
        });

        return mstEdges;
    }

    // Function to convert MST to a binary tree based on node names
    function mstToBinaryTree(nodes, rootName) {
        const visited = new Set();

        function dfs(nodeName) {
            visited.add(nodeName);
            const node = nodes[nodeName];
            const children = node.edges.filter(n => !visited.has(n));

            // Sort the children based on node names (convert to numbers if necessary)
            children.sort((a, b) => {
                // Attempt to parse node names as numbers for comparison
                const aValue = isNaN(a) ? a : parseFloat(a);
                const bValue = isNaN(b) ? b : parseFloat(b);

                if (aValue < bValue) return -1;
                if (aValue > bValue) return 1;
                return 0;
            });

            if (children.length > 0) {
                if (children.length > 1) {
                    // Assign left and right children based on sorted order
                    node.left = nodes[children[0]];
                    dfs(children[0]);
                    node.right = nodes[children[1]];
                    dfs(children[1]);

                    // If more than two children, process the remaining as right children recursively
                    for (let i = 2; i < children.length; i++) {
                        let currentNode = node.right;
                        while (currentNode.right) {
                            currentNode = currentNode.right;
                        }
                        currentNode.right = nodes[children[i]];
                        dfs(children[i]);
                    }
                } else {
                    // Only one child
                    const childName = children[0];
                    const nodeValue = isNaN(node.name) ? node.name : parseFloat(node.name);
                    const childValue = isNaN(childName) ? childName : parseFloat(childName);

                    if (childValue < nodeValue) {
                        // Assign as left child
                        node.left = nodes[childName];
                        dfs(childName);
                    } else {
                        // Assign as right child
                        node.right = nodes[childName];
                        dfs(childName);
                    }
                }
            }
        }

        dfs(rootName);
    }

    // Function to perform in-order traversal
    function inOrderTraversal(node) {
        const result = [];

        function traverse(node) {
            if (!node) return;
            traverse(node.left);
            result.push(node.name);
            traverse(node.right);
        }

        traverse(node);
        return result;
    }

    // Process the data
    const { nodes, edges } = parseInput(data);
    const mstEdges = kruskal(nodes, edges);

    // Output the MST result
    document.getElementById('mstResult').innerText = JSON.stringify(mstEdges, null, 2);

    // Build the binary tree from the MST
    let rootNode = nodeNames[0];  // You can choose any node as the root
    mstToBinaryTree(nodes, rootNode);

    // Output the Binary Tree result
    function serializeTree(node) {
        if (!node) return null;
        return {
            name: node.name,
            left: serializeTree(node.left),
            right: serializeTree(node.right)
        };
    }
    const binaryTreeResult = serializeTree(nodes[rootNode]);
    document.getElementById('binaryTreeResult').innerText = JSON.stringify(binaryTreeResult, null, 2);

    // Perform in-order traversal
    const inOrderResult = inOrderTraversal(nodes[rootNode]);
    document.getElementById('inOrderResult').innerText = inOrderResult.join(', ');

    // Convert the binary tree to the visual tree structure
    let visualTreeRoot = convertToVisualTree(nodes[rootNode]);

    // Visualize the tree using D3.js
    drawBinaryTree(visualTreeRoot);
});
