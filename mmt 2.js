const moment = require("moment");
const tools = require("./tools.js");

// desired output: h: 36, min: 18 min, s: 36

var ms = 130719530;
var tempTime = moment().milliseconds(ms);

var out = "h: " + tempTime.hours() + " m: " + tempTime.minutes();

console.log(out);

console.log(tools.FormatMS(ms));
