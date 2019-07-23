<template>
  <div class="main-content-wrapper">
    <!-- MAIN TOOLS -->
    <div class="tools" :style="{top: toolsPos.top, left: toolsPos.left}">
      <!-- HISTORY -->
      <q-btn icon="mdi-undo" round @click="undo()" :disable="!canUndo" :size="$q.screen.lt.sm ? 'sm' : 'md'"/>
      <q-btn icon="mdi-redo" round @click="redo()" :disable="!canRedo" :size="$q.screen.lt.sm ? 'sm' : 'md'"/>
      <!-- PHOTO -->
      <q-btn
        icon="mdi-camera"
        :color="modes.mode === 'photo' ? 'primary' : 'dark'"
        round
        :size="$q.screen.lt.sm ? 'sm' : 'md'"
        @click="setPhoto()"
      >
        <q-tooltip>
          Add an image
        </q-tooltip>
      </q-btn>
      <!-- PAGE -->
      <q-btn
        icon="mdi-file-image"
        :color="modes.mode === 'page' ? 'primary' : 'dark'"
        round
        :size="$q.screen.lt.sm ? 'sm' : 'md'"
        @click="setPage()"
      />
      <!-- DRAW -->
      <q-btn
        icon="mdi-pencil"
        :color="modes.mode === 'draw' ? 'primary' : 'dark'"
        round
        :size="$q.screen.lt.sm ? 'sm' : 'md'"
        @click="setDraw()"
      />
      <!-- SHAPE -->
      <q-btn
        icon="mdi-shape"
        :color="modes.mode === 'shape' ? 'primary' : 'dark'"
        round
        :size="$q.screen.lt.sm ? 'sm' : 'md'"
        @click="setShape()"
      />
    </div>
    <!-- PAGE TEXT EDITOR -->
    <text-editor v-if="activePage && pageDimensions" :print="false" :active="modes.mode === 'page' && modes.subMode === 'text'" :zoom="pageDimensions.zoom" :pageWidth="activePage.pageSize.width" :pageHeight="activePage.pageSize.height" ></text-editor>

    <!-- TEXT LAYER -->
    <!-- <text-editor v-if="activePage" :print="false" :active="true" :zoom="page.zoom" :pageWidth="activePage.pageSize.width" :pageHeight="activePage.pageSize.height" ></text-editor> -->

    <!-- MAIN CONTENT -->
    <div class="main-content">
      <!-- Canvas -->
      <!-- TODO  -->
      <div class="page-ref" ref="page">
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

      <!-- EXTRA TOOLS -->
      <div class="extra-tools" v-if="pageDimensions" key="extra-tools" :style="{top: extraToolsPos.top, right: extraToolsPos.right}">
        <!-- COLORS -->
        <swatches
          :value="color"
          @input="updateColor"
          colors="text-advanced"
          :popover-to="screen.width > screen.height ? 'left' : 'right'"
          :trigger-style="{ width: '30px', height: '30px', borderRadius: '50%' }"
          :disabled="modes.mode === 'page' && modes.subMode === 'text'"
        ></swatches>
        <!-- PAGE TOOLS -->
          <!-- TEXT -->
          <q-btn
            v-if="modes.mode === 'page'"
            icon="mdi-format-text"
            :color="modes.subMode === 'text' ? 'primary' : 'dark'"
            round
            size="sm"
            @click="setText()"
          />
          <!-- BG COLOR -->
          <q-btn
            v-if="modes.mode === 'page'"
            icon="mdi-format-color-fill"
            :color="modes.subMode === 'backgroundColor' ? 'primary' : 'dark'"
            round
            size="sm"
            @click="backgroundColor()"
          />
          <!-- BG IMAGE -->
          <q-btn
            v-if="modes.mode === 'page'"
            key="bgImageButton"
            icon="mdi-image-plus"
            size="sm"
            :color="'dark'"
            round
            @click="addBgPhoto()"
          />
          <!-- REMOVE BG IMAGE -->
          <q-btn
            v-if="modes.mode === 'page'"
            key="bgImageRemoveButton"
            icon="mdi-image-off"
            size="sm"
            :color="'negative'"
            round
            @click="backgroundRemoveImage()"
          />
        <!-- SHAPE TOOLS -->
        <template v-if="modes.mode === 'shape'">
          <!-- MOVE -->
          <q-btn
            icon="mdi-cursor-move"
            :color="modes.subMode === 'select' ? 'primary' : 'dark'"
            round
            size="sm"
            @click="setSelect()"
          />
          <!-- RULER -->
          <q-btn
            icon="mdi-ruler"
            :color="modes.subMode === 'line' ? 'primary' : 'dark'"
            round @click="line()"
            size="sm"
          />
          <!-- FILL OBJ -->
          <q-btn
            icon="mdi-format-color-fill"
            :color="modes.subMode === 'fill' ? 'primary' : 'dark'"
            round
            size="sm"
            @click="fillColor()"
            :disabled="!isSelected"
          />

          <!-- TEXT -->
          <q-btn
            icon="mdi-format-text"
            :color="modes.subMode === 'text' ? 'primary' : 'dark'"
            round
            size="sm"
            @click="canvasText()"
          />
          <!-- TEXT SIZE -->
          <div class="tool-slider" v-if="modes.mode === 'shape' && (modes.subMode === 'text' || modes.subMode === 'selectText')">
            <q-btn size="sm" color="primary" icon="mdi-format-size" round @click="toggleTextSize()"/>
            <div class="q-slider-wrap" v-if="showTextSize">
              <q-slider v-model="text.size" :min="5" :max="100" :step="1" label snap/>
            </div>
          </div>
          <!-- LINE WIDTH -->
          <div class="tool-slider" v-if="modes.mode === 'shape' && modes.subMode === 'line'">
            <q-btn
              size="sm"
              icon="mdi-signal"
              round
              :color="showLineWidth ? 'primary' : 'dark'"
              @click="toggleLineWidth()"
            />
            <div class="q-slider-wrap" v-if="showLineWidth">
              <q-slider v-model="lineObj.width" :min="1" :max="20" :step="1" label snap/>
            </div>
          </div>
          <!-- DELETE OBJ -->
          <q-btn
            size="sm"
            color="negative"
            icon="mdi-delete"
            round
            @click="deleteObj()"
            :disabled="!settings.isSelected"
          />
          <!-- CLEAR -->
          <q-btn icon="mdi-close" round @click="clearCanvas()" size="sm"/>
        </template>

        <!-- PHOTO TOOLS -->
        <template v-if="modes.mode === 'photo'">
          <!-- Add photo -->
          <q-btn
            icon="mdi-camera"
            :color="modes.mode === 'photo' ? 'primary' : 'dark'"
            round
            size="sm"
            @click="addPhoto()"
          >
            <q-tooltip>
              Add an image
            </q-tooltip>
          </q-btn>

          <!-- DELETE OBJ -->
          <q-btn
            size="sm"
            color="negative"
            icon="mdi-delete"
            round
            @click="deleteObj()"
            :disabled="!settings.isSelected"
          />
        </template>

        <!-- DRAW TOOLS -->
        <template v-if="modes.mode === 'draw'">
          <!-- BRUSH -->
          <q-btn
            key="pencil"
            icon="mdi-pencil"
            size="sm"
            :color="modes.subMode === 'brush'? 'primary' : 'dark'"
            round
            @click="setDraw()"
          />
          <!-- ERASER -->
          <q-btn
            key="eraser"
            size="sm"
            :color="modes.subMode === 'eraser' ? 'primary' : 'dark'"
            icon="mdi-eraser"
            round
            @click="setEraser()"
          />
          <!-- BRUSH SIZE -->
          <div class="tool-slider" v-if="modes.subMode === 'brush' || modes.subMode === 'eraser'">
            <q-btn
              size="sm"
              icon="mdi-signal"
              round
              :color="settings.showBrushWidth ? 'primary' : 'dark'"
              @click="toggleBrushWidth()"
            />
            <div class="q-slider-wrap" v-if="settings.showBrushWidth">
              <q-slider v-model="settings.brushWidth" :min="1" :max="50" :step="1" label snap @change="updateBrushWidth(newVal)"/>
            </div>
          </div>
          <!-- CLEAR -->
          <q-btn
            size="sm"
            :color="'dark'"
            icon="mdi-close"
            round
            @click="clearDrawing()"
          />
        </template>
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
import FabricCanvas from './FabricCanvas'

export default {
  name: "Page",
  components: { Swatches, AddImage, TextEditor, DrawingCanvas, FabricCanvas },
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
    toolsPos() {
      let pos = {
        top: 0,
        right: 0
      };
      if (this.pageDimensions) {
        if (this.screen.width < this.screen.height) {
          // Portrait
          pos = {
            top: 0,
            left: 0,
          }
        } else {
          // landscape
          pos = {
            top: '45px',
            left: this.pageDimensions.width+'px',
          }
        }
      }
      return pos;
    },
    extraToolsPos() {
      let pos = {
        top: 0,
        right: 0
      };
      if (this.pageDimensions) {
        if (this.screen.width < this.screen.height) {
          // Portrait
          pos = {
            top: (this.pageDimensions.height + 10) + 'px',
            right: 0,
          }
        } else {
          // landscape
          pos = {
            top: '50px',
            right: (this.screen.width - (this.pageDimensions.width + 300)) + 'px',
          }
        }
      }
      return pos;
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
      const maxWidthRatio = this.$refs.page.clientWidth / this.activePage.pageSize.width;
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

    addHistory() {
      const snapshot = {
        drawingLayer: this.activePage.drawingLayer,
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
      this.saveStory();
    },

    undo() {
      if (this.history.restoreIndex > 0) {
        this.$store.commit('setHistoryRestoreIndex', this.history.restoreIndex - 1);
        this.$store.commit('setHistoryUndo');
        // this.restoreIndex--;

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
        this.$store.commit('setHistoryRestoreIndex', this.history.restoreIndex + 1);
        this.$store.commit('setHistoryUndo');
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
          this.saveStory();
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