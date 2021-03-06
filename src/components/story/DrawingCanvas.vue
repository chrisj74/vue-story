<template>
<div
  class="drawing-canvas-wrapper"
  :class="{inactive: modes.mode !== 'draw'}"
  :style="{cursor: modes.mode === 'draw' ? 'url(&quot;data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAxElEQVQoU1WPMWqEUBCGv0EL3z1S7AmWNF5AJJU2KQTfBazSBcF2t0mTVhBLYSG4J1gsFoTXLjlFWkkUw8AW63Q/3zf/MAKwrusbYJdl2Xme9wdcgaOI9KLQOXcoioJhGDDGkKYpTdPo7l6FWxiGO4WPU1UVZVl+yDzPq+/7G6ghjmP6vj9rw2yM8aZp2khJktB13UmFS5ZlYdu2G6Gua/I8f1fhBfjSm+M4EgQBURRhrf0GnuX+5h54BZ6AX8ABnyLy8w9lUFCmj9QjewAAAABJRU5ErkJggg==&quot;) 3 3, auto' : 'default'}">
  <canvas
    id="drawing-canvas"
    v-if="pageDimensions"
    :style="{
      width: pageDimensions.width + 'px',
      height: pageDimensions.height + 'px',
      top: 0,
      left: 0,
    }"
  >

  </canvas>
</div>
</template>

<script>
import SignaturePad from 'signature_pad';

export default {
  name: "DrawingCanvas",
  data() {
    return {
      canvasWrapper: null,
      showSvg: true,
      bgOpacity: 0.5,
      drawingCanvas: null,
      drawingPad: null,
      ctx: null,
      previewClass: 'hidden',
      previewData: null,
      pen: {
        penColor: '#000000',
        penWidth: 4,
      },
      dataCache: null,
    }
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
    window.addEventListener("resize", function(event) {
      _this.resizeCanvas();
    });

    if (!this.drawingPad && this.pageDimensions) {
      this.initCanvas();
    }
  },
  methods: {
    initCanvas() {
      var timer;
      var _this = this;
      this.drawingCanvas = document.querySelector("#drawing-canvas");
      this.drawingPad = new SignaturePad(this.drawingCanvas, {
        backgroundColor: 'rgba(255, 255, 255, 0)',
        penColor: _this.settings.color,
        maxWidth: _this.settings.brushWidth * _this.pageDimensions.zoom,
        minDistance: 1,
        dotSize: _this.getDotSize(),
        throttle: 16,
        onBegin: function() {
          const payload = {
            showBrushWidth: false
          };
          _this.$store.commit('setSettings', payload)
        },
        onEnd: function() {
          _this.dataCache = this.toDataURL('image/png', 1);
          _this.saveStory();
        }
      });
      this.resizeCanvas()
    },

    getDotSize() {
      const minDot = 1 * this.pageDimensions.zoom
      let dotSize = (this.settings.brushWidth * this.pageDimensions.zoom) * 0.6;
      return dotSize > minDot ? dotSize : minDot;
    },

    resizeCanvas() {
      var ratio =  Math.max(window.devicePixelRatio || 1, 1);
      this.ctx = this.drawingCanvas.getContext("2d");
      this.drawingCanvas.width = this.pageDimensions.width * ratio;
      this.drawingCanvas.height = this.pageDimensions.height  * ratio;
      this.drawingPad.fromDataURL(this.activePage.drawingLayer.drawingCanvasImage);
      this.dataCache = this.activePage.drawingLayer.drawingCanvasImage;

      this.ctx.scale(ratio, ratio);
    },

    clearDrawing() {
      this.drawingPad.clear();
      this.dataCache = this.drawingPad.toDataURL('image/png', 1);
      this.saveStory();
      this.$store.commit('setToolAction', null);
    },

    saveStory() {
      if (this.activePage) {
        const payload = {
          user: this.user,
          storyKey: this.$route.params.id,
          pageKey: this.activePage.id,
          restoreIndex: true,
          page: {
            background: this.activePage.background,
            drawingLayer: {
              drawingCanvasImage: this.dataCache,
              penWidth: this.pen.penWidth,
              penColor: this.pen.penColor,
            }
          }
        };
        this.$store.dispatch("updatePage", payload);
      }
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
          if (!this.drawingPad) {
            this.initCanvas();
          } else {
            this.drawingPad.clear();
          }
        }
      },
      deep: true
    },
    activePage: {
      handler: function(newPage, oldPage) {
        if (!this.drawingPad && this.pageDimensions) {
          this.initCanvas();
        } else if (newPage.drawingLayer && (newPage.drawingLayer.drawingCanvasImage !== this.dataCache)) {
          this.resizeCanvas();
        }

      },
      deep: true
    },
    settings: {
      handler: function(newSettings, oldSettings) {
        if (this.settings.brushWidth * this.pageDimensions.zoom !== this.drawingPad.maxWidth) {
          this.drawingPad.maxWidth = this.settings.brushWidth * this.pageDimensions.zoom;
          this.drawingPad.dotSize = this.getDotSize();
        }
        if (this.settings.color !== this.drawingPad.penColor) {
          this.drawingPad.penColor = this.settings.color;
        }
      },
      deep: true
    },
    pageDimensions: {
      handler: function(newDimensions, oldDimensions) {
        if (this.settings.brushWidth * this.pageDimensions.zoom !== this.drawingPad.maxWidth) {
          this.drawingPad.maxWidth = this.settings.brushWidth * this.pageDimensions.zoom;
          this.drawingPad.dotSize = this.getDotSize();
        }
        if (newDimensions.zoom !== oldDimensions.zoom) {
          this.resizeCanvas();
        }
      },
      deep: true
    },
    modes: {
      handler: function(newMode, oldMode) {
        if (this.modes.subMode === 'eraser' && this.drawingCanvas) {
          var ctx = this.drawingCanvas.getContext('2d');
          ctx.globalCompositeOperation = 'destination-out';
        } else if (this.modes.subMode === 'brush' && this.drawingCanvas) {
          var ctx = this.drawingCanvas.getContext('2d');
          ctx.globalCompositeOperation = 'source-over';
        }
      },
      deep: true
    },
    toolAction: {
      handler: function(newAction, oldAction) {
        if (this.toolAction === 'clearDrawing') {
          this.clearDrawing();
        }
      }
    }
  }
}
</script>

<style lang="stylus">
.drawing-canvas-wrapper {
  -webkit-user-select: none; /* Safari 3.1+ */
  -moz-user-select: none; /* Firefox 2+ */
  -ms-user-select: none; /* IE 10+ */
  user-select: none; /* Standard syntax */
}
#drawing-canvas {
  position: absolute;
  z-index: 3;
  border: solid 1px #ddd;
}
.inactive {
  pointer-events: none;
}
</style>