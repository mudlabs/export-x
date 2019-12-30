# Export X
Adobe XD plugin for streamlined resizing and export of existing image assets.

## How To Use
First, create an Artboard of the size you want your images to be exported as; _(`@ 1x scale`)_. Then work your way down the panel sections. Details of each section can be found below.

---

### Imports
Specifies the images to be imported. You can import ___PNG___ and ___JPG/JPEG___ images. 
* **Form Selection**
  * Imports a selection of images from the file system.
* **From Directory**
  * Specifies the _root_ directory to import images from.
  * Requires a Globbing pattern to specify the import items.


### Size & Origin
Specifies the size and origin each imported image will be set to before being exported.
* **Width and Height**
  * Specifies the **width** and **height** to _resize_ each imported image to.
* **X and Y**
  * Specifies the **x** and **y** origin coordinates to place each imported image; relative to the parent artboard.

### Scales
Specifies the scales you want each imported image exported at.
* Must specify at least one scale.
* Press the trash icon to delete a scale.
* Press the plus icon to add another scale.
* Expects a DPI multiple in the range [0.1, 100], _(e.g. 2.0 for @2x DPI)_.


### File Name
Specifies the file name _(and extension)_, for each exported image.
* **Name**
  * Specifies the base name for each exported image.
  * `%n` maps to the __name__ of the _imported_ file.
  * `%i` maps to the __index__ of the _imported_ file, in the _files_ array.
* **Prepend**
  * Optionally specifies a string to sit between the _base name_ and _scale value_.
* **Append**
  * Optionally specifies a string to attach to the end of the _scale value_.
* **Extension**
  * Specifies the file type for all exported images.
 
  _Based on the Selected Extension_ <br/>
  * **JPG**
    * _Quility_ - Specifies the compression quality in the rang [1, 100]; Defailts to 100.
  * **SVG**
    * _Minify_ - If selected, SVG code should be minified.
    * _Embed Images_ - If selected, bitmap images are stored as _base64_ data inside the SVG file. Else, bitmap images are saved as separate files linked from the SVG code.

### Export
Specifies the export directory for each exported image.
* Specify the _root_ directory for all images to be exported to.
* Optionally specify a new directory name for each export group.
  * `%n` maps to the __name__ of the _imported_ file.
  * `%i` maps to the __index__ of the _imported_ file, in the _files_ array.


---


#### NOTE
 * If the export file names are not unique, the plugin will attempt to resolve this by _prepending_ `%i` to the conflicting file names.
 * If the export directory name is not unique for each image group, all exported images will be exported to the same directory.
