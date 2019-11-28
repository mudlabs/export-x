const React = require("react");
const ReactDom = require("react-dom");
const scenegraph = require("scenegraph");
const fs = require("uxp").storage.localFileSystem;

class HelloForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      props: props,
      image: { width: null, height: null, x: null, y: null },
      sizes: [1],
      file: {
        name: "",
        prepend: "",
        append: "",
        extension: ""
      },
      directory: {
        name: "",
        path: "",
        folder: null
      }
    };
  }

  get trashIcon() {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M0,0H24V24H0Z" fill="none" />
        <path
          fill="gray"
          d="M15.5,4l-1-1h-5l-1,1H5V6H19V4ZM6,19a2.006,2.006,0,0,0,2,2h8a2.006,2.006,0,0,0,2-2V7H6Zm2-5V9h8V19H8Zm8,0h0Z"
        />
      </svg>
    );
  }

  get plusIcon() {
    return (
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
    );
  }

  get finderIcon() {
    return (
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clip-path="url(#clip-Artboard_1)">
          <path
            fill="#2D96EF"
            transform="translate(257 357)"
            d="M-239-345a2,2,0,0,1,2-2,2,2,0,0,1,2,2,2,2,0,0,1-2,2A2,2,0,0,1-239-345Zm-8,0a2,2,0,0,1,2-2,2,2,0,0,1,2,2,2,2,0,0,1-2,2A2,2,0,0,1-247-345Zm-8,0a2,2,0,0,1,2-2,2,2,0,0,1,2,2,2,2,0,0,1-2,2A2,2,0,0,1-255-345Z"
          />
        </g>
      </svg>
    );
  }

  get fileNamePreview() {
    const { file } = this.state;
    if (file.name.trim() !== "" && file.extension.trim() !== "") {
      return (
        file.name +
        file.prepend +
        this.state.sizes[0] +
        file.append +
        "." +
        file.extension
      );
    } else {
      return "";
    }
  }

  onImageSizeChange(event) {
    try {
      const id = event.target.id;
      const value = parseFloat(event.target.value);
      if (typeof value === "number") {
        scenegraph.selection.items.forEach(item => {
          console.log(item);
        });
        // const { image } = this.state;
        // image[id] = value;
        // this.setState({ image: image });
        // scenegraph.selection.items.forEach(item => {
        //   item.resize(this.state.image[id], this.state.image[id]);
        //   item.placeInParentCoordinates(
        //     { x: 0, y: 0 },
        //     {
        //       x: (item.parent.width - item.width) / 2,
        //       y: item.parent.height - item.height
        //     }
        //   );
        // });
      }
    } catch (error) {
      console.log(error);
    }
  }

  onFileNameChange(event) {
    const { file } = this.state;
    const { id, value } = event.target;
    file[id] = id === "extension" ? value.toLowerCase() : value;
    this.setState({ file: file });
  }

  async selectExportDirectory(event) {
    const folder = await fs.getFolder();
    if (folder.isFolder) {
      this.setState({
        directory: {
          name: folder.name,
          path: folder.nativePath,
          folder: folder
        }
      });
    }
  }

  pointerEnter(event) {
    if (event.target === event.currentTarget) {
      event.target.style.backgroundColor = "#E2E9EF40";
    }
  }

  pointerLeave(event) {
    if (event.target === event.currentTarget) {
      event.target.style.backgroundColor = "#E2E9EF00";
    }
  }

  addScaleItem() {
    const { sizes } = this.state;
    const nextSizes = [...sizes, sizes[sizes.length - 1] + 1];
    this.setState({ sizes: nextSizes });
  }

  removeScaleItem(event) {
    const { sizes } = this.state;
    if (sizes.length > 1) {
      sizes.splice(event.target.itemIndex, 1);
      this.setState({ sizes: [...sizes] });
    }
  }

  render() {
    return (
      <form onSubmit={this.onDoneClick}>
        <section id="image-params">
          <h1 className="title">Size & Origin</h1>
          <div class="container">
            <div class="image-item">
              <label class="item-label">
                <span class="label-span">W</span>
                <input
                  id="width"
                  class="label-input"
                  type="number"
                  placeholder="0"
                  onChange={this.onImageSizeChange.bind(this)}
                />
              </label>
              <label class="item-label">
                <span class="label-span">H</span>
                <input
                  id="height"
                  class="label-input"
                  type="number"
                  placeholder="0"
                  onChange={this.onImageSizeChange.bind(this)}
                />
              </label>
            </div>
            <div class="image-item">
              <label class="item-label">
                <span class="label-span">X</span>
                <input
                  id="x"
                  class="label-input"
                  type="number"
                  placeholder="0"
                  onChange={this.onImageSizeChange.bind(this)}
                />
              </label>
              <label class="item-label">
                <span class="label-span">Y</span>
                <input
                  id="y"
                  class="label-input"
                  type="number"
                  placeholder="0"
                  onChange={this.onImageSizeChange.bind(this)}
                />
              </label>
            </div>
          </div>
        </section>
        <section id="export-scales">
          <h1 class="title">Export Scale</h1>
          <div class="size-container">
            <ul id="sizes-list" class="size-list">
              {this.state.sizes.map((value, index) => (
                <li key={index}>
                  <label class="size-label">
                    <span class="size-span">@</span>
                    <input
                      class="size-input"
                      type="number"
                      type="number"
                      value={this.state.sizes[index]}
                      onChange={event => {
                        const value = parseFloat(event.target.value);
                        if (!isNaN(value)) {
                          const { sizes } = this.state;
                          sizes[index] = value;
                          this.setState({ sizes: [...sizes] });
                        }
                      }}
                    />
                    <div
                      itemkey={index}
                      class="trash-btn hoverable"
                      onClick={this.removeScaleItem.bind(this)}
                    >
                      {this.trashIcon}
                    </div>
                  </label>
                </li>
              ))}
            </ul>
            <div
              id="add-scale"
              class="plus-btn hoverable"
              onPointerEnter={this.pointerEnter}
              onPointerLeave={this.pointerLeave}
              onClick={this.addScaleItem.bind(this)}
            >
              {this.plusIcon}
            </div>
          </div>
        </section>
        <section id="export-name">
          <h2 class="title">File Name</h2>
          <div class="file-container">
            <ul class="file-list">
              <li class="file-name">
                <label class="file-label">Name</label>
                <input
                  id="name"
                  class="file-input"
                  placeholder="Artboard1"
                  onChange={this.onFileNameChange.bind(this)}
                />
              </li>
              <li class="file-extension">
                <label class="file-label">Extension</label>
                <select
                  id="extension"
                  class="select"
                  onChange={this.onFileNameChange.bind(this)}
                >
                  <options selected="selected"></options>
                  <option value="PNG">PNG</option>
                  <option value="JPG">JPG</option>
                </select>
              </li>
              <li class="file-scale">
                <label class="file-label">Scale</label>
                <div class="scale-params">
                  <input
                    id="prepend"
                    class="prepend"
                    placeholder="@"
                    onChange={this.onFileNameChange.bind(this)}
                  />
                  <i class="scale-variable">%s</i>
                  <input
                    id="append"
                    class="append"
                    placeholder="x"
                    onChange={this.onFileNameChange.bind(this)}
                  />
                </div>
              </li>
            </ul>
            <div class="preview">
              <h4>Preview</h4>
              <p class="preview-text">{this.fileNamePreview}</p>
            </div>
          </div>
        </section>
        <section id="export-directory">
          <h2 class="title">Directory</h2>
          <div class="directory-container">
            <p class="directory-item-title">Export Folder</p>
            <p class="directory-name">{this.state.directory.name}</p>
            <div
              class="directory-finder hoverable"
              onPointerEnter={this.pointerEnter}
              onPointerLeave={this.pointerLeave}
              onClick={this.selectExportDirectory.bind(this)}
            >
              {this.finderIcon}
            </div>
          </div>
        </section>
        <footer style={{ margin: "20px 10px" }}>
          <button type="submit" uxp-variant="cta">
            Export
          </button>
        </footer>
      </form>
    );
  }
}

module.exports = HelloForm;
