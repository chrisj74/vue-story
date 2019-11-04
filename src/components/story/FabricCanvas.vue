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
          _this.setSize();
        });
      } else {
        this.canvasInit();
        this.setSize();
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
              _this.setSize();
          })
    }, {passive: true});
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
      this.canvas.on("object:modified", () => {
        canvas.renderAll.bind(canvas);
        _this.saveStory();
      });
      this.canvas.on("selection:created", function(o) {
        const newSetting = {
          isSelected: true
        };
        _this.$store.commit('setSettings', newSetting);
        if(o.selected[0].opacity) {
          const newOpacity = {
          imageOpacity: o.selected[0].opacity
        };
        _this.$store.commit('setSettings', newOpacity);
        }
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
      this.canvas.setHeight(this.activePage.pageSize.height);
      this.canvas.setWidth(this.activePage.pageSize.width);
    },

    setSize() {
      this.canvas.setHeight(this.activePage.pageSize.height);
      this.canvas.setWidth(this.activePage.pageSize.width);
      this.canvas.setHeight(this.canvas.height * this.pageDimensions.zoom);
      this.canvas.setWidth(this.canvas.width * this.pageDimensions.zoom);
      this.canvas.setZoom(this.pageDimensions.zoom);
      const _this = this;
      this.canvas.forEachObject(function(object) {
        object.cornerSize = 30 / _this.pageDimensions.zoom;
      });
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
          myImg.lockUniScaling = true;
          myImg.set({
            left: (canvas.width / _this.pageDimensions.zoom) / 4,
            top: 100,
            width: imageObj.webformatWidth,
            height: imageObj.webformatHeight
          });
          myImg.scaleToWidth((canvas.width / _this.pageDimensions.zoom) / 2);
          canvas.add(myImg);
          canvas.renderAll();
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
          restoreIndex: true,
          page: {
            photoLayer: {
              photoCanvasJson: JSON.stringify(jsonObj),
            }
          }
        };
        this.$store.dispatch("updatePage", payload);
        const imagePayload = {
          pageId: this.activePage.id,
          imageData: this.canvas.toDataURL(),
        }
        this.$store.commit('setPageImage', imagePayload);
      }
    },

    clearCanvas() {
      this.canvas.clear();
      this.saveStory();
      this.$store.commit('setToolAction', null);
    },

    deleteObj() {
      const activeObject = this.canvas.getActiveObject();
      if (activeObject && !activeObject.isEditing) {
        this.canvas.remove(activeObject);
        this.canvas.renderAll();
      }
      this.saveStory();
      this.$store.commit('setToolAction', null);
    },
  },
  /** WATCHERS */
  watch: {
    $route: {
      handler: function(from, to) {
        if (!from.params.id || (from.params.id !== to.params.id)) {
            // changed story
            if (!this.canvas) {
                this.photoCanvasInit();
            }
        }
        if (
          ( from.params.pageId != to.params.pageId) ||
          ( !to.params.pageId && from.params.id !== to.params.id)
        ) {
          //  new page
          // detroy canvas
          if (this.canvas) {
            this.canvas.dispose();
            this.canvas = null;
          }
        }
        else {
          console.log('route changed activePge=', this.activePage);
        }
      },
      deep: true
    },

    settings: {
      handler: function(newSettings, oldSettings) {
        if (this.settings.color !== this.color) {
          this.color = this.settings.color;
        }
        if (this.modes.mode === 'photo' && this.canvas && this.canvas.getActiveObject()) {
          const activeObj = this.canvas.getActiveObject();
          if(activeObj.opacity !== newSettings.imageOpacity) {
            activeObj.set({
              opacity: newSettings.imageOpacity
            });
            this.canvas.renderAll();
            this.saveStory();
          }

        }
      },
      deep: true
    },

    modes: {
      handler: function(newMode, oldMode) {
        if(this.modes.mode !== 'photo'
            && this.canvas
            && this.canvas.getActiveObject()) {
          this.canvas.discardActiveObject();
          this.canvas.renderAll();
        }
      },
      deep: true
    },

    toolAction: {
      handler: function(newAction, oldAction) {
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
          showPlanModal: false,
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
          this.setSize();
        } else if (!this.canvas) {
          this.canvasInit();
          this.setSize();
        }
      },
      deep: true
    },

    pageDimensions: {
      handler: function(newDimensions, oldDimensions) {
        if (!this.canvas) {
          if (this.activePage && this.activePage.photoLayer.photoCanvasJson) {
            this.canvasInit();
            this.canvas.forEachObject(function(object) {
              object.selectable = true;
            });
            const _this = this;
            this.canvas.loadFromJSON(this.activePage.photoLayer.photoCanvasJson, function() {
              _this.canvas.renderAll.bind(_this.canvas);
            });
            this.setSize();
          } else {
            this.canvasInit();
            this.setSize();
          }
        } else if (newDimensions.zoom !== oldDimensions.zoom) {
          this.setSize();
        }
      },
      deep: true
    },
  }
};
</script>

<style lang="stylus">
@import '~variables'

#storyCanvas {
  position: relative;
  z-index: 2;
  /* height: 595px; */
}
.upper-canvas {
  z-index: 2
}

</style>