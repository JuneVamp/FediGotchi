import fs from "fs";
import path from "path";

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

// Source - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
export function getRandomInt(min : number, max : number) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

// Source - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
export function getRandomIntInclusive(min : number, max: number) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled); // The maximum is inclusive and the minimum is inclusive
}

// Source - https://stackoverflow.com/a/1026087
// Posted by Steve Harrison, modified by community. See post 'Timeline' for change history
// Retrieved 2026-06-29, License - CC BY-SA 4.0
export function capitalizeFirstLetter(val : string) : string {
    val = val.toLowerCase()
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}


export function writeToCsvFile(filePath : string, data : string) {
    // const fs = require('fs');
    // const path = require('path');

    // Ensure the directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.appendFileSync(filePath, data);
}