var readline = require("readline");
var fs = require("fs");

parseRawArray = (data, parseCondition) => {
  var read = false;
  result = [];
  for (var i = 0; i < data.length; i++) {
    if (data[i].includes(parseCondition)) {
      read = true;
      continue;
    }
    if (data[i].includes("//") && read) break;
    if (read) {
      var string_array = data[i].match(/((!? \d+))/g);
      var int_array = [];
      string_array.forEach((element) => {
        int_array.push(parseInt(element));
      });
      result.push(int_array);
    }
  }
  if (result.length < 2) return result[0];
  else return result;
};

// Use NodeJS module fs (File System) to read file as stream. Than the readline module provide an interface to read data from the stream.
// https://nodejs.org/api/fs.html#fs_fs_createreadstream_path_options
// https://nodejs.org/api/readline.html#readline_readline_createinterface_options

readDataFromFile = async () => {
  const fileStream = fs.createReadStream(process.argv[2]);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });
  result = [];
  var i = 0;
  for await (const line of rl) {
    result[i] = line;
    i++;
  }
  return result;
};

transposition = (data) => {
  // Der Objective Function wird an der stelle wo die Summe der Constrains steht eine 0 hinzugefügt.
  data.objectiveFunc.push(0)
  data.constrains.push(data.objectiveFunc)
  var result = []
  // Es wird davon ausgegangen, dass die erste zeile genauso lang wie die übrigen ist.
  for (var i = 0; i < data.constrains[0].length; i++) {
    var temp = []
    for (var k = 0; k < data.constrains.length; k++)
      temp.push(data.constrains[k][i])
    result.push(temp)
  }

  return result
}

addSlackVar = (data) => {
  var numberOfConstrains = data.length - 1
  const splicePoint = data[0].length - 1
  for (var i = 0; i <= numberOfConstrains; i++) {
    for (var k = 0; k < numberOfConstrains; k++) {
      if (k !== i) data[i].splice(splicePoint + k, 0, 0);
      else data[i].splice(splicePoint + k, 0, 1);
    }
  }
  return data
}

getPivotRow = (data) => {
  const colum = data.length - 1
  return data[colum].indexOf(Math.max(...data[colum]));
}

getPivotColum = (data, pivotRow) => {
  const colum = data.length - 1
  const rowlength = data[0].length - 1
  var temp = []
  for (var i = 0; i < colum; i++) {
    //data[i][rowlength] = data[i][rowlength]/data[i][pivotRow]
    if (data[i][pivotRow] !== 0)
      temp.push(data[i][rowlength] / data[i][pivotRow])
    else temp.push('/')
  }
  return temp.indexOf(Math.min(...temp));
}

getPivotElement = (data) => {
  return [getPivotRow(data), getPivotColum(data, getPivotRow(data))]
}

simplex = (data) => {
  const decN = 10000; 
  var status = true
  while (status) {
    var pivPos = getPivotElement(data);
    const rowlength = data[0].length
    var pivElement = data[pivPos[1]][pivPos[0]]
    for (var i = 0; i < rowlength; i++) {
      data[pivPos[1]][i] = Math.round((data[pivPos[1]][i] / pivElement) * decN + Number.EPSILON) / decN;

    }
    for (var i = 0; i < data.length; i++) {

      if (i !== pivPos[1]) {
        var temp = data[i][pivPos[0]]
        var tempFaktor = temp * 1;
        for (var k = 0; k < rowlength; k++) {
          
          if (temp === pivElement) {
            data[i][k] = Math.round((data[i][k] - data[pivPos[1]][k]) * decN + Number.EPSILON) / decN;
          }
          else if (temp < pivElement) {
            data[i][k] = Math.round((data[i][k] - (data[pivPos[1]][k] * tempFaktor)) * decN + Number.EPSILON) / decN;
          }
          else if (temp > pivElement) {
            data[i][k] = Math.round((data[i][k] - (data[pivPos[1]][k] * tempFaktor)) * decN + Number.EPSILON) / decN;
          }
        }
      }
    }
    if (Math.max(...data[data.length - 1]) > 0)
      console.log('again')
    else {
      // console.log('nicht nochmal')
      // console.log(Math.max(...data[data.length-1]));
      status = false
    }
  }
  return data
}

final = (data, width) => {
  var result = []
  //console.log(data)
  //console.log(width)
  for (var i = 0; i < width; i++) {
    //console.log('new round')
    var temp = false
    var pos
    //console.log(data.length)
    for (var k = 0; k < data.length; k++) {
      //console.log(`Here ${data[k][i]}`)
      if (data[k][i] !== 0) {
        if (data[k][i] !== 1 || temp === true) {
          //console.log('break')
          k = data.length
        } else {
          temp = true
          pos = k
        }

      }
      if (k === (data.length - 1)) {
        result.push({[i]: data[pos][data[0].length-1] })
      }
    }
  }
  console.table(data)
  console.log(result)
}

handler = async () => {
  var rawData = await readDataFromFile();
  var data = {};
  data.objectiveFunc = parseRawArray(rawData, "// Objective function");
  data.constrains = parseRawArray(rawData, "// constraints");
  data.transposed = transposition(data);
  const width = data.transposed[0].length - 1
  data.slack = addSlackVar(data.transposed)
  data.simplex = simplex(data.slack)
  data.result = final(data.simplex, width)

};

handler();
