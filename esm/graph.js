/*
this libary is a TypeScript port of a js library written by Jim Riecken
https://github.com/jriecken/dependency-graph
*/
import { stringify } from './containers';
class Graph {
    constructor() {
        this.nodes = {};
        this.outgoingEdges = {}; // Node -> [Dependency Node]
        this.incomingEdges = {}; // Node -> [Dependant Node]
    }
    addNode(node, data) {
        if (!this.hasNode(node)) {
            if (arguments.length === 2) {
                this.nodes[node] = data;
            }
            else {
                this.nodes[node] = node;
            }
            this.outgoingEdges[node] = [];
            this.incomingEdges[node] = [];
        }
    }
    removeNode(node) {
        if (this.hasNode(node)) {
            delete this.nodes[node];
            delete this.outgoingEdges[node];
            delete this.incomingEdges[node];
            [this.incomingEdges, this.outgoingEdges].forEach(function (edgeList) {
                Object.keys(edgeList).forEach(function (key) {
                    var idx = edgeList[key].indexOf(node);
                    if (idx >= 0) {
                        edgeList[key].splice(idx, 1);
                    }
                }, this);
            });
        }
    }
    hasNode(node) {
        return this.nodes.hasOwnProperty(node);
    }
    getNodeData(node) {
        if (this.hasNode(node)) {
            return this.nodes[node];
        }
        else {
            throw new Error(`Node does not exist: ${node}`);
        }
    }
    setNodeData(node, data) {
        if (this.hasNode(node)) {
            this.nodes[node] = data;
        }
        else {
            throw new Error(`Node does not exist: ${node}`);
        }
    }
    addDependency(from, to) {
        if (!this.hasNode(from)) {
            throw new Error(`Node does not exist: ${from}`);
        }
        if (!this.hasNode(to)) {
            throw new Error(`Node does not exist: ${to}`);
        }
        if (this.outgoingEdges[from].indexOf(to) === -1) {
            this.outgoingEdges[from].push(to);
        }
        if (this.incomingEdges[to].indexOf(from) === -1) {
            this.incomingEdges[to].push(from);
        }
        return true;
    }
    removeDependency(from, to) {
        var idx;
        if (this.hasNode(from)) {
            idx = this.outgoingEdges[from].indexOf(to);
            if (idx >= 0) {
                this.outgoingEdges[from].splice(idx, 1);
            }
        }
        if (this.hasNode(to)) {
            idx = this.incomingEdges[to].indexOf(from);
            if (idx >= 0) {
                this.incomingEdges[to].splice(idx, 1);
            }
        }
    }
    dependenciesOf(node, leavesOnly) {
        if (this.hasNode(node)) {
            var result = [];
            var DFS = createDFS(this.outgoingEdges, leavesOnly, result);
            DFS(node);
            var idx = result.indexOf(node);
            if (idx >= 0) {
                result.splice(idx, 1);
            }
            return result;
        }
        else {
            throw new Error('Node does not exist: ' + stringify(node));
        }
    }
    dependantsOf(node, leavesOnly) {
        if (this.hasNode(node)) {
            var result = [];
            var DFS = createDFS(this.incomingEdges, leavesOnly, result);
            DFS(node);
            var idx = result.indexOf(node);
            if (idx >= 0) {
                result.splice(idx, 1);
            }
            return result;
        }
        else {
            throw new Error('Node does not exist: ' + stringify(node));
        }
    }
    overallOrder(leavesOnly) {
        var self = this;
        var result = [];
        var keys = Object.keys(this.nodes);
        if (keys.length === 0) {
            return result; // Empty graph
        }
        else {
            // Look for cycles - we run the DFS starting at all the nodes in case there
            // are several disconnected subgraphs inside this dependency graph.
            const CycleDFS = createDFS(this.outgoingEdges, false, []);
            for (const nodeName of keys) {
                CycleDFS(nodeName);
            }
            const DFS = createDFS(this.outgoingEdges, leavesOnly, result);
            // Find all potential starting points (nodes with nothing depending on them) an
            // run a DFS starting at these points to get the order
            const nodeNames = keys.filter(nodeName => self.incomingEdges[nodeName].length === 0);
            for (const nodeName of nodeNames) {
                DFS(nodeName);
            }
            return result;
        }
    }
}
function createDFS(edges, leavesOnly, result) {
    var currentPath = [];
    var visited = {};
    const DFS = (currentNode) => {
        visited[currentNode] = true;
        currentPath.push(currentNode);
        for (const node of edges[currentNode]) {
            if (!visited[node]) {
                DFS(node);
            }
            else if (currentPath.indexOf(node) >= 0) {
                currentPath.push(node);
                throw new Error('Dependency Cycle Found: ' + currentPath.join(' -> '));
            }
        }
        ;
        currentPath.pop();
        if ((!leavesOnly || edges[currentNode].length === 0) && result.indexOf(currentNode) === -1) {
            result.push(currentNode);
        }
    };
    return DFS;
}
export { Graph };
//# sourceMappingURL=graph.js.map