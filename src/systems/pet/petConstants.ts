export class petConstants {
    ENTITY_RELATIONSHIP_DECAY_PER_TICK = 0.0001; // 0.01% decay per tick
    ACTIVITY_RELATIONSHIP_DECAY_PER_TICK = 0.0001; // 0.01% decay per tick
    BOREDOM_LOW_THRESHOLD = 20; // 20 boredom is considered low -> trigger something in decison system
    SOLO_ACTIVITY_WILLINGNESS_THRESHOLD = 0; // 0% willingness to do solo activity  
    PER_TICK_STAT_CHANGES = {
        "hunger" : 1,
        "boredom" : 1,
        "happiness" : -1,
        "energy" : -1
    }
}