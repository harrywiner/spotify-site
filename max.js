const tools = require("./tools.js");

dbPromise = tools.DBConnect("spotify");

dbPromise.then((con) => {
  console.log("in dbPromise");

  var name = "Borderline";
  select = SelectName(name, con);

  select.then((result) => {
    console.log(result);
    console.log(FindMax(result, name));
  });

  FindMax("Boarderline", con);
});

function SelectName(trackName, con) {
  return new Promise((resolve, reject) => {
    var sql = `select * from plays where trackName like '${trackName}';`;
    con.query(sql, function (err, result) {
      if (err) {
        console.log("Select Name error: " + err);
        reject();
      } else {
        resolve(result);
      }
    });
  });
}

// exp result with Althea: {max: 412595, count: 196}
function FindMax(json, name) {
  let max = 0;
  let count = 0;
  json.forEach((element) => {
    if (element.trackName == name) {
      if (element.msPlayed > max) {
        count = 1;
        max = element.msPlayed;
      }
    }
  });
  let out = { max: max, count: count };
  console.log(out);
  return out;
}

function FilterMax(json, name) {
  var result = FindMax(json, name);
}

function FindMax(trackName, con) {
  var selectPromise = SelectName(trackName, con);

  selectPromise.then((json) => {
    console.log(json);
  });
}
