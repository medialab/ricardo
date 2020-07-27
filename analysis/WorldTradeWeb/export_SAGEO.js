const gexf = require('graphology-gexf/node');
const {DirectedGraph, Graph} = require('graphology');
const {readFileSync} = require('fs');
const async = require('async');
// Reading a dom document


var data = readFileSync('./data/networks/1861.gexf', 'utf8');
var graph = gexf.parse(DirectedGraph, data);
// Using the callback method
data = ''
graph.forEach(
    (source, target, sourceAttributes, targetAttributes, edge, edgeAttributes) => {
    data += `${source},${target},${edgeAttributes.weight},${year}\n`
  });
console.log(data)