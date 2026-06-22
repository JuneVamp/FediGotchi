// Source - https://stackoverflow.com/a/55671924
// Posted by rydwolf, modified by community. See post 'Timeline' for change history
// Retrieved 2026-06-16, License - CC BY-SA 4.0

export function weighted_random(options: Array<{item : any, weight : number}>) : any {
    var i;

    var weights = [options[0]!.weight];

    for (i = 1; i < options.length; i++)
        weights[i] = options[i].weight + weights[i - 1];
    
    var random = Math.random() * weights[weights.length - 1];
    
    for (i = 0; i < weights.length; i++)
        if (weights[i] > random)
            break;
    
    return options[i].item;
}

export function getRandomInt(max : number) : number {
  return Math.floor(Math.random() * max);
}