<template>
  <div class="main-content-wrapper">
    <!-- MAIN TOOLS -->
    <main-tools></main-tools>

    <!-- MAIN CONTENT -->
    <div class="main-content">
      <div class="page-ref" ref="page">
        <!-- PAGE TEXT EDITOR -->
        <div
          v-for="(textLayer, layerIndex) in activePage.textLayer"
          :key="'toolbar'+layerIndex"
          class="text-toolbar-wrapper"
          :style="{width: (pageDimensions.width) + 'px', left: (91)}">
          <div :id="'toolbar'+layerIndex" v-if="textLayerActive" :style="{width: (pageDimensions.width) + 'px'}" v-show="settings.activeEditor === layerIndex">
            <span class="ql-format-group">
              <button type="button" class="ql-bold"></button>
              <button type="button" class="ql-italic"></button>
              <button type="button" class="ql-underline" v-if="$q.screen.gt.sm"></button>
              <button type="button" class="ql-blockquote" v-if="$q.screen.gt.sm"></button>
              <select class="ql-align"></select>

              <button type="button" class="ql-list" value="ordered"></button>
              <button type="button" class="ql-list" value="bullet"></button>

              <select class="ql-size"></select>
              <select class="ql-font" v-if="$q.screen.gt.sm"></select>

              <select class="ql-color"></select>
              <select class="ql-background"></select>

              <button class="ql-link"></button>
              <button class="ql-video"></button>
            </span>
          </div>
        </div>
        <div
          v-if="pageDimensions"
          :style="{
          transform: 'scale('+pageDimensions.zoom+')',
          height: (activePage.pageSize.height - 50)+'px',
          width: activePage.pageSize.width+'px',
          pointerEvents: textLayerActive ? 'all' : 'none',
          userSelect: textLayerActive ? 'all' : 'none'}"
          class="text-layer">
          <template v-for="(textLayer, index) in activePage.textLayer">
            <text-editor
              v-if="textLayer.width"
              :key="index"
              :print="false"
              :active="textLayerActive"
              :zoom="pageDimensions.zoom"
              :pageWidth="activePage.pageSize.width"
              :pageHeight="activePage.pageSize.height"
              :textLayerIndex="index" >
            </text-editor>
          </template>
        </div>
        <!-- Canvas -->
        <div v-if="pageDimensions" class="canvas-wrapper" :style="{width: pageDimensions.width+'px', height: pageDimensions.height+'px'}">
          <div class="canvas-bg-img-wrapper" :style="{width: pageDimensions.width+'px', height: pageDimensions.height+'px'}">
            <div v-if="background.color" class="canvas-bg-img" :style="{
              backgroundColor: background.color,
              backgroundImage: background.image? 'url('+background.image+')' : 'none',
              width: pageDimensions.width + 'px',
              height: pageDimensions.height + 'px',
              top: 0,
              left: 0}">
            </div>
            <fabric-canvas type="photo"></fabric-canvas>
            <drawing-canvas></drawing-canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- EXTRA TOOLS -->
    <extra-tools></extra-tools>

    <!-- IMAGE MODAL -->
    <q-modal
      v-if="pageDimensions"
      v-model="settings.showImageModal"
      :content-css="{minWidth: '350px', height: '90vh', maxWidth: '100%', width: pageDimensions.width+'px'}">
      <add-image v-if="modes.mode === 'photo' || modes.subMode === 'background'"></add-image>
    </q-modal>
    <!-- SHORTCUTS -->
    <span
      v-if="modes.subMode !== 'text' && !showPlan"
      v-shortkey="{undoWin:['ctrl', 'z'], undoMac:['meta', 'z'], deleteKey:['del'], backspaceKey:['backspace']}"
      @shortkey="shortKeys($event)"
    ></span>
  </div>
</template>

<script>
import { fabric } from "fabric";
import Swatches from "vue-swatches";
import "vue-swatches/dist/vue-swatches.min.css";
import AddImage from "./PixabaySearch";
import TextEditor from "./TextEditor";
// import FabricCanvas from './FabricCanvas';
import DrawingCanvas from './DrawingCanvas';
import FabricCanvas from './FabricCanvas';
import MainTools from './MainTools';
import ExtraTools from './ExtraTools';

export default {
  name: "Page",
  components: { Swatches, AddImage, TextEditor, DrawingCanvas, FabricCanvas, MainTools, ExtraTools },
  data() {
    return {
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
      canUndo: false,
      canRedo: false,
      imageModal: false,
      textModal: false,

      showTextSize: false,
      showLineWidth: false,
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
    pageDimensions() {
      return this.$store.getters.getPageDimensions;
    },
    settings() {
      return this.$store.getters.getSettings;
    },
    toolAction() {
      return this.$store.getters.getToolAction;
    },
    textLayerActive() {
      return this.modes.mode === 'page' && this.modes.subMode === 'text'
    }
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
    if (this.activePage && !this.pageDimensions && this.story.id === this.$route.params.id) {
      if (this.activePage.background) {
        this.background.color = this.activePage.background.color;
        this.background.image = this.activePage.background.image;
      }

      if (this.activePage) {
        _this.setDefaultZoom();
      }
    }
    /** Trigger page resize on browser resize */

    window.addEventListener("resize", function(event) {
      this.windowWidth = window.innerWidth;
      _this.$nextTick()
          .then(function () {
              // DOM updated
              _this.setDefaultZoom();
          })
    });
    this.windowWidth = window.innerWidth;
  },
  methods: {
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

    setDefaultZoom() {
      // this.setPageSize();
      const maxHeightRatio = this.$refs.page.clientHeight / this.activePage.pageSize.height;
      let maxWidthRatio = this.$refs.page.clientWidth / this.activePage.pageSize.width;
      maxWidthRatio = maxWidthRatio > 1.5 ? 1.5 : maxWidthRatio;
      let dimensions;
      if (maxHeightRatio < maxWidthRatio) {
        dimensions = {
          height: (this.activePage.pageSize.height * maxHeightRatio),
          width: (this.activePage.pageSize.width * maxHeightRatio),
          zoom: maxHeightRatio,
        }
      } else {
        dimensions = {
          height: (this.activePage.pageSize.height * maxWidthRatio),
          width: (this.activePage.pageSize.width * maxWidthRatio),
          zoom: maxWidthRatio,
        }
      }
      dimensions = {
        height: (this.activePage.pageSize.height * maxWidthRatio),
        width: (this.activePage.pageSize.width * maxWidthRatio),
        zoom: maxWidthRatio,
      }

      this.$store.commit('setPageDimensions', dimensions);
    },

    fillColor() {
      this.$store.commit('setSubMode', "fill");
    },

    line() {
      this.$store.commit('setSubMode', "line");
    },

    addPhoto() {
      this.$store.commit('setMode', "photo");
      const newSetting = {
        showImageModal: true,
      };
      this.$store.commit('setSettings', newSetting);
    },

    canvasText() {
      this.$store.commit('setSubMode', "text");
    },

    backgroundColor() {
      this.$store.commit('setSubMode', "backgroundColor");
    },

    pageText() {
      this.$store.commit('setSubMode', "text");
      this.textModal = true;
    },

    backgroundAddImage(imageObj) {
      this.imageModal = false;
      this.$store.commit("clearInsertImage");
      this.$store.commit("clearImageSearchResults");
      this.background.image = imageObj.webformatURL;
      this.savestory();
      this.$store.commit('setSubMode', "text");
      const newSetting = {
        showImageModal: false,
      };
      this.$store.commit('setSettings', newSetting);
    },

    backgroundRemoveImage() {
      this.background.image = null;
      this.saveStory();
    },

    setPhoto() {
      this.$store.commit('setMode', "photo");
      this.$store.commit('setSubMode', "select");
    },

    setDraw() {
      this.$store.commit('setMode', "draw");
      this.$store.commit('setSubMode', "brush");
    },

    setShape() {
      this.$store.commit('setMode', "shape");
      this.$store.commit('setSubMode', "line");
    },

    setEraser() {
      this.$store.commit('setSubMode', "eraser");
    },

    setPage() {
      this.$store.commit('setMode', "page");
      this.$store.commit('setSubMode', "text");
    },

    setText() {
      this.$store.commit('setSubMode', "text");
    },

    setBackground() {
      this.$store.commit('setSubMode', "background");
    },

    addBgPhoto() {
      const newSetting = {
        showImageModal: true,
      };
      this.$store.commit('setSettings', newSetting);
      this.$store.commit('setSubMode', "background");
    },

    /** ACTIONS */

    addTextBlock() {
      const payload = {
        user: this.user,
        storyKey: this.$route.params.id,
        pageKey: this.activePage.id,
        index: this.activePage.textLayer.length,
        textLayer:  {
          text: '',
          x: 50,
          y: 25,
          width: (200),
          height: (200)
        }
      };
      this.$store.dispatch('updatePageText', payload);
      this.$store.commit('setToolAction', null);
    },

    updateBrushWidth(newVal) {
      const payload = {
        brushWidth: newVal
      };
      this.$store.commit('setSettings', payload);
    },

    updateColor(newColor) {
      const payload = {
        color: newColor
      };
      this.$store.commit('setSettings', payload);
    },

    clearDrawing() {
      this.$store.commit('setToolAction', 'clearDrawing');
    },

    deleteObj() {
      this.$store.commit('setToolAction', 'deleteObj');
    },

    saveStory() {
      if (this.activePage) {
        const payload = {
          user: this.user,
          storyKey: this.$route.params.id,
          pageKey: this.activePage.id,
          restoreIndex: true,
          page: {
            background: {
              color: this.background.color,
              image: this.background.image
            }
          }
        };
        this.$store.dispatch("updatePage", payload);
      }
    },

    toggleTextSize() {
      this.showTextSize = !this.showTextSize;
    },

    toggleBrushWidth() {
      const payload = {
        showBrushWidth: !this.settings.showBrushWidth
      };
      this.$store.commit('setSettings', payload);
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
          console.log('changed page');
          // same story new page
          // reset history
          this.$store.commit('setHistoryStates', []);
          this.$store.commit('setHistoryRestoreIndex', -1)
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

    toolAction: {
      handler: function(newAction, oldAction) {
        if (this.toolAction === 'addTextBlock') {
          this.addTextBlock();
        }
      },
      deep: true
    },

    color: {
      handler: function(newColor, oldColor) {
        if (this.modes.mode === "page" && this.modes.subMode === 'backgroundColor') {
          this.background.color = newColor;
          this.saveStory();
        }
      }
    },

    insertImage: {
      handler: function(newImage, oldImage) {
        this.$store.commit('setLoading', false);
        if (newImage && this.modes.subMode === "background") {
          this.backgroundAddImage(newImage);
        }
      }
    },

    activePage: {
      handler: function(newPage, oldPage) {
        if (!this.pageDimensions && this.activePage.pageSize) {
          this.setDefaultZoom();
        }
        if (this.background.color !== this.activePage.background.color
          || this.background.image !== this.activePage.background.image) {
          this.background.color = this.activePage.background.color;
          this.background.image = this.activePage.background.image;
          // this.saveStory();
        }
      },
      deep: true
    },

    history: {
      handler: function(newH, oldH) {
        this.canUndo = this.history.restoreIndex > 0;
        this.canRedo = this.history.restoreIndex < this.history.states.length - 1;
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
  margin: 35px 0 0 0;
  width: calc(100vw - 200px);
  position: relative;
  z-index: 1;
}
.main-content {
  width: 100%;
  display: flex;
  flex-wrap: nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  flex-grow: 1;
  position: relative;
  height: calc(100vh - 20px);
  overflow: auto;
}

.page-ref {
  display: flex;
  max-width: calc(100vw - 150px);
  flex-grow: 2;
}

.text-layer {
  position: absolute;
  z-index: 100;
  top: 40px;
  left: 0;
  transform-origin: top left;
}

.canvas-wrapper {
  position: relative;
  overflow: hidden;
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

.text-toolbar-wrapper {
  position: fixed;
  top: 45px;
  left: 91px;
  width: 100%;
  z-index: 101;
  background: #fff;
  > * {
    &.ql-toolbar.ql-snow  {
      background: #fff;
      position: relative;
      width: 100%;
      display: flex;
      flex-direction: row;
      padding: 0;
      .ql-formats {
        display: flex;
        flex-direction: row;
      }
      .ql-snow .ql-picker-options {
        z-index: 102;
      }
    }
  }
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
  .text-toolbar-wrapper {
    left: 10px;
  }
}
@media(max-width: $breakpoint-md) and (orientation: landscape) {
 /*  .page-ref {
    height: calc(100vh - 20px);
  } */
/*   .tools {
    margin-top: -25px;
  } */
}
@media(max-width: $breakpoint-md) and (orientation: portrait) {
  .main-content-wrapper {
    max-height: calc(100vh - 170px);
    overflow: hidden;
  }
  /* .page-ref {
    height: calc(100vh - 250px);
  } */
}
</style>