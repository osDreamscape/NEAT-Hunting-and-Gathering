class PopulationManager {

    static SPECIES_ID = 0;
    static GEN_NUM = 0;
    static SPECIES_CREATED = 0;
    static WORLD_CREATED = 0;
    static SPECIES_COLORS = new Map();
    static SPECIES_SENSOR_COLORS = new Map();
    static SPECIES_MEMBERS = new Map();
    static COLORS_USED = new Set();
    static SENSOR_COLORS_USED = new Set();
    static NUM_AGENTS = params.NUM_AGENTS;

    constructor(game) {
        this.game = game;
        this.foodTracker = new FoodTracker();
        this.agentTracker = new AgentTracker();
        this.tickCounter = 0;
        this.genomeTracker = new GenomeTracker();
        let defaultColor = randomInt(361);
        PopulationManager.COLORS_USED.add(defaultColor);
        PopulationManager.SPECIES_COLORS.set(0, defaultColor);
        let defaultSensorColor = AgentInputUtil.randomBlueHue();
        PopulationManager.SENSOR_COLORS_USED.add(defaultSensorColor);
        PopulationManager.SPECIES_SENSOR_COLORS.set(0, defaultSensorColor);
        
        

        this.worlds = new Map();
        this.createFoodPodLayout();

        this.specieWorldList = new Map();//List of worlds for a specie

        //Check for splitting agents
        if (params.AGENT_PER_WORLD == 0) {
            this.initNewWorld(PopulationManager.SPECIES_ID);
            this.spawnAgents(PopulationManager.SPECIES_ID);
            this.specieWorldList.set(PopulationManager.SPECIES_ID, [0]);
            this.spawnFood(PopulationManager.SPECIES_ID, false);
            this.spawnFood(PopulationManager.SPECIES_ID, true);
            this.resetCanvases();
        }
        else {
            //Split the original specie into multiple worlds
            PopulationManager.SPECIES_MEMBERS.set(PopulationManager.SPECIES_ID, []);
            PopulationManager.SPECIES_CREATED++;
            this.specieWorldList.set(PopulationManager.SPECIES_ID, []);
            let numberOfAgentToSpawned = PopulationManager.NUM_AGENTS;
            let worldSpawned = 0;

            //Distribute the agents to the world
            while (numberOfAgentToSpawned > 0) {
                let agentNum = Math.min(numberOfAgentToSpawned, params.AGENT_PER_WORLD);
                this.initNewWorld(worldSpawned, PopulationManager.SPECIES_ID);
                this.spawnAgents(worldSpawned, agentNum);
                this.specieWorldList.get(PopulationManager.SPECIES_ID).push(worldSpawned);

                this.spawnFood(worldSpawned, false);
                this.spawnFood(worldSpawned, true);

                numberOfAgentToSpawned -= agentNum;
                worldSpawned++;
            }
            PopulationManager.WORLD_CREATED = worldSpawned;
            this.resetCanvases();

            
        }

        this.agentOutputChart_leftWheel = new Histogram(20, 0, "Left Wheel Output Chart", 280);
        

        //Create generational histograms
        const lW_canvas = document.getElementById('agentGenAvgLeftWheelChart');
        const lW_ctx = lW_canvas.getContext("2d");
        this.leftWheelHist = new Histogram(lW_ctx, 20, 5, "Average Left Wheel Output Per Generation");
        
        const rW_canvas = document.getElementById('agentGenAvgRightWheelChart');
        const rW_ctx = rW_canvas.getContext("2d");
        this.rightWheelHist = new Histogram(rW_ctx, 20, 5, "Average Right Wheel Output Per Generation");

        const b_canvas = document.getElementById('agentGenAvgBiteChart');
        const b_ctx = b_canvas.getContext("2d");
        this.biteHist = new Histogram(b_ctx, 20, 5, "Average Bite Output Per Generation");
    };

    createFoodPodLayout() { // all worlds will share the same food / poison pod layout. this will ensure clean merging and splitting
        let foodPods = [];
        let poisonPods = [];
        let flag = false;
        for (let theta = 0; theta < 2 * Math.PI; theta += Math.PI / 4) {
            let randomDist = params.CANVAS_SIZE / 2.5;
            let centerX = params.CANVAS_SIZE / 2 + randomDist * Math.cos(theta);
            let centerY = params.CANVAS_SIZE / 2 + randomDist * Math.sin(theta);
            let currList = flag ? poisonPods : foodPods;
            currList.push(new FoodPod(this.game, centerX, centerY, 100, flag));
            flag = !flag;
        }
        this.foodPodLayout = foodPods;
        this.poisonPodLayout = poisonPods;
    };


    //Replenish the food and poison relative to the Food Pod
    redistributeFoodAndPoison() {
        let foodIndex = 0;
        let poisonIndex = 0;
        this.worlds.forEach(members => {
            members.food.forEach(f => {
                let pos = this.foodPodLayout[foodIndex].genFoodPos();
                f.x = pos.x;
                f.y = pos.y;
                f.updateBoundingCircle();
                foodIndex = (foodIndex + 1) % this.foodPodLayout.length;
            });
            members.poison.forEach(p => {
                let pos = this.poisonPodLayout[poisonIndex].genFoodPos();
                p.x = pos.x;
                p.y = pos.y;
                p.updateBoundingCircle();
                poisonIndex = (poisonIndex + 1) % this.poisonPodLayout.length;
            });
        });
    };

    resetSim() {
        params.AGENT_VISION_IS_CONE = document.getElementById("agent_vision_is_cone").checked;
        PopulationManager.SPECIES_ID = 0;
        PopulationManager.GEN_NUM = 0;
        PopulationManager.SPECIES_CREATED = 0;
        PopulationManager.SPECIES_COLORS = new Map();
        PopulationManager.SPECIES_SENSOR_COLORS = new Map();
        PopulationManager.SPECIES_MEMBERS = new Map();
        PopulationManager.COLORS_USED = new Set();
        PopulationManager.SENSOR_COLORS_USED = new Set();
        PopulationManager.NUM_AGENTS = params.NUM_AGENTS;

        Genome.resetAll();
        this.game.population = new PopulationManager(this.game);
    };

    update() {
        //Update the params
        params.FREE_RANGE = document.getElementById("free_range").checked;
        params.AGENT_NEIGHBORS = document.getElementById("agent_neighbors").checked;
        params.FOOD_OUTSIDE = document.getElementById("food_outside_circle").checked;
        params.FOOD_INSIDE = document.getElementById("food_inside_circle").checked;
        params.ENFORCE_MIN_FOOD = document.getElementById("enforce_min_food").checked;
        params.ENFORCE_MIN_POISON = document.getElementById("enforce_min_poison").checked;
        params.RAND_FOOD_PHASES = document.getElementById("rand_food_phases").checked;
        params.RAND_FOOD_LIFETIME = document.getElementById("rand_food_lifetime").checked;
        params.FOOD_PERIODIC_REPOP = document.getElementById("periodic_food_repop").checked;
        params.POISON_PERIODIC_REPOP = document.getElementById("periodic_poison_repop").checked;
        params.RAND_DEFAULT_WEIGHTS = document.getElementById("rand_default_weights").checked;
        params.GEN_STOP = document.getElementById("gen_stop").checked;
        params.DYNAMIC_AGENT_SIZING = document.getElementById("dynamic_agent_sizing").checked;
        params.AGENT_VISION_DRAW_CONE = document.getElementById("draw_agent_vision_cone").checked;
        params.NO_DECAYING_FOOD = document.getElementById("no_decaying").checked;
        params.INNER_WALL = document.getElementById("inner_wall").checked;

        if (params.SPLIT_SPECIES && !document.getElementById("split_species").checked) {
            this.mergeWorlds();
        } else if (!params.SPLIT_SPECIES && document.getElementById("split_species").checked) {
            this.splitWorlds();
        }
        params.SPLIT_SPECIES = document.getElementById("split_species").checked;

        if (document.activeElement.id !== "food_agent_ratio") {
            params.FOOD_AGENT_RATIO = parseInt(document.getElementById("food_agent_ratio").value);
        }
        if (document.activeElement.id !== "poison_agent_ratio") {
            params.POISON_AGENT_RATIO = parseInt(document.getElementById("poison_agent_ratio").value);
        }
        if (document.activeElement.id !== "agent_vision_radius") {
            params.AGENT_VISION_RADIUS = parseFloat(document.getElementById("agent_vision_radius").value);
        }
        if (document.activeElement.id !== "agent_vision_rays") {
            params.AGENT_VISION_RAYS = parseFloat(document.getElementById("agent_vision_rays").value);
        }
        if (document.activeElement.id !== "agent_vision_angle") {
            params.AGENT_VISION_ANGLE = parseFloat(document.getElementById("agent_vision_angle").value);
        }
        if (document.activeElement.id !== "compat_threshold") {
            params.COMPAT_THRESH = parseFloat(document.getElementById("compat_threshold").value);
        }
        if (document.activeElement.id !== "agent_neighbor_count") {
            params.AGENT_NEIGHBOR_COUNT = parseInt(document.getElementById("agent_neighbor_count").value);
        }
        if (document.activeElement.id !== "fitness_calories") {
            params.FITNESS_CALORIES = parseFloat(document.getElementById("fitness_calories").value);
        }

        if (document.activeElement.id !== "FITNESS_BUMPING_INTO_WALL") {
            params.FITNESS_BUMPING_INTO_WALL = parseFloat(document.getElementById("FITNESS_BUMPING_INTO_WALL").value);
        }

        if (document.activeElement.id !== "FITNESS_OUT_OF_BOUND") {
            params.FITNESS_OUT_OF_BOUND = parseFloat(document.getElementById("FITNESS_OUT_OF_BOUND").value);
        }

        if (document.activeElement.id !== "fitness_potential_cal") {
            params.FITNESS_POTENTIAL_CALORIES = parseFloat(document.getElementById("fitness_potential_cal").value);
        }

        if (document.activeElement.id !== "num_agents") {
            params.NUM_AGENTS = parseInt(document.getElementById("num_agents").value);
        }

        if (document.activeElement.id !== "agent_per_world") {
            params.AGENT_PER_WORLD = parseInt(document.getElementById("agent_per_world").value);
            //Force turning the split specie on
            if (params.AGENT_PER_WORLD !== 0){
               if (!document.getElementById("split_species").checked){
                    document.getElementById("split_species").checked = true;
               }
            }
        }

        if (document.activeElement.id !== "max_ticks_to_consume") {
            params.MAX_TICKS_TO_CONSUME = parseInt(document.getElementById("max_ticks_to_consume").value);
        }

        //Cleans up all of the food/poison for the world
        this.worlds.forEach((members, worldId) => {
            members.cleanupFood(false); //cleanup food
            members.cleanupFood(true); //cleanup poison
            if (params.ENFORCE_MIN_FOOD && members.food.length < params.FOOD_AGENT_RATIO * members.agents.length) {
                this.spawnFood(worldId, false, params.FOOD_AGENT_RATIO * members.agents.length - members.food.length);
            }
            if (params.ENFORCE_MIN_POISON && members.poison.length < params.POISON_AGENT_RATIO * members.agents.length) {
                this.spawnFood(worldId, true, params.POISON_AGENT_RATIO * members.agents.length - members.poison.length);
            }
        });

       
        // //Produce random value on the chart for quick testing
        // let data = [];
        // for (let i = 0; i < 1; i++){
        //     let j = randomInt(2000);
        //     if (!data[j])
        //         data[j] = 0;
        //     else
        //         data[j]++;
        // }
        // if (!this.agentOutputChart_leftWheel.data[this.tickCounter / 7]){
        //     this.agentOutputChart_leftWheel.data [this.tickCounter / 7] = [];
        // }
        // this.agentOutputChart_leftWheel.data[this.tickCounter / 7].push(data);
        // //End Quick Testing

        //Output the Chart
        generateNeuralNetWorkData(this.agentOutputChart_leftWheel, 'agentLeftWheelChart');

        this.tickCounter++;
        //Check to see if the generation is over

        if ((this.tickCounter >= params.GEN_TICKS && !params.GEN_STOP) || (params.GEN_STOP && (this.isAgentEnergyGone() || this.isFoodGone()))) {
            //When a new generation starts 
            this.tickCounter = 0;
            this.processGeneration();
            if (document.activeElement.id !== "generation_time") {
                params.GEN_TICKS = parseInt(document.getElementById("generation_time").value);
            }
            return true;
        }
        return false;
    };

    isFoodGone() {

        let food = this.foodAsList(false).concat(this.foodAsList(true));
        for (let i = 0; i < food.length; i++) {
            if (!food[i].removeFromWorld) {
                return false;
            }
        }
        return true;
    };

    isAgentEnergyGone() {
        let agents = this.agentsAsList();
        for (let i = 0; i < agents.length; i++) {
            if (agents[i].energy > Agent.DEATH_ENERGY_THRESH) {
                return false;
            }
        }
        return true;

    };

    checkFoodLevels(poison = false) { // periodic food/poison repopulation function
        this.worlds.forEach((members, worldId) => {
            members.cleanupFood(poison);
            this.spawnFood(worldId, poison, (poison ? params.POISON_AGENT_RATIO : params.FOOD_AGENT_RATIO) * members.agents.length - (poison ? members.poison.length : members.food.length));
        });
    };

    getEntitiesInWorld(worldId, foodOnly = false, agentsOnly = false) {
        let members = this.worlds.get(worldId);
        if (!members)
            return [];
        if (foodOnly) {
            return members.food.concat(members.poison);
        } else if (agentsOnly) {
            return members.agents;
        } else {
            return members.food.concat(members.poison, members.agents);
        }
    };

    spawnAgents(worldId, numberOfAgentsSpawn = PopulationManager.NUM_AGENTS) {
        //Creating a new specie
        if (params.AGENT_PER_WORLD == 0) {
            PopulationManager.SPECIES_MEMBERS.set(PopulationManager.SPECIES_ID, []);
            PopulationManager.SPECIES_CREATED++;
        }

        for (let i = 0; i < numberOfAgentsSpawn; i++) { // add agents
            let agent = new Agent(this.game, params.CANVAS_SIZE / 2, params.CANVAS_SIZE / 2);
            agent.speciesId = PopulationManager.SPECIES_ID;
            agent.worldId = worldId;
            PopulationManager.SPECIES_MEMBERS.get(PopulationManager.SPECIES_ID).push(agent);
            this.worlds.get(worldId).agents.push(agent);
        }
    };

    spawnFood(worldId, poison = false, count = (poison ? params.POISON_AGENT_RATIO : params.FOOD_AGENT_RATIO) * this.worlds.get(worldId).agents.length) {
        let seedlings = [];
        let index = 0;
        for (let i = 0; i < count; i++) { // add food sources
            let pod = poison ? this.poisonPodLayout[index] : this.foodPodLayout[index];
            let loc = pod.genFoodPos();
            seedlings.push(new Food(this.game, loc.x, loc.y, poison, this.foodTracker));
            index = (index + 1) % (poison ? this.poisonPodLayout.length : this.foodPodLayout.length);
        }
        this.registerSeedlings(worldId, seedlings);
    };

    registerSeedlings(worldId, seedlings) {
        seedlings.forEach(seedling => {
            seedling.worldId = worldId;
            if (seedling.isPoison) {
                this.worlds.get(worldId).poison.push(seedling);
            } else {
                this.worlds.get(worldId).food.push(seedling);
            }
        });
    };

    registerChildAgents(children) {
        let repMap = new Map();
        PopulationManager.SPECIES_MEMBERS.forEach((speciesList, speciesId) => {
            // choose a rep for each species
            repMap.set(speciesId, speciesList[0]);
        });

        let compatOrder = [...repMap.keys()].sort(); // sort by speciesId such that compatibility is always considered in the same order
        children.forEach(child => { // fit child into a species
            let matchFound = false;
            compatOrder.forEach(speciesId => {
                let rep = repMap.get(speciesId);
                if (!matchFound && Genome.similarity(rep.genome, child.genome) <= params.COMPAT_THRESH) { // species matched
                    matchFound = true;
                    child.speciesId = speciesId;
                    PopulationManager.SPECIES_MEMBERS.get(speciesId).push(child);
                }
            });

            if (!matchFound) { // no compatible, creating a new species
                PopulationManager.SPECIES_CREATED++;
                child.speciesId = ++PopulationManager.SPECIES_ID;
                PopulationManager.SPECIES_MEMBERS.set(child.speciesId, []);
                let newColor = randomInt(361);
                while (PopulationManager.COLORS_USED.has(newColor)) {
                    newColor = randomInt(361);
                }
                PopulationManager.COLORS_USED.add(newColor);
                PopulationManager.SPECIES_COLORS.set(child.speciesId, newColor);
                let newSensorColor = AgentInputUtil.randomBlueHue();
                while (PopulationManager.SENSOR_COLORS_USED.has(newSensorColor)) {
                    newSensorColor = AgentInputUtil.randomBlueHue();
                }
                PopulationManager.SENSOR_COLORS_USED.add(newSensorColor);
                PopulationManager.SPECIES_SENSOR_COLORS.set(child.speciesId, newSensorColor);
                PopulationManager.SPECIES_MEMBERS.get(child.speciesId).push(child);
                repMap.set(child.speciesId, child); // child becomes representative for next children
                compatOrder = [...repMap.keys()].sort(); // resort the compatibility ordering

                if (params.SPLIT_SPECIES) {
                    if (params.AGENT_PER_WORLD == 0) {
                        //Create a new world for the new specie 
                        PopulationManager.WORLD_CREATED++;
                        this.initNewWorld(child.speciesId, child.specieId);
                        this.specieWorldList.set(child.speciesId, [child.speciesId]);
                        this.spawnFood(child.speciesId, false, params.FOOD_AGENT_RATIO);
                        this.spawnFood(child.speciesId, true, params.POISON_AGENT_RATIO);
                        //console.log("Create a new Specie", child.speciesId);
                    } else {
                        this.specieWorldList.set(child.speciesId, [++PopulationManager.WORLD_CREATED]);
                    }
                }
            }
            //Push the agents into a world
            if (params.AGENT_PER_WORLD == 0) {
                this.worlds.get(params.SPLIT_SPECIES ? child.speciesId : 0).agents.push(child);
                child.worldId = child.speciesId;
            }
        });
    };

    countDeads(worldId = undefined) {
        if (worldId != undefined) {
            return this.worlds.get(worldId).countDeads();
        }

        let count = 0;
        this.worlds.forEach(world => {
            count += world.countDeads();
        });

        return count;
    };

    countAlives(worldId = undefined) {
        if (worldId != undefined) {
            return this.worlds.get(worldId).countAlives();
        }

        let count = 0;
        this.worlds.forEach(world => {
            count += world.countAlives();
        });

        return count;
    };


    agentsAsList() {
        let agents = [];
        this.worlds.forEach(members => {
            agents.push(...members.agents);
        });
        return agents;
    };

    foodAsList(poison = false) {
        let food = [];
        this.worlds.forEach(members => {
            let list = poison ? members.poison : members.food;
            food.push(...list);
        });
        return food;
    };

    /**
     * Distribute agents to their world
     * ONLY WORLD WITH LIMITNG AGENT PER WORLD OPTION
     */
    distributeAgents() {
        //EXIT IF NOT IN AGENT PER WORLD MODE
        if (params.AGENT_PER_WORLD == 0) {
            return;
        }

        //Clear the pre-existing worlds
        this.worlds = new Map();
        let worldId = -1;

        let agentDistributed = 0;
        //Resetting the specie by world list
        this.specieWorldList = new Map();

        PopulationManager.SPECIES_MEMBERS.forEach((specie, speciesId) => {
            //Resetting the specie by world list
            this.specieWorldList.set(speciesId, []);

            for (let i = specie.length - 1; i >= 0; --i) {
                let agent = specie[i];
                //No world like it has been created or it's full
                if (!this.worlds.get(worldId) || this.worlds.get(worldId).agents.length >= params.AGENT_PER_WORLD) {
                    ++worldId;
                    this.initNewWorld(worldId, speciesId);
                    this.specieWorldList.get(speciesId).push(worldId);
                    this.spawnFood(worldId, false, params.FOOD_AGENT_RATIO);
                    this.spawnFood(worldId, true, params.POISON_AGENT_RATIO);
                    agent.worldId = worldId;
                    this.worlds.get(worldId).agents.push(agent);
                    
                    ++agentDistributed;
                    //console.log("Create new world", this.worlds.get(worldId).agents.length, specie[i], worldId);
                } else {
                    //console.log("Pushing agents to their old world", this.worlds.get(worldId).agents.length, specie[i], worldId);
                    agent.worldId = worldId;
                    this.worlds.get(worldId).agents.push(agent);
                    ++agentDistributed;
                }   

            }
            ++worldId;
        });
        console.log("Total agent distributed in gen ", PopulationManager.GEN_NUM, agentDistributed);
        PopulationManager.WORLD_CREATED = worldId;
    }

    cleanUpWorlds() {
        let extincts = [];
        this.worlds.forEach((members, worldId) => {
            members.cleanupAgents();
            if (members.agents.length === 0 || members.countAlives() == 0) {
                extincts.push(worldId);
            }
        });
        if (params.SPLIT_SPECIES) {
            extincts.forEach(worldId => {
                this.removeWorld(worldId);

                //Clean up in the agent list
                this.specieWorldList.forEach(x => {
                    for (let i = x.length - 1; i >= 0; i--) {
                        if (worldId == x[i]) {
                            x.splice(i, 1);

                        }
                    }
                });
            });
        }

        //Tidy up specie members
        //Only active when limiting agents per world is on for reason of backward compability 
        if (params.AGENT_PER_WORLD !== 0) {
            PopulationManager.SPECIES_MEMBERS.forEach((specie, speciesId) => {
                for (let i = specie.length - 1; i >= 0; --i) {
                    let agent = specie[i];
                    if (agent.removeFromWorld) {
                        specie.splice(i, 1);
                    }
                }
                if (specie.length == 0) {
                    PopulationManager.SPECIES_MEMBERS.delete(speciesId);
                }
            });
        }
        
    }

    initNewWorld(worldId, specieId) {
        let world = new World(this.game, worldId, specieId);
        this.worlds.set(worldId, world);

        if (params.FREE_RANGE) {
            this.resetCanvases();
        }
    };

    createWorldCanvas(worldId) {
        let canvas = document.createElement("canvas");
        canvas.id = `${worldId}`;
        canvas.width = params.CANVAS_SIZE;
        canvas.height = params.CANVAS_SIZE;
        canvas.style.border = "1px solid black";
        return canvas;
    };

    removeWorld(worldId) {
        this.worlds.get(worldId).removeWorld();
        this.worlds.delete(worldId);
    };

    mergeWorlds() {
        let allAgents = this.agentsAsList();
        let allFood = this.foodAsList();
        allFood.forEach(food => food.worldId = 0); // reset the world id of all food
        let allPoison = this.foodAsList(true);
        allPoison.forEach(poison => poison.worldId = 0); // reset the world id of all poison
        this.worlds = new Map();

        this.initNewWorld(0);
        this.worlds.get(0).agents = allAgents;
        this.worlds.get(0).food = allFood;
        this.worlds.get(0).poison = allPoison;

        this.resetCanvases();
    };

    splitWorlds() {
        let allAgents = this.agentsAsList();
        let allFood = this.foodAsList();
        let allPoison = this.foodAsList(true);
        this.worlds = new Map();
        allAgents.forEach(agent => {
            if (this.worlds.get(agent.worldId) === undefined) {
                this.initNewWorld(agent.worldId);
            }
            this.worlds.get(agent.worldId).agents.push(agent);
        });
        let worldIds = [...this.worlds.keys()];
        let index = 0;
        allFood.forEach(f => {
            f.worldId = worldIds[index];
            this.worlds.get(worldIds[index]).food.push(f);
            index = (index + 1) % worldIds.length;
        });
        index = 0;
        allPoison.forEach(p => {
            p.worldId = worldIds[index];
            this.worlds.get(worldIds[index]).poison.push(p);
            index = (index + 1) % worldIds.length;
        });
        this.resetCanvases();
    };

    resetCanvases() {
        const tmp = [];
        this.worlds.forEach((val) => {
            tmp.push(val.canvas);
        });
        createSlideShow(tmp, 'canvas');
    };

    processGeneration() {
        //Data collections for histograms
        let avgLeftWheelOut = new Array(20).fill(0);
        let avgRightWheelOut = new Array(20).fill(0);
        let avgBiteOut = new Array(20).fill(0);
        //evaluate the agents
        this.agentsAsList().forEach(agent => {
            this.agentTracker.processAgent(agent);
            this.genomeTracker.processGenome(agent.genome);
            agent.age++;
            agent.assignFitness();
            //Sort average output data for the histograms into their buckets
            avgLeftWheelOut[determineBucket(agent.totalOutputs[0] / params.GEN_TICKS, 0, 1)]++;
            avgRightWheelOut[determineBucket(agent.totalOutputs[1] / params.GEN_TICKS, 0, 1)]++;
            avgBiteOut[determineBucket(agent.totalOutputs[2] / params.GEN_TICKS, 0, 1)]++;
        });
        console.log(avgBiteOut);

        Genome.resetInnovations(); // reset the innovation number mapping for newly created connections

        let reprodFitMap = new Map();
        let minShared = 0;
        //Determine average raw fitness for each species
        PopulationManager.SPECIES_MEMBERS.forEach((speciesList, speciesId) => {
            //sum raw fitness for all members of this species
            let sumRaws = 0;
            speciesList.forEach(member => {
                sumRaws += member.genome.rawFitness;
            });
            minShared = Math.min(minShared, sumRaws / speciesList.length);
            reprodFitMap.set(speciesId, sumRaws / speciesList.length);
        });
        //Determines the avg fitness for each species after adding the abs val minimum negative fitness? - gabe
        let sumShared = 0;
        //Build the fitness chart for the species
        reprodFitMap.forEach((fitness, speciesId) => {
            const newFit = fitness + minShared * -1 + 10;
            reprodFitMap.set(speciesId, newFit);
            sumShared += reprodFitMap.get(speciesId);
            this.agentTracker.addSpeciesFitness({ speciesId, fitness: newFit });
        });

        //Selection process for killing off agents
        if (!params.FREE_RANGE) {
            let rouletteOrder = [...reprodFitMap.keys()].sort();
            let ascendingFitSpecies = [...reprodFitMap.keys()].sort((s1, s2) => reprodFitMap.get(s1) - reprodFitMap.get(s2));
            let deathFitMap = new Map();
            for (let i = 0; i < ascendingFitSpecies.length; i++) {
                deathFitMap.set(ascendingFitSpecies[i], reprodFitMap.get(ascendingFitSpecies[ascendingFitSpecies.length - i - 1]));
            }

            let deadCount = this.countDeads(); // this call is if we are transitioning from free range -> generational mode
            let numAgents = this.agentsAsList().length;
            for (let i = 0; i < Math.ceil(numAgents / 2) - deadCount; i++) { // death roulette -> kill the ceiling to ensure agent list is always even
                let killed = false;
                while (!killed) { // keep rolling the roulette wheel until someone dies
                    let rouletteResult = randomFloat(sumShared);
                    let rouletteIndex = 0;
                    let accumulator = 0;
                    let flag = false;
                    while (!flag) {
                        let nextSpecies = rouletteOrder[rouletteIndex];
                        accumulator += deathFitMap.get(nextSpecies);
                        if (accumulator >= rouletteResult) { // we try to kill a parent... might not be successful
                            flag = true;
                            let killOptions = shuffleArray(PopulationManager.SPECIES_MEMBERS.get(nextSpecies));
                            let j = 0;
                            while (j < killOptions.length && !killed) {
                                let toKill = killOptions[j];
                                if (!toKill.removeFromWorld) {
                                    killed = true;
                                    toKill.removeFromWorld = true;
                                }
                                j++;
                            }
                        }
                        rouletteIndex++;
                    }
                }
            }

            let children = [];
            let alives = this.countAlives(); // if free range mode kills off everybody, we produce at least 1 new agent
            // CROSSOVER: randomly produce offspring between n pairs of remaining agents, reproduction roulette
            for (let i = 0; i < PopulationManager.NUM_AGENTS - alives; i++) {
                let rouletteResult = randomFloat(sumShared);
                let rouletteIndex = 0;
                let accumulator = 0;
                let flag = false;
                let parent1, parent2;
                while (!flag) {
                    let nextSpecies = rouletteOrder[rouletteIndex];
                    accumulator += reprodFitMap.get(nextSpecies);
                    if (accumulator >= rouletteResult) {
                        flag = true;
                        let possibleParents = PopulationManager.SPECIES_MEMBERS.get(nextSpecies);
                        parent1 = possibleParents[randomInt(possibleParents.length)];
                        parent2 = possibleParents[randomInt(possibleParents.length)];
                    }
                    rouletteIndex++;
                }
                let childGenome = Genome.crossover(parent1.genome, parent2.genome);
                childGenome.mutate();
                let child = new Agent(this.game, params.CANVAS_SIZE / 2, params.CANVAS_SIZE / 2, childGenome);
                children.push(child);
            }

            this.registerChildAgents(children);
        }


        // let idList = "";
        // let length = 0;
        // this.worlds.forEach(world => {
        //     idList += world.worldId + " ";
        //     length++;
        // });

        // console.log("World: ", idList, length);
        //Clean up some of the dead worlds and balence agents count
        this.cleanUpWorlds();
        if (params.AGENT_PER_WORLD !== 0) {
            this.distributeAgents();
        }

        let remainingColors = new Set(); // we need to filter out the colors of species that have died out for reuse
        let remainingSensorColors = new Set(); // same thing with sensor colors
        PopulationManager.SPECIES_MEMBERS = new Map();
        this.agentsAsList().forEach(agent => { // fill species members map with surviving parents and children
            if (PopulationManager.SPECIES_MEMBERS.get(agent.speciesId) === undefined) {
                PopulationManager.SPECIES_MEMBERS.set(agent.speciesId, []);
            }
            PopulationManager.SPECIES_MEMBERS.get(agent.speciesId).push(agent);
            remainingColors.add(PopulationManager.SPECIES_COLORS.get(agent.speciesId));
            remainingSensorColors.add(PopulationManager.SPECIES_SENSOR_COLORS.get(agent.speciesId));
        });
        PopulationManager.COLORS_USED = new Set([...PopulationManager.COLORS_USED].filter(color => remainingColors.has(color)));
        PopulationManager.SENSOR_COLORS_USED = new Set([...PopulationManager.SENSOR_COLORS_USED].filter(color => remainingSensorColors.has(color)));



        //Resets all agents
        if (!params.FREE_RANGE) {
            this.agentsAsList().forEach(agent => {
                agent.moveToWorldCenter();
                agent.resetOrigin();
                agent.resetEnergy();
                agent.resetCalorieCounts();
                agent.resetCounters();
            });
        }

        //Clear current walls and add random walls to the map. Will be different for each world
        if (params.INNER_WALL) {
            this.worlds.forEach(world => {
                world.produceRandomBoxWalls(2, params.CANVAS_SIZE / 8, params.CANVAS_SIZE / 10);
            });
        }
        // console.log("Total agents", this.agentsAsList().length);
        
        PopulationManager.GEN_NUM++;

        //Generates the histograms
        this.leftWheelHist.data.push(avgLeftWheelOut);
        this.leftWheelHist.draw(this.leftWheelHist.ctx);
        this.rightWheelHist.data.push(avgRightWheelOut);
        this.rightWheelHist.draw(this.rightWheelHist.ctx);
        this.biteHist.data.push(avgBiteOut);
        this.biteHist.draw(this.biteHist.ctx);

        
        //Generates the data charts
        generateFitnessChart(this.agentTracker.getFitnessData());
        generateAgeChart(this.agentTracker.getAgeData());
        generateFoodConsumptionChart(this.foodTracker.getConsumptionData());
        generateFoodStageChart(this.foodTracker.getLifeStageData());
        generateConnectionChart(this.genomeTracker.getConnectionData());
        generateCycleChart(this.genomeTracker.getCycleData());
        generateNodeChart(this.genomeTracker.getNodeData());
        generateCurrentFitnessChart(this.agentTracker.getFitnessData());
        this.foodTracker.computePercentiles();
        generateFoodTimeChart(this.foodTracker.getPercentileData());
        this.foodTracker.addNewGeneration();
        this.agentTracker.addNewGeneration();
        this.genomeTracker.addNewGeneration();

        this.resetCanvases();
    };


};
