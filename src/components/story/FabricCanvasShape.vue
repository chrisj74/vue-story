<template>
  <canvas
    :id="type === 'photo' ? 'photoCanvas' : 'shapeCanvas'"
    ref="canvas"
    key="canvas"
    v-if="pageDimensions"
    :class="{'active-canvas' : modes.mode === type}"
    :style="{
      width: pageDimensions.width + 'px',
      height: pageDimensions.height + 'px',
      top: 0,
      left: 0,
    }">
  </canvas>
</template>

<script>
import { fabric } from "fabric-with-gestures";

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
      if (this.activePage.photoLayer && this.activePage.photoLayer.photoCanvasJson && this.type === 'photo') {
        console.log('canvas=', this.activePage.photoLayer.photoCanvasJson );
        this.canvasInit();
        this.canvas.loadFromJSON(this.activePage.photoLayer.photoCanvasJson, function() {
          _this.canvas.renderAll.bind(_this.canvas);
          _this.setSize();
        });
      } else if (this.activePage.shapeLayer && this.activePage.shapeLayer.shapeCanvasJson && this.type === 'shape') {
        this.canvasInit();
        this.canvas.loadFromJSON(this.activePage.shapeLayer.shapeCanvasJson, function() {
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
      console.log('canvasInit type =', this.type);
      /** Main canvas */
      if (this.type === 'photo') {
        this.canvas = new fabric.Canvas("photoCanvas");
      } else if (this.type === 'shape') {
        this.canvas = new fabric.Canvas("shapeCanvas");
      }

      const _this = this;
      const canvas = this.canvas;

      this.canvas.targetFindTolerance = 4;
      this.canvas.preserveObjectStacking = true;
      canvas.renderAll.bind(canvas);

      /** Canvas events */
      let line, rect, circle;
      let x = 0;
      let y = 0;
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
        _this.closeSlider();
        _this.saveStory();
      });
      this.canvas.on("selection:created", function(o) {
        const newSetting = {
          isSelected: true
        };
        _this.$store.commit('setSettings', newSetting);
        if(o.selected[0].opacity) {
          const newOpacity = {
          imageOpacity: o.selected[0].opacity,
          showImageOpacity: false
        };
        _this.$store.commit('setSettings', newOpacity);
        }
      });
      this.canvas.on("selection:cleared", function(o) {
        const newSetting = {
          isSelected: false,
          showImageOpacity: false
        };
        _this.$store.commit('setSettings', newSetting);
      });
      /** MOUSE DOWN */
      this.canvas.on("mouse:down", o => {
        _this.isDown = true;
        _this.showtextSize = false;
        _this.showBrushWidth = false;
        _this.showLineWidth = false;
        const pointer = canvas.getPointer(o.e);
        const points = [pointer.x, pointer.y, pointer.x, pointer.y];
        x = pointer.x;
        y = pointer.y;
        /** SELECT */
        if (_this.modes.subMode === "select") {
          if (canvas.getActiveObject()) {
            const newSetting = {
              isSelected: true
            };
            _this.$store.commit('setSettings', newSetting);
          } else {
            const newSetting = {
              isSelected: false,
              showImageOpacity: false
            };
            _this.$store.commit('setSettings', newSetting);
          }
        }
        /** LINE */
        if (_this.modes.subMode === "line") {
          canvas.selection = false;

          line = new fabric.Line(points, {
            strokeWidth: _this.settings.lineWidth,
            fill: _this.settings.color,
            stroke: _this.settings.color,
            originX: "center",
            originY: "center"
          });
          canvas.add(line);
        }
        /** RECT */
        if (_this.modes.subMode === "rect") {
          canvas.selection = false;

          rect = new fabric.Rect({
            width: 0,
            height: 0,
            left: x,
            top: y,
            strokeWidth: _this.settings.lineWidth,
            fill: 'rgba(0,0,0,0)',
            stroke: _this.settings.color,
          });

          canvas.add(rect);
          canvas.setActiveObject(rect);
        }

        /** CIRCLE */
        if (_this.modes.subMode === "circle") {
          canvas.selection = false;

          circle = new fabric.Circle({
            radius: 0,
            left: x,
            top: y,
            strokeWidth: _this.settings.lineWidth,
            fill: 'rgba(0,0,0,0)',
            stroke: _this.settings.color,
          });

          canvas.add(rect);
          canvas.setActiveObject(rect);

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
        const pointer = canvas.getPointer(o.e);
        if (_this.modes.subMode === "line") {
          line.set({ x2: pointer.x, y2: pointer.y });
          canvas.renderAll();
        }
        if (_this.modes.subMode === "rect") {
          const w = Math.abs(pointer.x - x),
          h = Math.abs(pointer.y - y);
          if (!w || !h) {
              return false;
          }
          rect.set('width', w).set('height', h);
          canvas.renderAll();
        }

        if (_this.modes.subMode === "circle") {
          const w = Math.abs(pointer.x - x),
          h = Math.abs(pointer.y - y);
          if (!w || !h) {
              return false;
          }
          circle.set('radius', w > h ? w : h);
          canvas.renderAll();
        }
      });
      this.canvas.on("mouse:up", o => {
        _this.isDown = false;
        canvas.selection = false;
        if (_this.modes.subMode === "line" || _this.modes.subMode === "rect"  || _this.modes.subMode === "circle") {
          if (rect) {
            rect.setCoords();
            // rect = null;
          } else if (circle) {
            circle.setCoords();
            // circle = null;
          }
          _this.$store.commit('setSubMode', "select");
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
      /* this.canvas.forEachObject(function(object) {
        object.cornerSize = 30 / _this.pageDimensions.zoom;
      }); */
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

    saveStory() {
      const jsonObj = this.canvas.toJSON(["globalCompositeOperation"]);
      if (this.activePage) {
        let page;
        if (this.type === 'photo') {
          page = {
            photoLayer: {
              photoCanvasJson: JSON.stringify(jsonObj),
            }
          }
        } else if (this.type === 'shape') {
          page = {
            shapeLayer: {
              shapeCanvasJson: JSON.stringify(jsonObj),
            }
          }
        }
        const payload = {
          user: this.user,
          storyKey: this.$route.params.id,
          pageKey: this.activePage.id,
          restoreIndex: true,
          page: page
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

    closeSlider() {
      const payload = {
        showImageOpacity: false,
      };
      this.$store.commit('setSettings', payload);
    }
  },
  /** WATCHERS */
  watch: {
    $route: {
      handler: function(from, to) {
        if (!from.params.id || (from.params.id !== to.params.id)) {
            // changed story
            if (!this.canvas) {
              console.log('changed story');
                this.canvasInit();
            }
        }
        if (
          ( from.params.pageId != to.params.pageId) ||
          ( !to.params.pageId && from.params.id !== to.params.id)
        ) {
          //  new page
          // detroy canvas
          if (this.canvas) {
            console.log('changed page');
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
        if(this.modes.mode !== this.type
            && this.canvas
            && this.canvas.getActiveObject()) {
          this.canvas.discardActiveObject();
          this.canvas.renderAll();
        } else if (this.modes.mode === this.type) {
          // this.canvas.calcOffset();
        }
        if (this.modes.mode !== 'photo' && this.settings.showImageOpacity) {
          this.closeSlider();
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
          if (this.toolAction === 'deleteObj' && this.modes.mode === this.type) {
            this.deleteObj();
          }
        }

      }
    },

    insertImage: {
      handler: function(newImage, oldImage) {
        if (this.type === 'photo') {
          console.log('insert image watcher');
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
      }
    },

    activePage: {
      handler: function(newPage, oldPage) {
        if (!this.canvas && newPage && newPage.photoLayer.photoCanvasJson && this.type === 'photo') {
          console.log('active page init canvas', newPage);
          this.canvasInit();
          this.canvas.forEachObject(function(object) {
            object.selectable = true;
          });
          const _this = this;
          this.canvas.loadFromJSON(this.activePage.photoLayer.photoCanvasJson, function() {
            _this.canvas.renderAll.bind(_this.canvas);
          });
          this.setSize();
        } else if (!this.canvas && newPage && newPage.shapeLayer && newPage.shapeLayer.shapeCanvasJson && this.type === 'shape') {
          this.canvasInit();
          this.canvas.forEachObject(function(object) {
            object.selectable = true;
          });
          const _this = this;
          this.canvas.loadFromJSON(this.activePage.shapeLayer.shapeCanvasJson, function() {
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
          if (this.activePage && this.activePage.photoLayer.photoCanvasJson && this.type === 'photo') {
            console.log('page dimensions watcher');
            this.canvasInit();
            this.canvas.forEachObject(function(object) {
              object.selectable = true;
            });
            const _this = this;
            this.canvas.loadFromJSON(this.activePage.photoLayer.photoCanvasJson, function() {
              _this.canvas.renderAll.bind(_this.canvas);
            });
            this.setSize();
          } else if (this.activePage && this.activePage.shapeLayer.shapeCanvasJson && this.type === 'shape') {
            this.canvasInit();
            this.canvas.forEachObject(function(object) {
              object.selectable = true;
            });
            const _this = this;
            this.canvas.loadFromJSON(this.activePage.shapeLayer.shapeCanvasJson, function() {
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

.canvas-container {
  position:absolute !important;
  top: 0;
  left: 0;
}

#photoCanvas {
  position: relative;
  z-index: 1;

}
#shapeCanvas {
  position: relative;
  z-index: 1;
}
.upper-canvas {
  z-index: 2;
}


</style>