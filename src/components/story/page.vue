<template>
  <div class="main-content-wrapper">
    <!-- MAIN TOOLS -->
    <main-tools></main-tools>

    <!-- MAIN CONTENT -->
    <div class="main-content" ref="mainContent">
      <div class="page-ref" ref="page">
        <!-- PAGE TEXT EDITOR -->
        <template v-if="pageDimensions">
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
                <select class="ql-font" v-if="$q.screen.gt.sm">
                  <option selected>Normal</option>
                  <option value="schoolbell">Handwriting</option>
                </select>

                <select class="ql-color"></select>
                <select class="ql-background"></select>

                <button class="ql-link"></button>
                <button class="ql-video"></button>
                <button :id="'table'+layerIndex"><i class="mdi mdi-table"></i></button>
              </span>
            </div>
          </div>
        </template>
        <div
          v-if="pageDimensions"
          :style="{
          zoom: pageDimensions.zoom,
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
              :zoom="pageDimensions.zoom"
              :pageWidth="activePage.pageSize.width"
              :pageHeight="activePage.pageSize.height"
              :textLayerIndex="index" >
            </text-editor>
          </template>
        </div>
        <!-- Canvas -->
        <div v-if="pageDimensions" ref="canvasWrapper" class="canvas-wrapper" :style="{width: pageDimensions.width+'px', height: pageDimensions.height+'px'}">
          <div class="canvas-bg-img-wrapper" :style="{width: pageDimensions.width+'px', height: pageDimensions.height+'px'}">
            <div v-if="activePage.background" class="canvas-bg-img" :style="{
              backgroundColor: activePage.background.color,
              backgroundImage: activePage.background.image? 'url('+activePage.background.image+')' : 'none',
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

    <!-- scrollers -->
    <div class="page-scrollers" v-if="pageDimensions && pageDimensions.height > pageHeight">
      <div class="scroll-btn">
        <button
          class="q-btn inline relative-position q-btn-item non-selectable q-btn-round q-focusable q-hoverable bg-dark text-white"
          :style="{fontSize: $q.screen.lt.sm ? '14px' : '14px'}"
          v-on:mousedown="startScroll('up', true)"
          v-on:mouseup="stopScroll()"
        >
          <q-icon name="mdi-chevron-up"></q-icon>
        </button>
      </div>
      <div class="scroll-btn">
        <button
          class="q-btn inline relative-position q-btn-item non-selectable q-btn-round q-focusable q-hoverable bg-dark text-white"
          :style="{fontSize: $q.screen.lt.sm ? '14px' : '14px'}"
          v-on:mousedown="startScroll('down', true)"
          v-on:mouseup="stopScroll()"
        >
        <q-icon name="mdi-chevron-down"></q-icon>
        </button>
      </div>
    </div>

    <!-- IMAGE MODAL -->
    <q-modal
      v-if="pageDimensions"
      v-model="settings.showImageModal"
      :content-css="{minWidth: '350px', height: '90vh', maxWidth: '100%', width: pageDimensions.width+'px'}">
      <add-image v-if="modes.mode === 'photo' || modes.subMode === 'background'"></add-image>
    </q-modal>
    <!-- SHORTCUTS -->
    <span
      v-if="modes.subMode !== 'text' && modes.mode !== 'photo' && !showPlan"
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
import { setTimeout } from 'timers';

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
      canUndo: false,
      canRedo: false,
      imageModal: false,
      textModal: false,

      showTextSize: false,
      showLineWidth: false,
      windowWidth: 1024,
      maxHeightRatio: 0,
      maxWidthRatio: 0,
      pageHeight: 0,
      scrolling: false,
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
      return this.modes.mode === 'text'; // && this.modes.subMode === 'text'
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
    if (this.activePage && !this.pageDimensions) {
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

    /** SETUP */

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
      this.pageHeight = this.$refs.page.clientHeight;
      this.maxHeightRatio = this.$refs.page.clientHeight / this.activePage.pageSize.height;
      this.maxWidthRatio = this.$refs.page.clientWidth / this.activePage.pageSize.width;

      let dimensions;
      if (this.maxHeightRatio < this.maxWidthRatio) {
        dimensions = {
          maxWidthRatio: this.maxWidthRatio,
          maxHeightRatio: this.maxHeightRatio,
          height: (this.activePage.pageSize.height * this.maxHeightRatio),
          width: (this.activePage.pageSize.width * this.maxHeightRatio),
          zoom: this.maxHeightRatio,
        }
      } else {
        dimensions = {
          maxWidthRatio: this.maxWidthRatio,
          maxHeightRatio: this.maxHeightRatio,
          height: (this.activePage.pageSize.height * this.maxWidthRatio),
          width: (this.activePage.pageSize.width * this.maxWidthRatio),
          zoom: this.maxWidthRatio,
        }
      }

      this.$store.commit('setPageDimensions', dimensions);
    },

    setZoom(dir) {
      let newZoom = this.pageDimensions.zoom;
      if (dir === 'inc' && this.maxWidthRatio) {
        if (this.pageDimensions.zoom < (this.maxWidthRatio - 0.1)) {
          newZoom = this.pageDimensions.zoom + 0.1;
        } else if (this.pageDimensions.zoom < this.maxWidthRatio) {
          newZoom = this.maxWidthRatio;
        }
      } else {
        if (this.pageDimensions.zoom > (this.maxHeightRatio + 0.1)) {
          newZoom = this.pageDimensions.zoom - 0.1
        } else if (this.pageDimensions.zoom > this.maxHeightRatio) {
          newZoom = this.maxHeightRatio;
        }
      }
      if (newZoom !== this.pageDimensions.zoom){
        /** Only reset if changed */
        const dimensions = {
          height: (this.activePage.pageSize.height * newZoom),
          width: (this.activePage.pageSize.width * newZoom),
          zoom: newZoom,
        }
        this.$store.commit('setPageDimensions', dimensions);
      }
      this.$store.commit('setToolAction', null);
    },

    /** ACTIONS */

    backgroundAddImage(imageObj) {
      this.imageModal = false;
      this.$store.commit("clearInsertImage");
      this.$store.commit("clearImageSearchResults");
      this.background.image = imageObj.webformatURL;
      this.saveStory();
      this.$store.commit('setSubMode', "text");
      const newSetting = {
        showImageModal: false,
      };
      this.$store.commit('setSettings', newSetting);
    },

    backgroundRemoveImage() {
      this.background.image = null;
      this.saveStory();
      this.$store.commit('setToolAction', null);
    },

    setBackgroundColor() {
      this.background.color = this.settings.color;
      this.saveStory();
      this.$store.commit('setToolAction', null);
    },

    addBgPhoto() {
      const newSetting = {
        showImageModal: true,
      };
      this.$store.commit('setSettings', newSetting);
      this.$store.commit('setSubMode', "background");
    },

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
          height: (200),
          borderWidth: 0,
          borderColor: '#ffffff',
          opacity: 0,
          backgroundColor: '#ffffff',
          delta: []
        }
      };
      this.$store.dispatch('updatePageText', payload);
      this.$store.commit('setToolAction', null);
    },

    deleteTextBlock() {
      const payload = {
        user: this.user,
        storyKey: this.$route.params.id,
        pageKey: this.activePage.id,
        index: this.settings.activeEditor,
        textLayer:  null
      };
      this.$store.dispatch('updatePageText', payload);
      this.$store.commit('setToolAction', null);
    },

    /** UTILITIES */

    startScroll(dir, init) {
      if (init) {
        this.scrolling = true;
      }
      if (this.scrolling) {
        if (dir === 'down'
        && this.$refs.mainContent.scrollTop < (this.$refs.canvasWrapper.clientHeight - this.$refs.mainContent.clientHeight)) {
          this.$refs.mainContent.scrollTop += 20;
        } else if (dir === 'up'
        && this.$refs.mainContent.scrollTop > 0) {
          this.$refs.mainContent.scrollTop -= 20;
        }
        const _this = this;
        const _dir = dir;
        setTimeout(function() {
          _this.startScroll(_dir, false)
        }, 50)
      }
    },

    stopScroll() {
      this.scrolling = false;
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
          const settingsPayload = {
            showThumbs: false,
          };
          this.$store.commit('setSettings', settingsPayload);
        }
      },
      deep: true
    },

    toolAction: {
      handler: function(newAction, oldAction) {
        if (this.toolAction === 'addTextBlock') {
          this.addTextBlock();
        }
        if (this.toolAction === 'deleteTextBlock') {
          this.deleteTextBlock();
        }
        if (this.toolAction === 'backgroundRemoveImage') {
          this.backgroundRemoveImage()
        }
        if (this.toolAction === 'setBackgroundColor') {
          this.setBackgroundColor();
        }
        if (this.toolAction === 'zoomIn') {
          this.setZoom('inc');
        }
        if (this.toolAction === 'zoomOut') {
          this.setZoom('dec');
        }
      },
      deep: true
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
        if ((!this.pageDimensions && this.activePage.pageSize)
        || (oldPage.pageSize.height !== newPage.pageSize.height)
        || (oldPage.pageSize.width !== newPage.pageSize.width)) {
          this.setDefaultZoom();
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
@import '~variables';
.main-content-wrapper {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: stretch;
  margin: 60px 0 0 0;
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
  height: calc(100vh - 80px);
  overflow: auto;
}

.page-ref {
  display: flex;
  max-width: calc(100vw - 160px);
  flex-grow: 2;
  align-self: stretch;
  height: calc(100vh - 100px);
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
  left: 110px;
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
      .ql-picker.ql-font {
        span[data-label="Handwriting"]::before {
          font-family: "Schoolbell", cursive;
        }
      }
    }
  }
}

.page-scrollers {
  position: fixed;
  right: 3px;
  bottom: 3px;
  z-index: 100;
  .scroll-btn:last-child {
    margin-top: 10px;
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
    max-width: calc(100vw - 57px);
  }
  .text-toolbar-wrapper {
    left: 10px;
  }
}
@media(max-width: $breakpoint-md) and (orientation: portrait) {
  .main-content-wrapper {
    max-height: calc(100vh - 100px);
  }
  .page-ref {
    max-width: calc(100vw - 40px);
  }
}

@media(max-width: $breakpoint-xs) and (orientation: portrait) {
  body.mobile {
    .page-ref {
      height: calc(100vh - 150px);
    }
  }

}
</style>