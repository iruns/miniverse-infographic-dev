import colors from "colors";

exports.minifyString = function(string){

    return string
    .replace(/(--|\/\/).*\r?\n|\r|$/g, " ")// remove comments from line
    .replace(/(--|\/\/).*$/g, " ")// remove comments from end of string
    .replace(/\r?\n|\r|\t/g, " ")// convert letious white spaces to normal space
    .replace(/ +/g, " ")// remove double spaces
    .replace(/ *(\(|\)|;|,|\|\|) */g, "$1")// remove unneeded spaces around some characters
    .replace(/ *(:|=|\+|-|\*|<|>|%) */g, "$1")// remove unneeded spaces around operators
    .trim();
}


exports.diffLines = function (text1, text2){

    const lines1 = text1.split(/\r?\n|\r|\t/g);
    const lines2 = text2.split(/\r?\n|\r|\t/g);

    const lines1Min = lines1.map(line => exports.minifyString(line));
    const lines2Min = lines2.map(line => exports.minifyString(line));

    let result = "";

    let ln1 = 0;
    let ln2 = 0;
    let i1 = 0;
    let i2 = 0;
    let different = false;

    // check filled line
    while(true){

        // skip empty lines
        while(lines1Min[ln1] == "")
            ln1++;

        while(lines2Min[ln2] == "")
            ln2++;

        // if ends at the same time, break
        if(ln1 == lines1.length && ln2 == lines2.length )
            break;

        // if ends not at the same time, break
        if(ln1 == lines1.length){
            i1 = 0;
            different = true;
            break;
        }
        if(ln2 == lines2.length){
            i2 = 0;
            different = true;
            break;
        }

        // skip 1st space if the other is on newline
        if(i1 == 0 && i2 > 0 && lines2Min[ln2][i2] == " ")
            i2++;

        else if(i2 == 0 && i1 > 0 && lines1Min[ln1][i1] == " ")
            i1++;

        // if identical, keep going
        if(lines1Min[ln1][i1] == lines2Min[ln2][i2]){

            // if on the end of line, next line
            i1++;
            if(i1 == lines1Min[ln1].length){
                i1 = 0;
                ln1++;
            }

            i2++;
            if(i2 == lines2Min[ln2].length){
                i2 = 0;
                ln2++;
            }
        }
        else{
            different = true;
            break;
        }
    }

    if(!different){
        // console.log("--- Yay! No difference found! ---".green.bold);
        return false;
    }
    else{

        result += "Difference found:\n";
        result += "\n";

        // text 1
        result += "text 1:\n".cyan;

        result += lines1.slice(0,ln1).join("\n");
        result += "\n";

        if(ln1 < lines1.length && lines1Min[ln1] != ""){
            result += lines1Min[ln1].substring(0, i1) + ">>".red.bold;
            result += lines1Min[ln1].substring(i1) +"\n";

            // if(ln1+1 < lines1.length)
            //     result += lines1.slice(ln1+1).join("\n");
        }
        else
            result += ">> EMPTY".red.bold;

        // text 2
        result += "\n";
        result += "\n";
        result += "text 2:\n".cyan;

        result += lines2.slice(0,ln2).join("\n");
        result += "\n";

        if(ln2 < lines2.length && lines2Min[ln2] != ""){
            result += lines2Min[ln2].substring(0, i2) + ">>".red.bold;
            result += lines2Min[ln2].substring(i2) +"\n";

            // if(ln2+1 < lines2.length)
            //     result += lines2.slice(ln2+1).join("\n");
        }
        else
            result += ">> EMPTY".red.bold;

        console.log(result);
        return true;
    }
}

exports.diffLinesToText = function (text1, text2){

    const lines1 = text1.split(/\r?\n|\r|\t/g);
    const lines1Min = lines1.map(line => exports.minifyString(line));

    const text2Min = exports.minifyString(text2);

    let result = "";

    let ln1 = -1;
    let idx2 = 0;
    let diffIdx = -1;

    while(
        ln1 < lines1.length-1
    ){
        ln1++;

        // skip empty lines
        while(lines1Min[ln1] == "")
            ln1++;

        // if length passed, back to max
        if(ln1 == lines1.length){
            ln1--;
            break;
        }

        // if text2's next char is space, skip one to accomodate new line
        if(text2Min[idx2] == " ")
            idx2++;
        // console.log(lines1Min[ln1]);
        // check filled line
        for(let i = 0; i < lines1Min[ln1].length; i++) {

            if(lines1Min[ln1][i] != text2Min[idx2]){
                diffIdx = i;
                break;
            }

            idx2++;
        }

        if(diffIdx != -1)
            break;
    }

    if(diffIdx == -1){
        // console.log("--- Yay! No difference found! ---".green.bold);
        return false;
    }
    else{

        result += "Difference found:\n";
        result += "\n";

        // text 1
        result += "text 1:\n";

        result += lines1.slice(0,ln1).join("\n");
        result += "\n";

        if(ln1 < lines1.length && lines1Min[ln1] != ""){
            result += lines1Min[ln1].substring(0, diffIdx) + ">>===>>".red.bold;
            result += lines1Min[ln1].substring(diffIdx) +"\n";

            if(ln1+1 < lines1.length)
                result += lines1.slice(ln1+1).join("\n");
        }
        else
            result += ">>===>> EMPTY".red.bold;

        // text 2
        result += "\n";
        result += "\n";
        result += "text 2:\n";
        result += text2Min.substring(0, idx2) + ">>===>>".red.bold;
        result += text2Min.substring(idx2) +"\n";


        console.log(result);
        return true;
    }
}

exports.diff = function (text1, text2){

    const text1Min = exports.minifyString(text1);
    const text2Min = exports.minifyString(text2);

    let result = "";

    for (let i = 0; i < text1Min.length; i++) {

        if(text1Min[i] != text2Min[i]){

            result += "Difference found:\n";
            result += "\n";
            result += "text 1:\n";

            result += text1Min.substring(0, i) + ">>===>>".red.bold;
            result += text1Min.substring(i) +"\n";
            result += "\n";
            result += "text 2:\n";
            let i2 = Math.min(i, text2Min.length-1);
            result += text2Min.substring(0, i2) + ">>===>>".red.bold;
            result += text2Min.substring(i2) +"\n";
            result += "\n";
            result += text1Min;

            console.log(result);
            return true;
        }
    }
    // console.log("       Yay! No difference found.".green.bold);
    return false;
}
