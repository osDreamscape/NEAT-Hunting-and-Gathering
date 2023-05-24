const loadProfile = (profile) => {
    let oldParams = params;
    let oldHTML = document.getElementsByTagName('html')[0].innerHTML;

    document.getElementById("save_to_db").checked = true;
    params.SAVE_TO_DB = true;

    document.getElementById("auto_save_genome").checked = true;
    params.AUTO_SAVE_GENOME = true;

    let attributesLoaded = 0;
    let len = 0;
    for (let key in profile) {
        len++;
        let attr = profile[key];
        params[key] = attr.value;

        if (attr.additionalFunction) {
            attr.additionalFunction();
            attributesLoaded++;
            continue;
        }
        if (!attr.HTMLElementID) {
            console.log("Missing HTML Element in the field: " + key);
            continue;
        }
        let HTMLElement = document.getElementById(attr.HTMLElementID);
        if (HTMLElement.value) {
            HTMLElement.value = attr.value;
        }
        if (HTMLElement.checked) {
            if (attr.value){
                HTMLElement.checked = attr.value;
            }
            
            if (attr.checked){
                HTMLElement.checked = attr.checked;
            }
            
        }
        attributesLoaded++;
        //console.log(key, value);
    }

    if (attributesLoaded === len) {
        console.log("All attributes loaded successfully");
        params.SIM_CURR_TRIAL = 0;
        gameEngine.population.resetSim();

    }
    else {
        console.log("Problem occurs during loading, reverting to the previous parameter specs");
        params = oldParams;
        document.getElementsByTagName('html')[0].innerHTML = oldHTML;
    }

};

//Example of profile
const simulationProfile_numberOfAgents_25 = {
    DB: {
        HTMLElementID: 'db',
        value: "NEATWi23"
    },

    DB_COLLECTION: {
        HTMLElementID: 'db_collection',
        value: "TotalNumberOfAgents_100"
    },

    GEN_TO_SAVE: {
        HTMLElementID: 'gen_to_save',
        value: 200,
    },

    SIM_TRIAL_NUM: {
        HTMLElementID: 'sim_trial_num',
        value: 3,
    },

    GENOME_DB: {
        HTMLElementID: 'genome_db',
        value: "NEATWi23"
    },

    GENOME_DB_COLLECTION: {
        HTMLElementID: 'genome_db_collection',
        value: "TotalNumberOfAgents_100_Genome"
    },

    GEN_TO_SAVE_GENOME: {
        HTMLElementID: 'gen_to_save_genome',
        value: 200,
    },

    SIM_TRIAL_NUM: {
        HTMLElementID: 'sim_trial_num',
        value: 3,
    },

    NUM_AGENTS: {
        HTMLElementID: 'num_agents',
        value: 25,
    },

    //Has a custom additional function to run before adding to the profile
    AGENT_PER_WORLD: {
        HTMLElementID: 'agent_per_world',
        value: 1,
        additionalFunction:
            () => {
                document.getElementById("restart_sim").click();
            },

    }
};

const SP_FitnessFunction_Specific = {
    DB: {
        HTMLElementID: 'db',
        value: "NEATSpr23"
    },

    DB_COLLECTION: {
        HTMLElementID: 'db_collection',
        value: "FitnessFunction_Specific"
    },

    GEN_TO_SAVE: {
        HTMLElementID: 'gen_to_save',
        value: 400,
    },
    
    GENOME_DB: {
        HTMLElementID: 'genome_db',
        value: "NEATSpr23"
    },

    GENOME_DB_COLLECTION: {
        HTMLElementID: 'genome_db_collection',
        value: "FitnessFunction_Specific_Genome"
    },

    GEN_TO_SAVE_GENOME: {
        HTMLElementID: 'gen_to_save_genome',
        value: 400,
    },

    SIM_TRIAL_NUM: {
        HTMLElementID: 'sim_trial_num',
        value: 3,
    },

    NUM_AGENTS: {
        HTMLElementID: 'num_agents',
        value: 50,
    },

    //Has a custom additional function to run before adding to the profile
    AGENT_PER_WORLD: {
        HTMLElementID: 'agent_per_world',
        value: 2,
        additionalFunction:
            () => {
                document.getElementById("restart_sim").click();
            },
    },

    FITNESS_HUNTING_PREY: {
        HTMLElementID: 'FITNESS_HUNTING_PREY',
        value: 10,
    },

    FITNESS_OUT_OF_BOUND: {
        HTMLElementID: 'FITNESS_OUT_OF_BOUND',
        value: -2,
    },

    FITNESS_CALORIES: {
        HTMLElementID: 'fitness_calories',
        value: 10,
    },

    SPLIT_SPECIES: {
        HTMLElementID: 'split_species',
        checked: false,
    },

    AGENT_NEIGHBORS: {
        HTMLElementID: 'agent_neighbors',
        checked: true,
    },

    FITNESS_ENERGY_EFFICIENCY: {
        HTMLElementID: 'FITNESS_ENERGY_EFFICIENCY',
        value: 0,
    },

    FITNESS_PERCENT_DEAD: {
        HTMLElementID: 'FITNESS_PERCENT_DEAD',
        value: -1,
    },

    FITNESS_WINNER_BONUS: {
        HTMLElementID: 'FITNESS_WINNER_BONUS',
        value: 1,
    },

    FOOD_BUSH: {
        HTMLElementID: 'food_bush',
        checked: true,
    },
};


const SP_FitnessFunction_Generic = {
    DB: {
        HTMLElementID: 'db',
        value: "NEATSpr23"
    },

    DB_COLLECTION: {
        HTMLElementID: 'db_collection',
        value: "FitnessFunction_Generic"
    },

    GEN_TO_SAVE: {
        HTMLElementID: 'gen_to_save',
        value: 400,
    },

    SIM_TRIAL_NUM: {
        HTMLElementID: 'sim_trial_num',
        value: 3,
    },

    GENOME_DB: {
        HTMLElementID: 'genome_db',
        value: "NEATSpr23"
    },

    DB_COLLECTION: {
        HTMLElementID: 'genome_db_collection',
        value: "FitnessFunction_Generic_Genome"
    },

    GEN_TO_SAVE_GENOME: {
        HTMLElementID: 'gen_to_save_genome',
        value: 400,
    },

    NUM_AGENTS: {
        HTMLElementID: 'num_agents',
        value: 50,
    },

    //Has a custom additional function to run before adding to the profile
    AGENT_PER_WORLD: {
        HTMLElementID: 'agent_per_world',
        value: 2,
        additionalFunction:
            () => {
                document.getElementById("restart_sim").click();
            },
    },

    FITNESS_HUNTING_PREY: {
        HTMLElementID: 'FITNESS_HUNTING_PREY',
        value: 0,
    },

    FITNESS_OUT_OF_BOUND: {
        HTMLElementID: 'FITNESS_OUT_OF_BOUND',
        value: -2,
    },

    FITNESS_CALORIES: {
        HTMLElementID: 'fitness_calories',
        value: 0,
    },

    SPLIT_SPECIES: {
        HTMLElementID: 'split_species',
        checked: false,
    },

    AGENT_NEIGHBORS: {
        HTMLElementID: 'agent_neighbors',
        checked: true,
    },

    FITNESS_ENERGY_EFFICIENCY: {
        HTMLElementID: 'FITNESS_ENERGY_EFFICIENCY',
        value: 5,
    },

    FITNESS_PERCENT_DEAD: {
        HTMLElementID: 'FITNESS_PERCENT_DEAD',
        value: -1,
    },

    FITNESS_WINNER_BONUS: {
        HTMLElementID: 'FITNESS_WINNER_BONUS',
        value: 2,
    },

    FOOD_BUSH: {
        HTMLElementID: 'food_bush',
        checked: true,
    }
};

const SP_Fitness_Generic_Faster_Prey = {
    ...SP_FitnessFunction_Generic,

    DB_COLLECTION: {
        HTMLElementID: 'db_collection',
        value: "FitnessFunction_Generic_FasterPrey"
    },

    GENOME_DB_COLLECTION: {
        HTMLElementID: 'genome_db_collection',
        value: "FitnessFunction_Generic_FasterPrey_Genome"
    },

    PREY_SPEED: {
        HTMLElementID: 'prey_speed',
        value: 5,
    },

    PREDATOR_SPEED: {
        HTMLElementID: 'predator_speed',
        value: 4,
    }
};

const SP_Fitness_Specific_Faster_Prey = {
    ...SP_FitnessFunction_Specific,
    DB_COLLECTION: {
        HTMLElementID: 'db_collection',
        value: "FitnessFunction_Specific_FasterPrey"
    },
    GENOME_DB_COLLECTION: {
        HTMLElementID: 'genome_db_collection',
        value: "FitnessFunction_Specific_FasterPrey_Genome"
    },
    PREY_SPEED: {
        HTMLElementID: 'prey_speed',
        value: 5,
    },

    PREDATOR_SPEED: {
        HTMLElementID: 'predator_speed',
        value: 4,
    },
};

const SP_Fitness_Generic_Faster_Prey_BushFood_Off = {
    ...SP_Fitness_Generic_Faster_Prey,

    DB_COLLECTION: {
        HTMLElementID: 'db_collection',
        value: "FitnessFunction_Generic_FasterPrey_FoodBush_Off"
    },

    GENOME_DB_COLLECTION: {
        HTMLElementID: 'genome_db_collection',
        value: "FitnessFunction_Generic_FasterPrey_FoodBush_Off_Genome"
    },

    FOOD_BUSH: {
        HTMLElementID: 'food_bush',
        checked: false,
    },

    COOLDOWN_TO_REGEN: {
        HTMLElementID: 'cooldown_to_regen',
        checked: 1,
    },

    MAX_TICKS_TO_CONSUME: {
        HTMLElementID: 'max_ticks_to_consume',
        checked: 1,
    }
};

const SP_Fitness_Specific_Faster_Prey_BushFood_Off = {
    ...SP_Fitness_Specific_Faster_Prey,
    DB_COLLECTION: {
        HTMLElementID: 'db_collection',
        value: "FitnessFunction_Specific_FasterPrey_FoodBush_Off"
    },

    GENOME_DB_COLLECTION: {
        HTMLElementID: 'genome_db_collection',
        value: "FitnessFunction_Specific_FasterPrey_FoodBush_Off_Genome"
    },

    FOOD_BUSH: {
        HTMLElementID: 'food_bush',
        checked: false,
    },

    COOLDOWN_TO_REGEN: {
        HTMLElementID: 'cooldown_to_regen',
        checked: 1,
    },

    MAX_TICKS_TO_CONSUME: {
        HTMLElementID: 'max_ticks_to_consume',
        checked: 1,
    }
};

const profileList = {
    "Specified Fitness Function": SP_FitnessFunction_Specific,
    "Specified Fitness: Faster Prey": SP_Fitness_Specific_Faster_Prey,
    "Specified Fitness: Faster Prey, Food Bush Off": SP_Fitness_Specific_Faster_Prey_BushFood_Off,

    "Generalized Fitness Function": SP_FitnessFunction_Generic,
    "Generalized Fitness: Faster Prey": SP_Fitness_Generic_Faster_Prey,
    "Generalized Fitness: Faster Prey, Food Bush Off": SP_Fitness_Generic_Faster_Prey_BushFood_Off,

};

const initProfiles = () => {
    select = document.getElementById('profileOption');

    for (let profileName in profileList) {
        let opt = document.createElement('option');
        opt.value = profileName;
        opt.innerHTML = profileName;
        select.appendChild(opt);
    }
};