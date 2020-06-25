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
  var temp = [];
  for (var i = 0; i < data[colum].length - 1; i++)
    temp.push(data[colum][i])
  return temp.indexOf(Math.max(...temp));
}

getPivotColum = (data, pivotRow) => {
  const colum = data.length - 1
  const rowlength = data[0].length - 1
  var temp = []
  for (var i = 0; i < colum; i++) {
    if (data[i][pivotRow] > 0 || data[i][rowlength] > 0) {

      temp.push(data[i][rowlength] / data[i][pivotRow])
    } else temp.push(0)
  }
  var result
  temp.map(element => {
    if (result === undefined && element > 0) result = element
    if (element < result && element > 0)
      result = element
  })
  return temp.indexOf(result);
}

getPivotElement = (data) => {
  return [getPivotRow(data), getPivotColum(data, getPivotRow(data))]
}

simplex = (data) => {
  var status = true
  for (var l = 0; status === true; l++) {
    var pivPos = getPivotElement(data);
    const rowlength = data[0].length
    var pivElement = data[pivPos[1]][pivPos[0]]
    for (var i = 0; i < rowlength; i++) {
      data[pivPos[1]][i] = (data[pivPos[1]][i] / pivElement);
    }
    for (var i = 0; i < data.length; i++) {
      if (i !== pivPos[1]) {
        var temp = data[i][pivPos[0]]
        var tempFaktor = temp * 1;
        for (var k = 0; k < rowlength; k++) {
          data[i][k] = (data[i][k] - (data[pivPos[1]][k] * tempFaktor));
        }
      }
    }
    if (!Math.max(...data[data.length - 1]) > 0) {
      //console.log('break')
      status = false
      break;
    }
  }
  return data
}

final = (data, width) => {
  function variables (result) {
    this.result = result
  }
  var temp = {}
  for(var i = width; i < data[0].length; i++) {
    if(i !== data[0].length -1) 
      temp[`x${i-width}`] = new variables(Math.abs(Math.round(data[data.length -1][i]* 100) /100))
    else temp.obj = new variables(Math.abs(Math.round(data[data.length -1][i]* 100) /100))
  }
  console.table(temp)
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
  if(process.argv[3] === 'table' ){
    console.table(data.simplex)
  }
  data.result = final(data.simplex, width)
};

handler();
