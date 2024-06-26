/**
 * A class for tracking genome structural data for each generation
 */
class GenomeTracker {
    constructor() {
        this.currentGeneration = -1;
        this.generations = [];
        this.addNewGeneration();
    }

    addNewGeneration() {
        this.currentGeneration++;
        this.generations[this.currentGeneration] = {
            maxNodes: 0,
            minNodes: Number.MAX_VALUE,
            nodes: [],
            maxConnections: 0,
            minConnections: Number.MAX_VALUE,
            connections: [],
            cycles: [], // count how many cycles each agent has\
            medianConnections: 0,
            medianNodes: 0,
            minCycles: Number.MAX_VALUE,
            maxCycles: 0,
            medianCycles: 0
        };
    }

    addNodes(genome) {
        const numNodes = genome.nodeGenes.size;
        this.generations[this.currentGeneration].maxNodes = Math.max(
            numNodes,
            this.generations[this.currentGeneration].maxNodes
        );
        this.generations[this.currentGeneration].minNodes = Math.min(
            numNodes,
            this.generations[this.currentGeneration].minNodes
        );
        this.generations[this.currentGeneration].nodes.push(numNodes);
    }

    addConnections(genome) {
        const connections = genome.connectionsAsList();
        const numConnections = connections.length;
        this.generations[this.currentGeneration].maxConnections = Math.max(
            numConnections,
            this.generations[this.currentGeneration].maxConnections
        );
        this.generations[this.currentGeneration].minConnections = Math.min(
            numConnections,
            this.generations[this.currentGeneration].minConnections
        );
        this.generations[this.currentGeneration].connections.push(
            numConnections
        );
        const numCycles = connections.reduce((acc, curr) => {
            if (curr.isCyclic) {
                return 1 + acc;
            } else {
                return acc;
            }
        }, 0);
        this.generations[this.currentGeneration].cycles.push(numCycles);
    }

    addCycles() {
        let data = this.getCycleData();
        //console.log(data);
        this.generations[this.currentGeneration].minCycles = Math.min(
            data[1],
            this.generations[this.currentGeneration].minCycles
        );
        this.generations[this.currentGeneration].maxCycles = Math.max(
            data[0],
            this.generations[this.currentGeneration].maxCycles
        );
        this.generations[this.currentGeneration].medianCycles = data[2];
    }

    processGenome(genome) {
        this.addConnections(genome);
        this.addNodes(genome);
        //console.log(this.generations[this.currentGeneration].maxNodes);
        //console.log(this.generations[this.currentGeneration].minNodes);
        //console.log(this.generations[this.currentGeneration].nodes);
        //console.log(this.getCycleData());
        //this.addCycles();
    }

    calcMedian() {
        this.generations[this.currentGeneration].medianConnections = getMedian(this.generations[this.currentGeneration].connections);
        this.generations[this.currentGeneration].medianNodes = getMedian(this.generations[this.currentGeneration].nodes);
    }

    getConnectionData() {
        const maxConnections = this.generations.map(
            (obj) => obj.maxConnections
        );
        const minConnections = this.generations.map(
            (obj) => obj.minConnections
        );
        const medianConnections = this.generations.map((obj) =>
            getMedian(obj.connections)
        );
        return {
            maxes: maxConnections,
            mins: minConnections,
            medians: medianConnections,
        };
    }

    getCycleData() {
        const maxCycles = this.generations.map((obj) =>
            obj.cycles.reduce((acc, curr) => Math.max(acc, curr), 0)
        );
        const minCycles = this.generations.map((obj) =>
            obj.cycles.reduce(
                (acc, curr) => Math.min(acc, curr),
                Number.MAX_VALUE
            )
        );
        const medianCycles = this.generations.map((obj) =>
            getMedian(obj.cycles)
        );
        return {
            maxes: maxCycles,
            mins: minCycles,
            medians: medianCycles,
        };
    }

    getNodeData() {
        const maxNodes = this.generations.map((obj) => obj.maxNodes);
        const minNodes = this.generations.map((obj) => obj.minNodes);
        const medianNodes = this.generations.map((obj) => getMedian(obj.nodes));
        return {
            maxes: maxNodes,
            mins: minNodes,
            medians: medianNodes,
        };
    }

    /**
     * A general helper method to add data to
     * @param {str} attribute name of the field or attribute we want to add data to
     * @param {obj} data the data we want to add to existing data
     */
    addToAttribute(attribute, data) {
        this.generations[this.currentGeneration][attribute] += data;
    }

    /**
     * Retrieve information of a certain attribute as a list
     * @param {str} attribute name of the attribute to retrieve
     * @returns {obj} the information of the attribute stores in agent tracker
     */
    getGenomeTrackerAttributesAsList(attribute) {
        let res =  this.generations.map((obj) => obj[attribute]);
        return res;
    }
}
