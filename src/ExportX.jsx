const React = require("react");
const ReactDom = require("react-dom");
const scenegraph = require("scenegraph");
const application = require("application");
const { localFileSystem, fileTypes } = require("uxp").storage;

class ExportX extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      callbacks: props.callbacks,
      artboard: undefined,
      imports: {
        files: [],
        directory: undefined,
        fromSelection: false,
        glob: undefined
      },
      size_origin: {
        _rectangleId: "ExportXSize&OriginPreview",
        _rectangle: undefined,
        width: 0,
        height: 0,
        x: 0,
        y: 0
      },
      scales: [1],
      file: {
        name: "",
        prepend: "",
        append: "",
        extension: "",
        illegalCharacter: false,
        overwrite: false,
        embedImages: true,
        minify: true,
        quality: 100
      },
      directory: {
        root: undefined,
        name: undefined,
        illegalCharacter: false
      },
      exporting: {
        inProgress: false,
        itemsExported: 0,
        outputDirectory: "",
        outputFiles: [],
        finished: false
      }
    };

    this.Form = this.Form.bind(this);
    this.Exporting = this.Exporting.bind(this);
  }

  componentDidMount() {
    this.state.callbacks.setUpdator(this.updated.bind(this));
  }

  get fileNamePreview() {
    const { file } = this.state;
    if (file.name.trim() !== "" && file.extension.trim() !== "") {
      let name = file.name;
      if (name.includes("%n")) {
        name = name.replace(/\%n/, "<file-name>");
      }
      if (name.includes("%i")) {
        name = name.replace(/\%i/, "<index>");
      }

      return (
        name +
        file.prepend +
        this.state.scales[0] +
        file.append +
        "." +
        file.extension.toLowerCase()
      );
    } else {
      return "";
    }
  }

  updated(focusedArtboard, documentRoot) {
    let { artboard } = this.state;
    const { size_origin } = this.state;
    try {
      if (focusedArtboard) {
        const rectangle = focusedArtboard.children.filter(
          child => child.pluginData.id === this.state.size_origin._rectangleId
        )[0];

        artboard = artboard || focusedArtboard;
        if (rectangle) {
          const bounds = rectangle.boundsInParent;
          size_origin._rectangle = rectangle;
          size_origin.width = bounds.width;
          size_origin.height = bounds.height;
          size_origin.x = bounds.x;
          size_origin.y = bounds.y;
        } else {
          throw "No Rectangle";
        }
      } else {
        artboard = undefined;
        throw "No Artboard";
      }
    } catch (error) {
      size_origin.x = 0;
      size_origin.y = 0;
      size_origin.width = 0;
      size_origin.height = 0;
      size_origin._rectangle = undefined;
    } finally {
      this.setState({ artboard, size_origin });
    }
  }

  isInBounds(parent, frame) {
    if (frame.x > parent.width) return false;
    if (frame.width > 0 && frame.x < -frame.width) return false;
    if (frame.y > parent.height) return false;
    if (frame.height > 0 && frame.y < -frame.height) return false;
    return true;
  }

  onImageSizeChange(event) {
    try {
      const value = parseFloat(event.target.value);
      if (typeof value === "number" && !isNaN(value)) {
        const id = event.target.id;
        const { size_origin } = this.state;
        const frame = Object.assign({}, size_origin);
        const key = /x|width/.test(id) ? "width" : "height";
        const int = /\%$/.test(event.target.value)
          ? (this.state.artboard.localBounds[key] / 100) * value
          : value;

        console.log(
          id,
          /[x|width]/.test(id),
          /\%$/.test(event.target.value),
          this.state.artboard.localBounds[key],
          key
        );
        frame[id] = int;

        if (/[width|height]/.test(id) && int < 0) {
          throw `Input Error: ${id} must be a none-negative value.`;
        } else if (this.isInBounds(this.state.artboard.localBounds, frame)) {
          size_origin[id] = int;
          this.setState({ size_origin });
        } else {
          throw `Input Error: Rectangle out of bounds.`;
        }

        application.editDocument(
          { editLabel: `Export X: Size & Origin (${id})` },
          () => {
            if (size_origin._rectangle === undefined) {
              const rectangle = new scenegraph.Rectangle();
              rectangle.name = "Export X: size/origin preview layer";
              rectangle.fill = new scenegraph.Color("#D0E9FF");
              rectangle.strokeEnabled = false;
              size_origin._rectangle = rectangle;
              this.state.artboard.removeAllChildren();
              this.state.artboard.addChild(rectangle);
              size_origin._rectangle.pluginData = {
                id: this.state.size_origin._rectangleId
              };
            }

            size_origin._rectangle.resize(
              size_origin.width,
              size_origin.height
            );

            size_origin._rectangle.placeInParentCoordinates(
              { x: 0, y: 0 },
              { x: size_origin.x, y: size_origin.y }
            );
          }
        );
      }
    } catch (error) {
      console.log(error);
    } finally {
      event.target.value = this.state.size_origin[event.target.id];
    }
  }

  onFileNameChange(event) {
    const { file } = this.state;
    const { id, value } = event.target;

    if (this.isInputValid(value)) {
      file[id] = value;
      file.illegalCharacter = false;
      this.setState({ file: file });
    } else {
      file.illegalCharacter = true;
      this.setState({ file: file });
    }
  }

  isInputValid(input) {
    const expression = new RegExp(/[\\\/\:\*\?\"\<\>\|\#\]]/, "gi");
    return expression.test(input) ? false : true;
  }

  setNewExportDirectory(event) {
    const value = event.target.value;
    const { directory } = this.state;

    if (this.isInputValid(value)) {
      directory.illegalCharacter = false;
      directory.name = value;
    } else {
      directory.illegalCharacter = true;
      directory.name = undefined;
    }

    this.setState({ directory });
  }

  async selectExportDirectory(event) {
    const { directory } = this.state;
    const folder = await localFileSystem.getFolder();

    if (folder.isFolder) {
      directory.root = folder;
      this.setState({ directory });
    }
  }

  pointerEnter(event) {
    if (event.target === event.currentTarget) {
      event.target.style.backgroundColor = "#A6CBED40";
    }
  }

  pointerLeave(event) {
    if (event.target === event.currentTarget) {
      event.target.style.backgroundColor = "#A6CBED00";
    }
  }

  async importFromSelection() {
    const files = await localFileSystem.getFileForOpening({
      allowMultiple: true
    });

    if (files.length > 0) {
      const { imports } = this.state;
      const expression = new RegExp(/png|jpg|jpeg$/, "i");
      imports.files = files.filter(item => expression.test(item.name));
      imports.fromSelection = true;
      imports.directory = undefined;
      imports.glob = undefined;
      this.setState({ imports });
    }
  }

  getFileName(file) {
    const index = file.name.lastIndexOf(".");
    const name = file.name.slice(0, index);
    return name;
  }

  getFileExtension(file) {
    const index = file.name.lastIndexOf(".") + 1;
    const extension = file.name.slice(index, file.name.length);
    return extension;
  }

  async setImportDirectory() {
    const directory = await localFileSystem.getFolder();
    if (directory.isFolder) {
      const { imports } = this.state;
      imports.directory = directory;
      imports.fromSelection = false;
      imports.files = [];
      this.setState({ imports });
    }
  }

  onGlobPatternChange(event) {
    const { imports } = this.state;
    const value = event.target.value.trim();
    imports.glob = value !== "" ? value : null;
    this.setState({ imports });
  }

  async importFromDirectory() {
    const { imports } = this.state;
    const entries = await imports.directory.getEntries();
    const files = [];

    if (imports.glob === undefined) {
      const expression = new RegExp(/\.(png)$/, "gi");
      entries.forEach(entry => {
        if (entry.isFile && expression.test(entry.name)) {
          files.push(entry);
        }
      });
    } else {
      const recursive = /^\*\*\//.test(imports.glob);
      let userExpression = recursive
        ? imports.glob.slice(3, imports.glob.length)
        : imports.glob;
      userExpression = userExpression.replace(new RegExp(/\./, "g"), "\\.");
      userExpression = userExpression.replace(new RegExp(/\*/, "g"), ".*");
      const expression = new RegExp(userExpression);
      const addFilesFromEntries = async function(entries) {
        for (let i = 0; i < entries.length; i++) {
          if (entries[i].isFile && expression.test(entries[i].name)) {
            files.push(entries[i]);
          } else if (entries[i].isFolder && recursive) {
            const nextEntries = await entries[i].getEntries();
            addFilesFromEntries(nextEntries);
          }
        }
      };
      addFilesFromEntries(entries);
    }

    imports.files = files;
    this.setState({ imports });
  }

  get getImportDirectory() {
    if (!this.state.imports.fromSelection) {
      if (this.state.imports.directory) {
        return this.state.imports.directory.name;
      }
    }
    return "";
  }

  get getImports() {
    if (this.state.imports.fromSelection) {
      if (this.state.imports.files.length > 0) {
        const length = this.state.imports.files.length;
        return `[${length}] ${this.state.imports.files
          .map(i => i.name)
          .join(", ")}`;
      }
    }
    return "";
  }

  get exportDisabled() {
    const { imports, file, directory } = this.state;

    const noImportFiles = imports.files.length > 0 ? false : true;
    const noFileName = file.name !== "" && file.extension !== "" ? false : true;
    const noDirectory = directory.root !== undefined ? false : true;

    if (noImportFiles || noFileName || noDirectory) {
      return true;
    } else {
      return false;
    }
  }

  onExportX() {
    if (this.exportDisabled) {
      return;
    } else {
      const { exporting } = this.state;
      exporting.inProgress = true;
      this.setState({ exporting });

      application.editDocument(
        { editLabel: `Export X: export images` },
        async () => {
          const {
            imports,
            size_origin,
            scales,
            artboard,
            directory
          } = this.state;

          const replace = (string, name, index) => {
            let output = string.replace(/(\%n)/g, name);
            output = output.replace(/(\%i)/g, index);
            return output;
          };

          for (let i = 0; i < imports.files.length; i++) {
            let folder;
            const renditionSettings = [];
            const asset = imports.files[i];
            const assetName = this.getFileName(asset);

            size_origin._rectangle.fill = new scenegraph.ImageFill(asset);

            if (directory.name !== undefined) {
              const folderName = replace(directory.name, assetName, i);
              try {
                folder = await directory.root.getEntry(folderName);
              } catch (error) {
                folder = await directory.root.createFolder(folderName);
              }
              exporting.outputDirectory =
                directory.root.name + "/" + folder.name;
            } else {
              folder = directory.root;
              exporting.outputDirectory = folder.name;
            }
            this.setState({ exporting });

            for (let j = 0; j < scales.length; j++) {
              const int = scales[j];
              const { file } = this.state;
              const overwrite = file.overwrite;
              const name = replace(
                `${file.name}${file.prepend}${int}${file.append}`,
                assetName,
                i
              );
              const fileName = `${name}.${file.extension.toLowerCase()}`;
              let outputFile;

              try {
                outputFile = await folder.createFile(fileName, { overwrite });
              } catch (error) {
                outputFile = await folder.createFile(`${i}_${fileName}`, {
                  overwrite
                });
              }

              const rendition = {
                node: artboard,
                scale: scales[j],
                type: application.RenditionType[file.extension],
                outputFile: outputFile,
                embedImages: file.embedImages,
                minify: file.minify,
                quality: file.quality
              };

              renditionSettings.push(rendition);

              exporting.outputFiles.push(outputFile.name);
              this.setState({ exporting });
            }

            await application.createRenditions(renditionSettings);

            exporting.itemsExported = i + 1;
            if (i < imports.files.length - 1) {
              exporting.outputFiles = [];
            }
            this.setState({ exporting });
          }

          exporting.finished = true;
          this.setState({ exporting });
        }
      );
    }
  }

  NoArtboardSelected() {
    return (
      <section id="no-artboard">
        <h1 className="title">No Artboard</h1>
        <p className="no-ab-subtitle">
          You must have an artboard selected to use this plugin.
        </p>
        <ul className="no-ab-list">
          <li className="no-ab-item">
            <p className="no-ab-para">
              This Artboard should be empty, as the plugin will be adding and
              deleting elements.
            </p>
          </li>
          <li className="no-ab-item">
            <p className="no-ab-para">
              It's width and height specify the output size and ratio of your
              images; at 1 times scale.
            </p>
          </li>
        </ul>
      </section>
    );
  }

  get exportProgressBar() {
    const { exporting, imports } = this.state;
    const percent = (exporting.itemsExported / imports.files.length) * 100;
    return {
      background: `linear-gradient(to right, #2DEF70 ${percent}%, #EBEBEB 0%)`
    };
  }

  get currentExportingOutputFiles() {
    const { exporting } = this.state;
    return exporting.outputFiles.map((item, index) => (
      <p key={index} className="export-info">
        {item}
      </p>
    ));
  }

  onExportFinishedBtnClick(event) {
    application.editDocument({ editLabel: "ExportX: reset" }, () => {
      this.state.size_origin._rectangle.removeFromParent();
      this.setState({
        exporting: {
          inProgress: false,
          itemsExported: 0,
          outputDirectory: "",
          outputFiles: [],
          finished: false
        },
        size_origin: {
          _rectangleId: "ExportXSize&OriginPreview",
          _rectangle: undefined,
          width: 0,
          height: 0,
          x: 0,
          y: 0
        },
        imports: {
          files: [],
          directory: undefined,
          fromSelection: false,
          glob: undefined
        },
        scales: [1],
        file: {
          name: "",
          prepend: "",
          append: "",
          extension: "",
          illegalCharacter: false,
          overwrite: false,
          embedImages: true,
          minify: true,
          quality: 100
        },
        directory: {
          root: undefined,
          name: undefined,
          illegalCharacter: false
        }
      });
    });
  }

  Exporting() {
    return (
      <div>
        <section className="export-progress">
          <ul className="progress-container">
            <li>{this.state.exporting.itemsExported}</li>
            <li>of</li>
            <li>{this.state.imports.files.length}</li>
          </ul>
          <div className="progress-bar" style={this.exportProgressBar}></div>
        </section>
        <h1>Exporting</h1>
        <h2 className="export-subtitle">Output Directory</h2>
        <p className="export-info">{this.state.exporting.outputDirectory}</p>
        <h2 className="export-subtitle">Output Files</h2>
        <div>{this.currentExportingOutputFiles}</div>
        {this.state.exporting.finished ? (
          <div className="export-finished">
            <button
              className="finished-btn hoverable"
              onClick={this.onExportFinishedBtnClick.bind(this)}
              uxp-variant="cta"
            >
              Finished
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  dispatchClickEvent(event) {
    if (event.target && event.key === "Enter") {
      event.target.click();
    }
  }

  get listOfImports() {
    let title;
    const { imports } = this.state;
    const length = imports.files.length;
    const list = imports.files.map((file, index) => {
      const name = this.getFileName(file);
      const extension = this.getFileExtension(file);
      return (
        <li key={index} className="imports-list-item">
          ({extension}) {name}
        </li>
      );
    });

    if (length !== 1) {
      title = length > 0 ? `${length} Imports` : `No Imports`;
    } else {
      title = "1 Import";
    }

    return (
      <div className="imports-list-container">
        <h2 className="imports-list-title">
          <span>{title}</span>
          <span className="import-list-toggle" />
        </h2>
        <ul className="list">{list}</ul>
      </div>
    );
  }

  get extensionNameCheckBoxes() {
    const { file } = this.state;

    const updateFileValue = event => {
      event.target.id === "quality"
        ? (file[event.target.id] = Math.round(event.target.value))
        : (file[event.target.id] = !file[event.target.id]);
      this.setState({ file });
    };

    if (file.extension === "SVG") {
      return (
        <li>
          <label style={{ width: "100%" }}>
            <span className="file-label">Embed Images</span>
            <input
              id="embedImages"
              type="checkbox"
              checked={file.embedImages}
              onClick={updateFileValue}
            />
          </label>
          <label style={{ width: "100%" }}>
            <span className="file-label">Minify</span>
            <input
              id="minify"
              type="checkbox"
              checked={file.minify}
              onClick={updateFileValue}
            />
          </label>
        </li>
      );
    } else if (file.extension === "JPG") {
      return (
        <li>
          <label>
            <span
              style={{ display: "block", width: "100%" }}
              className="file-label"
            >
              Quality — {file.quality}
            </span>
            <input
              min="1"
              max="100"
              type="range"
              id="quality"
              style={{ width: "100px" }}
              defaultValue={file.quality}
              onChange={updateFileValue}
            />
          </label>
        </li>
      );
    } else {
      return null;
    }
  }

  Form() {
    return (
      <form onSubmit={this.onExportX.bind(this)}>
        <section id="import">
          <h1 className="title">Import</h1>
          <ul className="import-container">
            <li className="import-from-selection">
              <button
                className="import btn"
                onClick={this.importFromSelection.bind(this)}
                uxp-variant={
                  this.state.imports.fromSelection ? "cta" : "primary"
                }
              >
                From Selection
              </button>
            </li>
            <li className="import-selection-separator">or</li>
            <li className="import-from-directory">
              <button
                className="import btn"
                onClick={this.setImportDirectory.bind(this)}
                uxp-variant={this.state.imports.directory ? "cta" : "primary"}
              >
                From Directory
              </button>
              <label
                className={
                  this.state.imports.directory
                    ? "importing-glob glob-active"
                    : "importing-glob glob-inactive"
                }
              >
                <span className="glob-title">
                  {this.state.imports.directory ? "Glob (required)" : "Glob"}
                </span>
                <input
                  className="glob-field"
                  placeholder="*.png"
                  disabled={!this.state.imports.directory}
                  onBlur={this.importFromDirectory.bind(this)}
                  onChange={this.onGlobPatternChange.bind(this)}
                />
              </label>
            </li>
          </ul>
          {this.listOfImports}
        </section>
        <section id="image-params">
          <h1 className="title">Size & Origin</h1>
          <div className="container">
            <div className="image-item">
              <label className="item-label">
                <span className="label-span">W</span>
                <input
                  id="width"
                  className="label-input"
                  placeholder="0"
                  defaultValue={this.state.size_origin.width}
                  onBlur={this.onImageSizeChange.bind(this)}
                />
              </label>
              <label className="item-label">
                <span className="label-span">H</span>
                <input
                  id="height"
                  className="label-input"
                  placeholder="0"
                  defaultValue={this.state.size_origin.height}
                  onBlur={this.onImageSizeChange.bind(this)}
                />
              </label>
            </div>
            <div className="image-item">
              <label className="item-label">
                <span className="label-span">X</span>
                <input
                  id="x"
                  className="label-input"
                  placeholder="0"
                  defaultValue={this.state.size_origin.x}
                  onBlur={this.onImageSizeChange.bind(this)}
                />
              </label>
              <label className="item-label">
                <span className="label-span">Y</span>
                <input
                  id="y"
                  className="label-input"
                  placeholder="0"
                  defaultValue={this.state.size_origin.y}
                  onBlur={this.onImageSizeChange.bind(this)}
                />
              </label>
            </div>
          </div>
        </section>
        <section id="export-scales">
          <h1 className="title">Scales</h1>
          <div className="scales-container">
            <ul id="scales-list" className="scales-list">
              {this.state.scales.map((value, index) => (
                <li key={index}>
                  <label className="scales-label">
                    <span className="scales-span">@</span>
                    <input
                      className="scales-input"
                      type="number"
                      type="number"
                      defaultValue={this.state.scales[index]}
                      onBlur={event => {
                        const value = parseFloat(event.target.value);
                        if (!isNaN(value)) {
                          const { scales } = this.state;
                          scales[index] = value;
                          this.setState({ scales: [...scales] });
                        }
                      }}
                    />
                    <div
                      className="trash-btn hoverable"
                      onPointerEnter={e => {
                        if (this.state.scales.length > 1) {
                          this.pointerEnter(e);
                        }
                      }}
                      onPointerLeave={this.pointerLeave}
                      onKeyDownCapture={this.dispatchClickEvent}
                      onClick={event => {
                        const { scales } = this.state;
                        if (scales.length > 1) {
                          scales.splice(index, 1);
                          this.setState({ scales: [...scales] });
                        }
                      }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M0,0H24V24H0Z" fill="none" />
                        <path
                          fill={
                            this.state.scales.length > 1
                              ? "#2D96EF"
                              : "lightgray"
                          }
                          d="M15.5,4l-1-1h-5l-1,1H5V6H19V4ZM6,19a2.006,2.006,0,0,0,2,2h8a2.006,2.006,0,0,0,2-2V7H6Zm2-5V9h8V19H8Zm8,0h0Z"
                        />
                      </svg>
                    </div>
                  </label>
                </li>
              ))}
            </ul>
            <div
              tabIndex="0"
              id="add-scale"
              className="plus-btn hoverable"
              onPointerEnter={this.pointerEnter}
              onPointerLeave={this.pointerLeave}
              onFocus={this.pointerEnter}
              onBlur={this.pointerLeave}
              onKeyDownCapture={this.dispatchClickEvent}
              onClick={event => {
                const { scales } = this.state;
                const nextScales = [...scales, scales[scales.length - 1] + 1];
                this.setState({ scales: nextScales });
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g transform="translate(-401 -778)">
                  <rect
                    width="21"
                    height="21"
                    fill="none"
                    transform="translate(401 778)"
                  />
                  <path
                    fill="#2D96EF"
                    transform="translate(404 781)"
                    d="M7,18V11H0V7H7V0h4V7h7v4H11v7Z"
                  />
                </g>
              </svg>
            </div>
          </div>
        </section>
        <section id="export-name">
          <h2 className="title">File Name</h2>
          {this.state.file.illegalCharacter ? (
            <p className="warning">Invalid Character</p>
          ) : null}
          <div className="file-container">
            <ul className="file-list">
              <li className="file-name">
                <label className="file-label">Name</label>
                <input
                  id="name"
                  placeholder="%n"
                  className="file-input"
                  onChange={this.onFileNameChange.bind(this)}
                />
              </li>
              <li className="file-scale">
                <label className="file-label">Scale</label>
                <div className="scale-params">
                  <input
                    id="prepend"
                    className="prepend"
                    placeholder="@"
                    onChange={this.onFileNameChange.bind(this)}
                  />
                  <i className="scale-variable">%s</i>
                  <input
                    id="append"
                    className="append"
                    placeholder="x"
                    onChange={this.onFileNameChange.bind(this)}
                  />
                </div>
              </li>
              <li className="file-extension">
                <label className="file-label">Extension</label>
                <select
                  id="extension"
                  className="select"
                  onChange={this.onFileNameChange.bind(this)}
                >
                  <option defaultValue="..." value="PNG">
                    PNG
                  </option>
                  <option value="JPG">JPG</option>
                  <option value="PDF">PDF</option>
                  <option value="SVG">SVG</option>
                </select>
              </li>
              {this.extensionNameCheckBoxes}
            </ul>
            <div className="preview">
              <h4>Preview</h4>
              <p className="preview-text">{this.fileNamePreview}</p>
            </div>
          </div>
        </section>
        <section id="export-directory">
          <h2 className="title">Export</h2>
          <ul className="directory-container">
            <li className="export-list-item">
              <p className="directory-item-title subtitle">Root Directory</p>
              <p
                className="directory-name"
                onClick={this.selectExportDirectory.bind(this)}
              >
                {this.state.directory.root
                  ? this.state.directory.root.name
                  : ""}
              </p>
              <div
                tabIndex="0"
                className="directory-finder hoverable"
                onFocus={this.pointerEnter}
                onBlur={this.pointerLeave}
                onPointerEnter={this.pointerEnter}
                onPointerLeave={this.pointerLeave}
                onKeyDownCapture={this.dispatchClickEvent}
                onClick={this.selectExportDirectory.bind(this)}
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clipPath="url(#clip-Artboard_1)">
                    <path
                      fill="#2D96EF"
                      transform="translate(257 357)"
                      d="M-239-345a2,2,0,0,1,2-2,2,2,0,0,1,2,2,2,2,0,0,1-2,2A2,2,0,0,1-239-345Zm-8,0a2,2,0,0,1,2-2,2,2,0,0,1,2,2,2,2,0,0,1-2,2A2,2,0,0,1-247-345Zm-8,0a2,2,0,0,1,2-2,2,2,0,0,1,2,2,2,2,0,0,1-2,2A2,2,0,0,1-255-345Z"
                    />
                  </g>
                </svg>
              </div>
            </li>
            <li>
              <label
                className={
                  this.state.directory.root
                    ? "has-root-directory"
                    : "no-root-directory"
                }
              >
                <span className="directory-item-title subtitle">
                  {this.state.directory.root
                    ? "New Directory (optional)"
                    : "New Directory"}
                </span>
                {this.state.directory.illegalCharacter ? (
                  <p className="warning">Invalid Character</p>
                ) : null}
                <input
                  placeholder="%n"
                  disabled={this.state.directory.root ? false : true}
                  className="directory-item-input"
                  onChange={this.setNewExportDirectory.bind(this)}
                />
              </label>
            </li>
          </ul>
        </section>
        <footer className="footer">
          <button
            type="submit"
            disabled={this.exportDisabled}
            uxp-variant="cta"
          >
            Begin Exporting
          </button>
        </footer>
      </form>
    );
  }

  render() {
    if (this.state.artboard === undefined) return <this.NoArtboardSelected />;
    if (this.state.exporting.inProgress) return <this.Exporting />;
    return <this.Form />;
  }
}

module.exports = ExportX;
