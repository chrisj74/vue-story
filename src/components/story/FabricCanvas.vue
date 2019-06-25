<template>
  <div class="canvas-ref" ref="page">
    <div class="canvas-wrapper">
      <div v-if="page" class="canvas-bg-img-wrapper" :style="{width: page.width+'px', height: page.height+'px'}">
        <div v-if="canvas && background.color" class="canvas-bg-img" :style="{backgroundColor: background.color,
          backgroundImage: background.image? 'url('+background.image+')' : 'none',
          width: (canvas.width * (page.zoom / canvas.getZoom())) + 'px',
          height: (canvas.height * (page.zoom / canvas.getZoom())) + 'px',
          top: 0,
          left: 0}">
        </div>
      </div>
      <canvas
        id="storyCanvas"
        ref="canvas"
        key="canvas">
      </canvas>
    </div>
  </div>
</template>

<script>
import { fabric } from "fabric";

export default {
  name: "FabricCanvas",
  data() {
    return {
      page: {
        width: 0,
        height: 0,
        zoom: 1,
        offsetY: 0,
        offsetX: 0
      },
      background: {
        color: null,
        image: false
      },
      isSelected: false,
      isDown: false,
      brush: {
        width: 5,
        active: false
      },
      text: {
        size: 16
      },
      lineObj: {
        width: 5
      },
      color: "#000000",
      canvas: null,
      canUndo: false,
      canRedo: false,
      panning: {
        timer: null,
        active: false
      },

      windowWidth: 1024
    };
  },
  computed: {
    user() {
      return this.$store.getters.user;
    },
    loading() {
      return this.$store.getters.loading;
    },
    story() {
      return this.$store.getters.getStory;
    },
    pages() {
      return this.$store.getters.getPages;
    },
    activePage() {
      return this.$store.getters.getPage;
    },
    insertImage() {
      return this.$store.getters.getInsertImage;
    },
    screen() {
      return this.$store.getters.screen;
    },
    modes() {
      return this.$store.getters.getModes;
    },
    history() {
      return this.$store.getters.getHistory;
    },
    showPlan() {
      return this.$store.getters.showPlan;
    },


  },
  mounted() {
    /** Set page from route */
    if(this.user) {
      const payload = {
          user: this.user,
          storyKey: this.$route.params.id,
          pageKey: this.$route.params.pageId ? this.$route.params.pageId : null
      }
      this.$store.dispatch('setPage', payload);
    }
    const _this = this;
    if (this.activePage && !this.canvas && this.story.id === this.$route.params.id) {
      if (this.activePage.background) {
        this.background.color = this.activePage.background.color;
        this.background.image = this.activePage.background.image;
      }

      if (this.activePage.canvasJson) {
        this.canvasInit();
        this.canvas.loadFromJSON(this.activePage.canvasJson, function() {
          _this.canvas.renderAll.bind(_this.canvas);
          _this.setDefaultZoom();
          _this.addHistory();
        });
      }
    }
    /** Trigger canvas resize on browser resize */

    window.addEventListener("resize", function(event) {
      this.windowWidth = window.innerWidth;
      _this.$nextTick()
          .then(function () {
              // DOM updated
              _this.canvas.setHeight(_this.activePage.pageSize.height);
              _this.canvas.setWidth(_this.activePage.pageSize.width);
              _this.setDefaultZoom();
          })
    });
    this.windowWidth = window.innerWidth;
  },
  methods: {
    canvasInit() {
      /** Main canvas */
      this.canvas = new fabric.Canvas("storyCanvas");
      const _this = this;
      const canvas = this.canvas;

      this.canvas.targetFindTolerance = 4;
      this.canvas.preserveObjectStacking = true;
      canvas.renderAll.bind(canvas);

      /** Canvas events */
      let line;
      const ctx = canvas.getContext("2d");
      this.canvas.on("path:created", function(e) {
        if (_this.modes.subMode === 'eraser') {
          e.path.globalCompositeOperation = "destination-out";
          canvas.renderAll();
        }
        _this.addHistory();
      });
      this.canvas.on("object:moved", () => {
        canvas.renderAll.bind(canvas);
        _this.addHistory();
      });
      this.canvas.on("selection:created", function(o) {
        _this.isSelected = true;
      });
      this.canvas.on("selection:cleared", function(o) {
        _this.isSelected = false;
      });
      /** MOUSE DOWN */
      this.canvas.on("mouse:down", o => {
        _this.isDown = true;
        _this.showtextSize = false;
        _this.showBrushWidth = false;
        _this.showLineWidth = false;
        /** BRUSH */
        if (_this.modes.subMode === "brush") {
          _this.brush.active = true;
        }
        /** SELECT */
        if (_this.modes.subMode === "select") {
          if (canvas.getActiveObject()) {
            _this.isSelected = true;
          } else {
            _this.isSelected = false;
          }
        }
        /** LINE */
        if (_this.modes.subMode === "line") {
          canvas.selection = false;
          const pointer = canvas.getPointer(o.e);
          const points = [pointer.x, pointer.y, pointer.x, pointer.y];
          line = new fabric.Line(points, {
            strokeWidth: _this.lineObj.width,
            fill: _this.color,
            stroke: _this.color,
            originX: "center",
            originY: "center"
          });
          canvas.add(line);
        }
        /** TEXT */
        if (_this.modes.mode === 'draw' && _this.modes.subMode === "text") {
          if (
            !canvas.getActiveObject() ||
            !canvas.getActiveObject().isEditing
          ) {
            const pointer = canvas.getPointer(o.e);
            const textOptions = {
              fontSize: _this.text.size,
              fill: _this.color,
              left: pointer.x,
              top: pointer.y,
              radius: 10,
              borderRadius: "25px",
              hasRotatingPoint: true,
              lockScalingX: true,
              lockScalingY: true,
              hiddenTextarea: true,
              editingBorderColor: "#999999"
            };
            const text = new fabric.IText("Start typing...", textOptions);
            canvas.add(text).setActiveObject(text);
            text.enterEditing();
            text.selectAll();
            _this.modes.subMode = "selectText";
            _this.addHistory();
          } else {
          }
        }
        /** FILL */
        if (_this.modes.subMode === "fill") {
          const activeObject = canvas.getActiveObject();
          if (activeObject) {
            if (activeObject.stroke) {
              activeObject.set("fill", _this.color);
              activeObject.set("stroke", activeObject.stroke);
            } else if (activeObject.stroke && activeObject.fill) {
              activeObject.set("fill", _this.color);
              activeObject.set("stroke", _this.color);
            }
            canvas.renderAll.bind(canvas);
          }
          _this.addHistory();
        }
      });
      this.canvas.on("mouse:move", o => {
        if (!_this.isDown) return;
        if (_this.modes.subMode === "line") {
          const pointer = canvas.getPointer(o.e);
          line.set({ x2: pointer.x, y2: pointer.y });
          canvas.renderAll();
        }
      });
      this.canvas.on("mouse:up", o => {
        _this.isDown = false;
        canvas.selection = false;
        if (_this.modes.subMode === "line") {
          _this.addHistory();
        }
        if (_this.modes.subMode === "brush") {
          _this.brush.active = false;
        }
      });
      this.canvas.setHeight(this.activePage.pageSize.height);
      this.canvas.setWidth(this.activePage.pageSize.width);
      // this.draw();
    },

    addPage() {
      const payload = {
        user: this.user,
        storyKey: this.$route.params.id,
        pageKey: this.$route.params.pageId ? this.$route.params.pageId : null,
        order: this.pages.length
      };
      this.$store.dispatch("addPage", payload).then(newPage => {
        this.$router.push({ path: newPage });
      });
    },

    shortKeys(e) {
      switch (e.srcKey) {
        case "undoWin":
        case "undoMac":
          this.undo();
          break;
        case "deleteKey":
        case "backspaceKey":
          this.deleteObj();
          break;
      }
    },

    deleteObj() {
      const activeObject = this.canvas.getActiveObject();
      if (activeObject && !activeObject.isEditing) {
        this.canvas.remove(activeObject);
        this.canvas.renderAll.bind(this.canvas);
      }
      this.addHistory();
    },

    setPageSize() {
      this.page.height = this.$refs.page.clientHeight;
      this.page.width = this.$refs.page.clientWidth;
    },

    setDefaultZoom() {
      this.setPageSize();
      const maxHeightRatio = this.page.height / this.canvas.height;
      const maxWidthRatio = this.page.width / this.canvas.width;
      if (maxHeightRatio < maxWidthRatio) {
        this.page.zoom = maxHeightRatio;
        this.canvas.setHeight(this.canvas.height * maxHeightRatio);
        this.canvas.setWidth(this.canvas.width * maxHeightRatio);
        this.canvas.setZoom(maxHeightRatio);
        this.canvas.renderAll();
      } else {
        this.page.zoom = maxWidthRatio;

        this.canvas.setHeight(this.canvas.height * maxWidthRatio);
        this.canvas.setWidth(this.canvas.width * maxWidthRatio);
        this.canvas.setZoom(maxWidthRatio);
      }
      this.scaleBrushWidth();
    },

    setSelect() {
      this.$store.commit('setSubMode', "select");
      this.canvas.isDrawingMode = false;
      this.canvas.forEachObject(function(object) {
        object.selectable = true;
      });
    },

    fillColor() {
      this.$store.commit('setSubMode', "fill");
      this.canvas.isDrawingMode = false;
      this.canvas.forEachObject(function(object) {
        object.selectable = true;
      });
    },

    line() {
      this.canvas.forEachObject(function(object) {
        object.selectable = false;
      });
      this.$store.commit('setSubMode', "line");
      this.canvas.isDrawingMode = false;
    },

    addPhoto() {
      this.$store.commit('setMode', "photo");
      this.imageModal = true;
      this.canvas.isDrawingMode = false;
      this.canvas.forEachObject(function(object) {
        object.selectable = true;
      });
    },

    canvasText() {
      this.$store.commit('setSubMode', "text");
      this.canvas.isDrawingMode = false;
      this.canvas.forEachObject(function(object) {
        object.selectable = true;
      });
    },

    backgroundColor() {
      this.$store.commit('setSubMode', "backgroundColor");
    },

    pageText() {
      this.$store.commit('setSubMode', "text");
      this.textModal = true;
    },

    canvasInsertImage(imageObj) {
      this.imageModal = false;
      this.$store.commit("clearInsertImage");
      this.$store.commit("clearImageSearchResults");

      const canvas = this.canvas;
      const _this = this;
      fabric.Image.fromURL(
        imageObj.webformatURL,
        function(myImg) {
          myImg.set({
            left: canvas.width / 4,
            top: 100,
            width: imageObj.webformatWidth,
            height: imageObj.webformatHeight
          });
          myImg.scaleToWidth(canvas.width / 2);
          canvas.add(myImg);
          _this.addHistory();
        },
        { crossOrigin: "Anonymous" }
      );
    },

    backgroundAddImage(imageObj) {
      this.imageModal = false;
      this.$store.commit("clearInsertImage");
      this.$store.commit("clearImageSearchResults");
      this.background.image = imageObj.webformatURL;
      this.addHistory();
      this.$store.commit('setSubMode', "text");
    },

    setDraw() {
      this.canvas.forEachObject(function(object) {
        object.selectable = true;
      });
      this.$store.commit('setMode', "draw");
      this.$store.commit('setSubMode', "brush");
      this.setFreeBrush();
    },

    setEraser() {
      this.$store.commit('setSubMode', "eraser");
      this.canvas.freeDrawingBrush.color = "rgba(255,255,255,.95)";
    },

    setFreeBrush() {
      this.canvas.isDrawingMode = true;
      this.canvas.freeDrawingBrush.color = this.color;
      this.canvas.freeDrawingBrush.width = this.brush.width;
    },

    setPage() {
      this.$store.commit('setMode', "page");
      this.$store.commit('setSubMode', "text");
      this.canvas.isDrawingMode = false;
    },

    setBackground() {
      this.$store.commit('setSubMode', "background");
      this.canvas.isDrawingMode = false;
    },

    addBgPhoto() {
      this.imageModal = true;
      this.$store.commit('setSubMode', "background");
      this.canvas.forEachObject(function(object) {
        object.selectable = true;
      });
      this.canvas.isDrawingMode = false;
    },

    saveStory() {
      const jsonObj = this.canvas.toJSON(["globalCompositeOperation"]);
      if (this.activePage) {
        const payload = {
          user: this.user,
          storyKey: this.$route.params.id,
          pageKey: this.activePage.id,
          page: {
            json: JSON.stringify(jsonObj),
            background: {
              color: this.background.color,
              image: this.background.image
            }
          }
        };
        this.$store.dispatch("updatePage", payload);
      }
    },

    addHistory() {
      const snapshot = {
        json: this.canvas.toJSON(["globalCompositeOperation"]),
        background: {
          color: this.background.color,
          image: this.background.image
        }
      };
      if (this.history.restoreIndex === this.history.states.length - 1) {
        this.$store.dispatch('historyAdd', snapshot);
      } else {
        this.$store.dispatch('historySlice', snapshot);
      }
      this.canUndo = this.history.states.length > 1;
      this.canRedo = this.history.restoreIndex < this.history.states.length - 1;
      this.saveStory();
    },

    undo() {
      if (this.history.restoreIndex > 0) {
        this.$store.commit('setHistoryRestoreIndex', this.history.restoreIndex - 1)
        // this.restoreIndex--;
        this.canvas.loadFromJSON(this.history.states[this.history.restoreIndex].json);
        this.canvas.renderAll.bind(this.canvas);
        this.background = {
          color: this.history.states[this.history.restoreIndex].background.color,
          image: this.history.states[this.history.restoreIndex].background.image
        };
        this.saveStory();
        if (this.history.states.length === this.history.restoreIndex + 1) {
          this.canredo = false;
        } else {
          this.canRedo = true;
        }
        if (this.history.restoreIndex === 0) {
          this.canUndo = false;
        }
      }
    },

    redo() {
      if (this.history.restoreIndex < this.history.states.length - 1) {
        this.$store.commit('setHistoryRestoreIndex', this.history.restoreIndex + 1)
        // this.restoreIndex++;
        this.canvas.loadFromJSON(this.history.states[this.history.restoreIndex].json);
        this.canvas.renderAll.bind(this.canvas);
        this.background = {
          color: this.history.states[this.history.restoreIndex].background.color,
          image: this.history.states[this.history.restoreIndex].background.image
        };
        this.saveStory();
        if (this.history.states.length === this.history.restoreIndex + 1) {
          this.canRedo = false;
          this.canUndo = true;
        }
      } else {
        this.canUndo = true;
        this.canRedo = false;
      }
    },

    clearCanvas() {
      this.canvas.clear();
      this.addHistory();
    },

    scaleBrushWidth() {
      this.canvas.freeDrawingBrush.width = Math.ceil(
        this.brush.width * this.canvas.getZoom()
      );
    },

    toggleTextSize() {
      this.showTextSize = !this.showTextSize;
    },

    toggleBrushWidth() {
      this.showBrushWidth = !this.showBrushWidth;
    },

    toggleLineWidth() {
      this.showLineWidth = !this.showLineWidth;
    },
  },
  watch: {
    $route: {
      handler: function(from, to) {
        if (
          (from.params.id === to.params.id &&
            from.params.pageId != to.params.pageId) ||
          !to.params.pageId
        ) {
          // same story new page
          // detroy canvas
          if (this.canvas) {
            this.canvas.dispose();
            this.canvas = null;
            this.background = {
              color: null,
              image: "none"
            };
          }
          // reset history
          this.$state.commit('setHistoryStates', []);
          this.$state.commit('setHistoryRestoreIndex', -1)
          // set activePage
          const payload = {
            user: this.user,
            storyKey: this.$route.params.id,
            pageKey: this.$route.params.pageId
              ? this.$route.params.pageId
              : null
          };
          this.$store.dispatch("setPage", payload);
        }
      },
      deep: true
    },
    brush: {
      handler: function(newBrush, oldVal) {
        if (this.canvas.freeDrawingBrush.width !== newBrush.width) {
          this.canvas.freeDrawingBrush.width = newBrush.width;
        }
      },
      deep: true
    },
    color: {
      handler: function(newColor, oldColor) {
        this.canvas.freeDrawingBrush.color = newColor;
        if (this.modes.mode === "page" && this.modes.subMode === 'backgroundColor') {
          this.background.color = newColor;
          this.addHistory();
        } else if (this.modes.mode === 'draw') {
          if (this.canvas.getActiveObject()) {
            const textObj = this.canvas.getActiveObject();
            textObj.setSelectionStyles({'fill': newColor})
          }
          this.canvas.renderAll();
          this.addHistory();
        }
      }
    },
    text: {
      handler: function(newText, oldText) {
        if (this.canvas.getActiveObject()) {
          const textObj = this.canvas.getActiveObject();
          textObj.setSelectionStyles({'fontSize': this.text.size});''
          this.canvas.renderAll();
          this.addHistory();
        }
      },
      deep: true
    },
    insertImage: {
      handler: function(newImage, oldImage) {
        this.$store.commit('setLoading', false);
        if (newImage && this.modes.mode === "photo") {
          this.canvasInsertImage(newImage);
        } else if (newImage && this.modes.subMode === "background") {
          this.backgroundAddImage(newImage);
        }
      }
    },
    activePage: {
      handler: function(newPage, oldPage) {
        if (!this.canvas && newPage && newPage.canvasJson) {
          this.background.color = this.activePage.background.color;
          this.background.image = this.activePage.background.image;
          this.canvasInit();
          this.canvas.forEachObject(function(object) {
            object.selectable = true;
          });
          this.setFreeBrush();
          const _this = this;
          this.canvas.loadFromJSON(this.activePage.canvasJson, function() {
            _this.canvas.renderAll.bind(_this.canvas);
            _this.setDefaultZoom();
            _this.addHistory();
          });
        } else if (!this.canvas) {
          this.background.color = this.activePage.background.color;
          this.background.image = this.activePage.background.image;
          this.canvasInit();
          this.setDefaultZoom();
          this.addHistory();
        }
      },
      deep: true
    },
    user: {
      handler: function(newUser) {
        if (!this.story) {
          const payload = {
            user: this.user,
            storyKey: this.$route.params.id
          };
          this.$store.dispatch("setStory", payload);
          this.storiesSet = true;
        }
      }
    }
  }
};
</script>

<style lang="stylus">
@import '~variables'
.main-content-wrapper {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: stretch;
  margin-right: 90px;
  width: calc(100vw - 240px);
  position: relative;
}
.main-content {
  width: 100%;
  display: flex;
  flex-wrap: nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  flex-grow: 1;
  position: relative;
}

.canvas-ref {
  display: flex;
  height: calc(100vh - 20px);
  overflow: hidden;
  max-width: calc(100vw - 190px);
  flex-grow: 2;
}

.canvas-wrapper {
  position: relative;
  overflow: hidden;
  /* max-height: calc(100vh - 70px);
    overflow: hidden; */
}
.canvas-bg-img-wrapper {
  position: absolute;
  overflow: hidden;
  top: 0;
  left: 0;
  width: 842px;
}
.canvas-bg-img {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100%;
  z-index: 1;
  background: #fff;
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center center;
}

#storyCanvas {
  position: relative;
  z-index: 2;
  height: 595px;
}
.upper-canvas {
  z-index: 2
}

.color-picker-input {
  visibility: none;
}

.tools {
  position: absolute;
  z-index: 3;
  display: flex;
  flex-direction: column;
}

.tools > * {
  margin-right: 5px;
  margin-bottom: 5px;
}

.extra-tools {
  width: 60px;
  display: flex;
  position: absolute;
  z-index: 3;
  flex-direction: column;
  justify-content: center;
}

.extra-tools > * {
  margin-bottom: 5px;
}

.pan-controls {
  display: inline-flex;
  display: none;
  font-size: 2em;
  position: absolute;
  bottom: 10px;
  right: 10px;
  z-index: 999;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.8);
}

.zoom-controls {
  display: inline-flex;
  display: none;
  font-size: 2em;
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 999;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.8);
}
.zoom-controls .disabled {
  color: #bbb;
}

.color-btn {
  width: 42px;
  height: 42px;
  border: none;
  padding: 0;
  border-radius: 50%;
  cursor: pointer;
}

.tool-slider {
  position: relative;
}
.tool-slider .q-slider-wrap {
  position: absolute;
  width: 200px;
  right: 60px;
  top: 0;
  z-index: 1000;
}

.zoom-in {
  cursor: zoom-in;
}

.zoom-out {
  cursor: zoom-out;
}

.pan-up {
  cursor: n-resize;
}

.pan-left {
  cursor: w-resize;
}

.pan-right {
  cursor: e-resize;
}

.pan-down {
  cursor: s-resize;
}

.reset-canvas {
  cursor: crosshair;
}
.text-modal {
  display: flex;
  justify-content: center;
  align-items: center;
}
@media (orientation: portrait) {
  .main-content-wrapper {
    margin-right: 0;
    width: 100%;
  }
  .main-content {
    display: block;
  }
  .canvas-ref {
    padding-left: 0;
    max-width: calc(100vw - 10px);
        height: calc(100vh - 220px);
  }
  .tools {
    display: flex;
    justify-content: center;
    position: relative;
    flex-direction: row;
  }
  .extra-tools {
    flex-direction: row;
    width: 100%;
  }
  .tool-slider .q-slider-wrap {
    width: 200px;
    left: -20px;
    right: auto;
    top: -30px;
    z-index: 1000;
  }
}
@media(max-width: $breakpoint-md) and (orientation: landscape) {
  .canvas-ref {
    height: calc(100vh - 20px);
  }
  .tools {
    margin-top: -25px;
  }
}
@media(max-width: $breakpoint-md) and (orientation: portrait) {
  .main-content-wrapper {
    max-height: calc(100vh - 170px);
    overflow: hidden;
  }
  .canvas-ref {
    height: calc(100vh - 250px);
  }
}
</style>