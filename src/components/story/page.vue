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
        :color="mode === 'photo' ? 'primary' : 'dark'"
        round
        :size="$q.screen.lt.sm ? 'sm' : 'md'"
        @click="addPhoto()"
      >
        <q-tooltip>
          Add an image
        </q-tooltip>
      </q-btn>
      <!-- PAGE -->
      <q-btn
        icon="mdi-file-image"
        :color="mode === 'page' ? 'primary' : 'dark'"
        round
        :size="$q.screen.lt.sm ? 'sm' : 'md'"
        @click="setPage()"
      />
      <!-- DRAW -->
      <q-btn
        icon="mdi-pencil"
        :color="mode === 'draw' ? 'primary' : 'dark'"
        round
        :size="$q.screen.lt.sm ? 'sm' : 'md'"
        @click="setDraw()"
      />
    </div>
    <!-- PAGE TEXT EDITOR -->
    <text-editor v-if="canvas && activePage" :print="false" :active="mode === 'page' && subMode === 'text'" :zoom="page.zoom" :pageWidth="activePage.pageSize.width" :pageHeight="activePage.pageSize.height" ></text-editor>

    <!-- TEXT LAYER -->
    <!-- <text-editor v-if="canvas && activePage" :print="false" :active="true" :zoom="page.zoom" :pageWidth="activePage.pageSize.width" :pageHeight="activePage.pageSize.height" ></text-editor> -->

    <!-- MAIN CONTENT -->
    <div class="main-content">
      <!-- Canvas -->
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

      <!-- EXTRA TOOLS -->
      <div class="extra-tools" v-if="canvas" key="extra-tools" :style="{top: extraToolsPos.top, right: extraToolsPos.right}">
        <!-- COLORS -->
        <swatches
          v-model="color"
          colors="text-advanced"
          :popover-to="screen.width > screen.height ? 'left' : 'right'"
          :trigger-style="{ width: '30px', height: '30px', borderRadius: '50%' }"
          :disabled="mode === 'page' && subMode === 'text'"
        ></swatches>
        <!-- PAGE TOOLS -->
          <!-- TEXT -->
          <q-btn
            v-if="mode === 'page'"
            icon="mdi-format-text"
            :color="subMode === 'text' ? 'primary' : 'dark'"
            round
            size="sm"
            @click="addText()"
          />
          <!-- BG COLOR -->
          <q-btn
            v-if="mode === 'page'"
            icon="mdi-format-color-fill"
            :color="subMode === 'backgroundColor' ? 'primary' : 'dark'"
            round
            size="sm"
            @click="backgroundColor()"
          />
          <!-- BG IMAGE -->
          <q-btn
            v-if="mode === 'page'"
            key="bgImageButton"
            icon="mdi-camera"
            size="sm"
            :color="'dark'"
            round
            @click="addBgPhoto()"
          />
        <!-- DRAWING TOOLS -->
        <!-- MOVE -->
        <q-btn
          v-if="mode === 'draw'"
          icon="mdi-cursor-move"
          :color="subMode === 'select' ? 'primary' : 'dark'"
          round
          size="sm"
          @click="setSelect()"
        />
        <!-- RULER -->
        <q-btn v-if="mode === 'draw'" icon="mdi-ruler" :color="subMode === 'line' ? 'primary' : 'dark'" round @click="line()" size="sm"/>
        <!-- FILL OBJ -->
        <q-btn
          v-if="mode === 'draw'"
          icon="mdi-format-color-fill"
          :color="subMode === 'fill' ? 'primary' : 'dark'"
          round
          size="sm"
          @click="fillColor()"
          :disabled="!isSelected"
        />
        <!-- BRUSH -->
        <q-btn
          v-if="mode === 'draw'"
          key="pencil"
          icon="mdi-pencil"
          size="sm"
          :color="subMode === 'brush'? 'primary' : 'dark'"
          round
          @click="setDraw()"
        />
        <!-- ERASER -->
        <q-btn
          v-if="mode === 'draw'"
          key="eraser"
          size="sm"
          :color="subMode === 'eraser' ? 'primary' : 'dark'"
          icon="mdi-eraser"
          round
          @click="setEraser()"
        />
        <!-- TEXT -->
        <q-btn
          v-if="mode === 'draw'"
          icon="mdi-format-text"
          :color="subMode === 'text' ? 'primary' : 'dark'"
          round
          size="sm"
          @click="canvasText()"
        />
        <!-- TEXT SIZE -->
        <div class="tool-slider" v-if="mode === 'draw' && (subMode === 'text' || subMode === 'selectText')">
          <q-btn size="sm" color="primary" icon="mdi-format-size" round @click="toggleTextSize()"/>
          <div class="q-slider-wrap" v-if="showTextSize">
            <q-slider v-model="text.size" :min="5" :max="100" :step="1" label snap/>
          </div>
        </div>
        <!-- BRUSH SIZE -->
        <div class="tool-slider" v-if="mode === 'draw' && (subMode === 'brush' || subMode === 'eraser')">
          <q-btn
            size="sm"
            icon="mdi-signal"
            round
            :color="showBrushWidth ? 'primary' : 'dark'"
            @click="toggleBrushWidth()"
          />
          <div class="q-slider-wrap" v-if="showBrushWidth">
            <q-slider v-model="brush.width" :min="1" :max="50" :step="1" label snap/>
          </div>
        </div>
        <!-- LINE WIDTH -->
        <div class="tool-slider" v-if="mode === 'draw' && subMode === 'line'">
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
          v-if="isSelected"
          size="sm"
          color="negative"
          icon="mdi-delete"
          round
          @click="deleteObj()"
          :disabled="!isSelected"
        />
        <!-- CLEAR -->
        <q-btn v-if="mode === 'draw'" icon="mdi-close" round @click="clearCanvas()" size="sm"/>
      </div>
    </div>

    <!-- IMAGE MODAL -->
    <q-modal
      v-if="canvas"
      v-model="imageModal"
      :content-css="{minWidth: '350px', height: '90vh', maxWidth: '100%', width: canvas.width+'px'}">
      <add-image v-if="mode === 'photo' || subMode === 'background'"></add-image>
    </q-modal>
    <!-- SHORTCUTS -->
    <span
      v-if="mode != 'page' && subMode !== 'text' && !showPlan"
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

export default {
  name: "Page",
  components: { Swatches, AddImage, TextEditor },
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
      mode: "page",
      subMode: "text",
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
      history: [],
      canUndo: false,
      canRedo: false,
      panning: {
        timer: null,
        active: false
      },
      restoreIndex: -1,
      imageModal: false,
      textModal: false,

      showTextSize: false,
      showBrushWidth: false,
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
    showPlan() {
      return this.$store.getters.showPlan;
    },
    toolsPos() {
      let pos = {
        top: 0,
        right: 0
      };
      if (this.canvas) {
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
            left: this.canvas.width+'px',
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
      if (this.canvas) {
        if (this.screen.width < this.screen.height) {
          // Portrait
          pos = {
            top: (this.canvas.height + 10) + 'px',
            right: 0,
          }
        } else {
          // landscape
          pos = {
            top: '50px',
            right: (this.screen.width - (this.canvas.width + 300)) + 'px',
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
        if (_this.subMode === 'eraser') {
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
        if (_this.subMode === "brush") {
          _this.brush.active = true;
        }
        /** SELECT */
        if (_this.subMode === "select") {
          if (canvas.getActiveObject()) {
            _this.isSelected = true;
          } else {
            _this.isSelected = false;
          }
        }
        /** LINE */
        if (_this.subMode === "line") {
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
        if (_this.mode === 'draw' && _this.subMode === "text") {
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
            _this.subMode = "selectText";
            _this.addHistory();
          } else {
          }
        }
        /** FILL */
        if (_this.subMode === "fill") {
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
        if (_this.subMode === "line") {
          const pointer = canvas.getPointer(o.e);
          line.set({ x2: pointer.x, y2: pointer.y });
          canvas.renderAll();
        }
      });
      this.canvas.on("mouse:up", o => {
        _this.isDown = false;
        canvas.selection = false;
        if (_this.subMode === "line") {
          _this.addHistory();
        }
        if (_this.subMode === "brush") {
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
      this.subMode = "select";
      this.canvas.isDrawingMode = false;
      this.canvas.forEachObject(function(object) {
        object.selectable = true;
      });
    },

    fillColor() {
      this.subMode = "fill";
      this.canvas.isDrawingMode = false;
      this.canvas.forEachObject(function(object) {
        object.selectable = true;
      });
    },

    line() {
      this.canvas.forEachObject(function(object) {
        object.selectable = false;
      });
      this.subMode = "line";
      this.canvas.isDrawingMode = false;
    },

    addPhoto() {
      this.mode = "photo";
      this.imageModal = true;
      this.canvas.isDrawingMode = false;
      this.canvas.forEachObject(function(object) {
        object.selectable = true;
      });
    },

    canvasText() {
      this.subMode = "text";
      this.canvas.isDrawingMode = false;
      this.canvas.forEachObject(function(object) {
        object.selectable = true;
      });
    },

    backgroundColor() {
      this.subMode = 'backgroundColor';
    },

    pageText() {
      this.subMode = "text";
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
      this.subMode = 'text';
    },

    setDraw() {
      this.canvas.forEachObject(function(object) {
        object.selectable = true;
      });
      this.mode = "draw";
      this.subMode = 'brush';
      this.setFreeBrush();
    },

    setEraser() {
      this.subMode = eraser;
      this.canvas.freeDrawingBrush.color = "rgba(255,255,255,.95)";
    },

    setFreeBrush() {
      this.canvas.isDrawingMode = true;
      this.canvas.freeDrawingBrush.color = this.color;
      this.canvas.freeDrawingBrush.width = this.brush.width;
    },

    setPage() {
      this.mode = 'page';
      this.subMode = "text";
      this.canvas.isDrawingMode = false;
    },

    setBackground() {
      this.subMode = "background";
      this.canvas.isDrawingMode = false;
    },

    addBgPhoto() {
      this.imageModal = true;
      this.subMode = 'background';
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
      if (this.restoreIndex === this.history.length - 1) {
        this.history.push(snapshot);
        this.restoreIndex++;
      } else {
        this.history = this.history.slice(0, this.restoreIndex + 1);
        this.history.push(snapshot);
        this.restoreIndex = this.history.length - 1;
      }
      this.canUndo = this.history.length > 1;
      this.canRedo = this.restoreIndex < this.history.length - 1;
      this.saveStory();
    },

    undo() {
      if (this.restoreIndex > 0) {
        this.restoreIndex--;
        this.canvas.loadFromJSON(this.history[this.restoreIndex].json);
        this.canvas.renderAll.bind(this.canvas);
        this.background = {
          color: this.history[this.restoreIndex].background.color,
          image: this.history[this.restoreIndex].background.image
        };
        this.saveStory();
        if (this.history.length === this.restoreIndex + 1) {
          this.canredo = false;
        } else {
          this.canRedo = true;
        }
        if (this.restoreIndex === 0) {
          this.canUndo = false;
        }
      }
    },

    redo() {
      if (this.restoreIndex < this.history.length - 1) {
        this.restoreIndex++;
        this.canvas.loadFromJSON(this.history[this.restoreIndex].json);
        this.canvas.renderAll.bind(this.canvas);
        this.background = {
          color: this.history[this.restoreIndex].background.color,
          image: this.history[this.restoreIndex].background.image
        };
        this.saveStory();
        if (this.history.length === this.restoreIndex + 1) {
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
          this.history = [];
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
        if (this.mode === "page" && this.subMode === 'backgroundColor') {
          this.background.color = newColor;
          this.addHistory();
        } else if (this.mode === 'draw') {
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
        if (newImage && this.mode === "photo") {
          this.canvasInsertImage(newImage);
        } else if (newImage && this.subMode === "background") {
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