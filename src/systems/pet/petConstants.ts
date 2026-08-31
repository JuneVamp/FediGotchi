export class petConstants {
    ENTITY_RELATIONSHIP_DECAY_PER_TICK = 0.0001; // 0.01% decay per tick
    ACTIVITY_RELATIONSHIP_DECAY_PER_TICK = 0.0001; // 0.01% decay per tick
    BOREDOM_LOW_THRESHOLD = 20; // 20 boredom is considered low -> trigger something in decison system
    SOLO_ACTIVITY_WILLINGNESS_THRESHOLD = 0; // 0% willingness to do solo activity  

    // trigger events, write function to match the name in the decison system
    // TODO 10 have some sort of eval instead of just low and high

    STAT_THRESHOLDS : { [functionName : string] : { [statName : string] : { low ?: number, high ?: number } } } 
    = {
        bored_start_activity : {
            "boredom" : {
                low : 20,
            }
        }
    }

    PER_TICK_STAT_CHANGES = {
        "hunger" : 1,
        "boredom" : 1,
        "happiness" : -1,
        "energy" : -1
    }
}