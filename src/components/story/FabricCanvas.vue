<template>
  <canvas
    id="storyCanvas"
    ref="canvas"
    key="canvas"
    v-if="pageDimensions"
    :style="{
      width: pageDimensions.width + 'px',
      height: pageDimensions.height + 'px',
      top: 0,
      left: 0,
    }">
  </canvas>
</template>

<script>
import { fabric } from "fabric";

export default {
  name: "FabricCanvas",
  props: ['type'],
  data() {
    return {
      isDown: false,
      color: "#000000",
      canvas: null,
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
    pageDimensions() {
      return this.$store.getters.getPageDimensions;
    },
    settings() {
      return this.$store.getters.getSettings;
    },
    toolAction() {
      return this.$store.getters.getToolAction;
    },

  },
  mounted() {
    const _this = this;
    if (this.activePage && !this.canvas) {
      if (this.activePage.photoLayer.photoCanvasJson) {
        this.canvasInit();
        this.canvas.loadFromJSON(this.activePage.photoLayer.photoCanvasJson, function() {
          _this.canvas.renderAll.bind(_this.canvas);
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
          })
    });
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
        _this.saveStory();
      });
      this.canvas.on("object:moved", () => {
        canvas.renderAll.bind(canvas);
        _this.saveStory();
      });
      this.canvas.on("selection:created", function(o) {
        const newSetting = {
          isSelected: true
        };
        _this.$store.commit('setSettings', newSetting);
      });
      this.canvas.on("selection:cleared", function(o) {
        const newSetting = {
          isSelected: false
        };
        _this.$store.commit('setSettings', newSetting);
      });
      /** MOUSE DOWN */
      this.canvas.on("mouse:down", o => {
        _this.isDown = true;
        _this.showtextSize = false;
        _this.showBrushWidth = false;
        _this.showLineWidth = false;
        /** SELECT */
        if (_this.modes.subMode === "select") {
          if (canvas.getActiveObject()) {
            const newSetting = {
              isSelected: true
            };
            _this.$store.commit('setSettings', newSetting);
          } else {
            const newSetting = {
              isSelected: false
            };
            _this.$store.commit('setSettings', newSetting);
          }
        }
        /** LINE */
        if (_this.modes.subMode === "line") {
          canvas.selection = false;
          const pointer = canvas.getPointer(o.e);
          const points = [pointer.x, pointer.y, pointer.x, pointer.y];
          line = new fabric.Line(points, {
            strokeWidth: _this.lineObj.width,
            fill: _this.settings.color,
            stroke: _this.settings.color,
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
            _this.saveStory();
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
          _this.saveStory();
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
          _this.saveStory();
        }
        if (_this.modes.subMode === "brush") {
          _this.brush.active = false;
        }
      });
      this.canvas.setHeight(this.pageDimensions.height);
      this.canvas.setWidth(this.pageDimensions.width);
      // this.draw();
    },

    setSelect() {
      const newSetting = {
        isSelected: true,
      };
      this.$store.commit('setSettings', newSetting);
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
          _this.saveStory();
        },
        { crossOrigin: "Anonymous" }
      );
    },

    setCanvas() {
      this.canvas.forEachObject(function(object) {
        object.selectable = true;
      });
    },

    setEraser() {
      this.$store.commit('setSubMode', "eraser");
      this.canvas.freeDrawingBrush.color = "rgba(255,255,255,.95)";
    },

    saveStory() {
      const jsonObj = this.canvas.toJSON(["globalCompositeOperation"]);
      if (this.activePage) {
        const payload = {
          user: this.user,
          storyKey: this.$route.params.id,
          pageKey: this.activePage.id,
          page: {
            photoLayer: {
              photoCanvasJson: JSON.stringify(jsonObj),
            }
          }
        };
        this.$store.dispatch("updatePage", payload);
      }
    },

    addHistory() {
      const snapshot = {
        photoLayer: {
          photoCanvasJson: this.canvas.toJSON(["globalCompositeOperation"]),
        }
      };
      if (this.history.restoreIndex === this.history.states.length - 1) {
        this.$store.dispatch('historyAdd', snapshot);
      } else {
        this.$store.dispatch('historySlice', snapshot);
      }
      this.saveStory();
    },

    clearCanvas() {
      this.canvas.clear();
      this.saveStory();
      this.$store.commit('setToolAction', null);
    },


    deleteObj() {
      const activeObject = this.canvas.getActiveObject();
      console.log('activeObject =', activeObject );
      if (activeObject && !activeObject.isEditing) {
        this.canvas.remove(activeObject);
        this.canvas.renderAll.bind(this.canvas);
      }
      this.saveStory();
      this.$store.commit('setToolAction', null);
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
          }
        }
      },
      deep: true
    },

    settings: {
      handler: function(newSettings, oldSettings) {
        if (this.settings.color !== this.color) {
          this.color = this.settings.color;
        }
      },
      deep: true
    },

    modes: {
      handler: function(newMode, oldMode) {

      },
      deep: true
    },

    toolAction: {
      handler: function(newAction, oldAction) {
        console.log('mode=', this.modes.mode, ' type=', this.type)
        if (this.modes.mode === this.type) {
          if (this.toolAction === 'clearCanvas') {
            this.clearCanvas();
          }
          if (this.toolAction === 'deleteObj') {
            this.deleteObj();
          }
        }

      }
    },

    insertImage: {
      handler: function(newImage, oldImage) {
        this.$store.commit('setLoading', false);
        const newSetting = {
          showImageModal: false,
        };
        this.$store.commit('setSettings', newSetting);
        if (newImage && this.modes.mode === "photo") {
          this.canvasInsertImage(newImage);
        }
      }
    },

    activePage: {
      handler: function(newPage, oldPage) {
        if (!this.canvas && newPage && newPage.photoLayer.photoCanvasJson) {
          this.canvasInit();
          this.canvas.forEachObject(function(object) {
            object.selectable = true;
          });
          const _this = this;
          this.canvas.loadFromJSON(this.activePage.photoLayer.photoCanvasJson, function() {
            _this.canvas.renderAll.bind(_this.canvas);
          });
        } else if (!this.canvas) {
          this.canvasInit();
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

.page-ref {
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
  .page-ref {
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
  .page-ref {
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
  .page-ref {
    height: calc(100vh - 250px);
  }
}
</style>