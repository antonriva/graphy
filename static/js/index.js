// Handle form submission and send data to the Flask backend
document.getElementById('graphForm').addEventListener('submit', function(event) {
    event.preventDefault();

    // Gather input from the form
    let nodeNames = document.getElementById('nodeNames').value.split(' ');
    let adjacencyMatrix = document.getElementById('adjacencyMatrix').value.split('\n').map(row => row.split(' ').map(Number));
    let numEdges = document.getElementById('numEdges').value;
    let edgeNames = document.getElementById('edgeNames').value.split(' ');
    let incidenceMatrix = document.getElementById('incidenceMatrix').value.split('\n').map(row => row.split(' ').map(Number));
    let weights = document.getElementById('weights').value.split('\n').reduce((acc, line) => {
        let [edge, weight] = line.split(' ');
        acc[edge] = parseFloat(weight);
        return acc;
    }, {});

    // Send the data to the backend
    fetch('/process', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            node_names: nodeNames,
            adjacency_matrix: adjacencyMatrix,
            num_edges: numEdges,
            edge_names: edgeNames,
            incidence_matrix: incidenceMatrix,
            weights: weights
        })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('mstResult').innerText = JSON.stringify(data.mst, null, 2);
        console.log("Binary Tree Data:", data.binary_tree);  // Log the binary tree data
        
        // Use the flat array to feed the visualization
        let flatTree = data.binary_tree.join(" ");  // Convert the array to a space-separated string
        document.getElementById("inp").value = flatTree;  // Set this as the input for the visualization

        action();  // Call the function to visualize the tree
    });
});

// Existing code for tree visualization

const output = document.getElementById("tree");

function getInput() {
    const value = document.getElementById("inp").value;
    var arr = value.split(" ")
    var num = [];

    for (var i = 0; i < arr.length; i++) {
        if (!isNaN(arr[i]) && arr[i] != "\n") {
            num.push(arr[i])
        }
    }
    return num;
}

function action() {
    getRoot();
    const el = document.querySelector('#tree');
    el.onwheel = zoom;
}

function getRoot() {
    var result = getInput();
    var root = createNodes(result);
    return root;
}

var tree = document.getElementById("tree");
var starty, startx, scrleft, scrtop, isdown;

tree.addEventListener('mousedown', e => MouseDown(e));
tree.addEventListener('mouseup', e => mouseUp(e));
tree.addEventListener('mouseleave', e => mouseLeave(e));
tree.addEventListener('mousemove', e => mouseMove(e));

function MouseDown(e) {
    isdown = true;
    startx = e.pageX - tree.offsetLeft;
    starty = e.pageY - tree.offsetTop;
    scrleft = tree.scrollLeft;
    scrtop = tree.scrollTop;
}

function mouseUp(e) {
    isdown = false;
}

function mouseLeave(e) {
    isdown = false;
}

function mouseMove(e) {
    if (isdown) {
        e.preventDefault();

        var y = e.pageY - tree.offsetTop;
        var goY = y - starty;
        tree.scrollTop = scrtop - goY;

        var x = e.pageX - tree.offsetLeft;
        var goX = x - startx;
        tree.scrollLeft = scrleft - goX;
    }
}

let scale = 1;

function zoom(event) {
    const el = document.querySelector('svg');

    event.preventDefault();

    scale += event.deltaY * -0.001;

    // Restrict scale
    scale = Math.min(Math.max(.250, scale), 1);

    // Apply scale transform
    el.style.transform = `scale(${scale})`;
}

function clear(el) {
    var allContainers = document.querySelectorAll(".numContainer");
    var inp = document.getElementById("inp");

    inp.value += '';

    allContainers.forEach(item => {
        if (item != el) {
            item.style.transform = "scale(0.9)";
            item.style.opacity = 0.7;
        } else {
            item.style.transform = "scale(1.1)";
            item.style.opacity = 1;
        }
    });
}

function toggleLock() {
    var btn = document.querySelector(".btn");
    var inp = document.getElementById("inp");
    var btn_click = document.querySelector(".btn-clear");
    let cont = document.querySelector(".findContainer");

    if (btn.innerHTML == "Lock") {
        btn.innerHTML = "Unlock";
        clearAndCreate();
    } else {
        cont.innerHTML = '';
        inp.style.display = "block";
        btn_click.style.display = "none";
        btn.innerHTML = "Lock";

        var circles = document.querySelectorAll(".node");

        circles.forEach((circle, i) => {
            setTimeout(() => {
                circle.firstChild.classList.remove("green");
                circle.firstChild.classList.remove("gold");
                circle.firstChild.classList.remove("gray");
            }, i * 100);
        });
    }
}

function clearAndCreate() {
    var inp = document.getElementById("inp");
    var btn_click = document.querySelector(".btn-clear");
    let cont = document.querySelector(".findContainer");
    document.querySelector(".findContainer").innerHTML = '';

    var result = getInput();
    result = result.filter(item => item !== '');

    result = [...new Set(result)];

    if (result.length > 0) {
        inp.style.display = "none";
        btn_click.style.display = "block";
    }

    result.forEach((circle) => {
        var root = getRoot()[0];
        let el = document.createElement("button");
        el.classList.add("numContainer");
        el.innerHTML = circle;
        el.style.transition = "1s";
        el.onclick = function () {
            clear(el);
            findTheNode(root, el);
        };
        cont.appendChild(el);
    });
}

function findTheNode(root, node) {
    var value = parseFloat(node.innerHTML);

    fillToColor(root.value, root.value == value ? "green" : "gold");

    if (root.value == value) return;

    if (root.value > value) {
        findTheNode(root.left, node);
        fillTheCircle(root.right, value);
    } else {
        findTheNode(root.right, node);
        fillTheCircle(root.left, value);
    }
}

function fillTheCircle(root, value) {
    if (root == null || root.value == value) return;
    fillToColor(root.value, "gray");

    fillTheCircle(root.left);
    fillTheCircle(root.right);
}

function fillToColor(value, color) {
    var circles = document.querySelectorAll(".node");

    circles.forEach((circle, i) => {
        circle.firstChild.classList.remove("green");
        circle.firstChild.classList.remove("gold");
        circle.firstChild.classList.remove("gray");
        if (circle.lastChild.innerHTML === value) {
            setTimeout(() => {
                circle.firstChild.classList.add(color);
            }, i * 100);
        }
    });
}