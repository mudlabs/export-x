const reactShim = require("./react-shim");
const App = require("./ExportX.jsx");
const ReactDOM = require("react-dom");
const React = require("react");

require("../src/styles.css");

let panel;
let onUpdate;
const setUpdator = updator => (onUpdate = updator);

function show(event) {
  if (!panel) {
    panel = document.createElement("div");
    ReactDOM.render(<App callbacks={{ setUpdator }} />, panel);
  }
  return document.appendChild(panel);
}

function update(selection, documentRoot) {
  if (typeof onUpdate === "function") {
    onUpdate(selection.focusedArtboard, documentRoot);
  }
}

module.exports = {
  panels: {
    main: {
      show,
      update
    }
  }
};
