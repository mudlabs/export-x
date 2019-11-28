const reactShim = require("./react-shim");
const App = require("./ExportX.jsx");
const ReactDOM = require("react-dom");
const React = require("react");

require("../src/styles.css");

let panel;

function show(event) {
  if (!panel) {
    panel = document.createElement("div");
    ReactDOM.render(<App panel={panel} />, panel);
  }
  return document.appendChild(panel);
}

module.exports = {
  panels: {
    main: {
      show
    }
  }
};
