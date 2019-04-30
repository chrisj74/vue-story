<template>
  <div class="main-content-wrapper">
    <!-- Main tools -->
    <div class="tools">
      <q-btn icon="mdi-undo" round @click="undo()" :disable="!canUndo" :size="$q.screen.lt.sm ? 'sm' : 'md'"/>
      <q-btn icon="mdi-redo" round @click="redo()" :disable="!canRedo" :size="$q.screen.lt.sm ? 'sm' : 'md'"/>

      <q-btn
        icon="mdi-camera"
        :color="mode === 'addPhoto' ? 'primary' : 'dark'"
        round
        :size="$q.screen.lt.sm ? 'sm' : 'md'"
        @click="addPhoto()"
      />
      <q-btn
        icon="mdi-format-text"
        :color="mode === 'text' ? 'primary' : 'dark'"
        round
        :size="$q.screen.lt.sm ? 'sm' : 'md'"
        @click="addText()"
      />
      <q-btn
        icon="mdi-cursor-move"
        :color="mode === 'select' ? 'primary' : 'dark'"
        round
        :size="$q.screen.lt.sm ? 'sm' : 'md'"
        @click="setSelect()"
      />
      <q-btn
        icon="mdi-file-image"
        :color="mode === 'background' ? 'primary' : 'dark'"
        round
        :size="$q.screen.lt.sm ? 'sm' : 'md'"
        @click="setBackground()"
      />
      <q-btn icon="mdi-ruler" :color="mode === 'line' ? 'primary' : 'dark'" round @click="line()" :size="$q.screen.lt.sm ? 'sm' : 'md'"/>
      <q-btn
        icon="mdi-pencil"
        :color="mode === 'brush' ? 'primary' : 'dark'"
        round
        :size="$q.screen.lt.sm ? 'sm' : 'md'"
        @click="draw()"
      />
      <q-btn icon="mdi-close" round @click="clearCanvas()" :size="$q.screen.lt.sm ? 'sm' : 'md'"/>
    </div>
    <div class="main-content">
      <!-- Canvas -->
      <div class="canvas-ref" ref="page">
        <div class="canvas-wrapper">
          <div v-if="page" class="canvas-bg-img-wrapper" :style="{width: page.width+'px', height: page.height+'px'}">
            <div v-if="canvas && background.color" class="canvas-bg-img" :style="{backgroundColor: background.color,
                                                              backgroundImage: background.image? 'url('+background.image+')' : 'none',
                                                              width: (canvas.width * (page.zoom / canvas.getZoom())) + 'px',
                                                              height: (canvas.height * (page.zoom / canvas.getZoom())) + 'px',
                                                              top: offsetYPos()+'px',
                                                              left: offsetXPos()+'px'}">

            </div>
          </div>


          <canvas
            id="storyCanvas"
            ref="canvas"
            key="canvas"
          ></canvas>
          <div class="zoom-controls" key="zooms" v-if="canvas && !brush.active && !isDown">
            <i @click="zoomIn()" class="q-icon mdi mdi-magnify-plus zoom-in"></i>
            <i
              @click="resetZoom()"
              class="q-icon mdi mdi-adjust reset-canvas"
              :class="{disabled: canvas.getZoom() === page.zoom}"
            ></i>
            <i
              @click="zoomOut()"
              class="q-icon mdi mdi-magnify-minus zoom-out"
              :class="{disabled: canvas.getZoom() === page.zoom}"
            ></i>
          </div>

          <div
            class="pan-controls"
            key="pans"
            v-if="canvas && !brush.active && !isDown && canvas.getZoom() > page.zoom"
            :style="{bottom: ((page.height - canvas.height) + 10) + 'px'}"
          >
            <div>
              <i
                @mouseup="stopPanning()"
                @mouseout="stopPanning()"
                @mousedown="panCanvas('up')"
                class="q-icon mdi mdi-chevron-up pan-up"
              ></i>
            </div>
            <div>
              <i
                @mouseup="stopPanning()"
                @mouseout="stopPanning()"
                @mousedown="panCanvas('left')"
                class="q-icon mdi mdi-chevron-left pan-left"
              ></i>
              <i @click="panCenter()" class="q-icon mdi mdi-adjust reset-canvas"></i>
              <i
                @mouseup="stopPanning()"
                @mouseout="stopPanning()"
                @mousedown="panCanvas('right')"
                class="q-icon mdi mdi-chevron-right pan-right"
              ></i>
            </div>
            <div>
              <i
                @mouseup="stopPanning()"
                @mouseout="stopPanning()"
                @mousedown="panCanvas('down')"
                class="q-icon mdi mdi-chevron-down pan-down"
              ></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Extra context tools -->
      <div class="extra-tools" v-if="canvas" key="extra-tools">
        <!-- COLORS -->
        <swatches
          v-model="color"
          colors="text-advanced"
          popover-to="left"
          :trigger-style="{ width: '30px', height: '30px', borderRadius: '50%' }"
        ></swatches>
        <!-- BG IMAGE -->
        <q-btn
          v-if="mode === 'background'"
          key="bgImageButton"
          icon="mdi-camera"
          size="sm"
          :color="'dark'"
          round
          @click="addBgPhoto()"
        />
        <!-- FILL OBJ -->
        <q-btn
          icon="mdi-format-color-fill"
          :color="mode === 'fill' ? 'primary' : 'dark'"
          round
          size="sm"
          @click="fillColor()"
          :disabled="!isSelected"
        />

        <q-btn
          v-if="mode === 'brush'"
          key="pencil"
          icon="mdi-pencil"
          size="sm"
          :color="mode === 'brush' && !isEraser ? 'primary' : 'dark'"
          round
          @click="draw()"
        />
        <q-btn
          v-if="mode === 'brush'"
          key="eraser"
          size="sm"
          :color="isEraser ? 'primary' : 'dark'"
          icon="mdi-eraser"
          round
          @click="erase()"
        />
        <div class="tool-slider" v-if="mode === 'text'">
          <q-btn size="sm" color="primary" icon="mdi-format-size" round @click="toggleTextSize()"/>
          <div class="q-slider-wrap" v-if="showTextSize">
            <q-slider v-model="text.size" :min="5" :max="100" :step="1" label snap/>
          </div>
        </div>
        <div class="tool-slider" v-if="mode === 'brush'">
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
        <div class="tool-slider" v-if="mode === 'line'">
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
      </div>
    </div>
    <q-modal
      v-if="canvas"
      v-model="imageModal"
      :content-css="{minWidth: '350px', height: '90vh', maxWidth: '100%', width: canvas.width+'px'}"
    >
      <add-image v-if="mode === 'photo' || mode === 'background'"></add-image>
    </q-modal>
    <span
      v-if="mode != 'text'"
      v-shortkey="{undoWin:['ctrl', 'z'], undoMac:['meta', 'z'], deleteKey:['del'], backspaceKey:['backspace']}"
      @shortkey="shortKeys($event)"
    ></span>
  </div>
</template>

<script>
import { fabric } from "fabric";
import Swatches from "vue-swatches";
import "vue-swatches/dist/vue-swatches.min.css";
import AddImage from "../../components/story/PixabaySearch";
export default {
  name: "Page",
  components: { Swatches, AddImage },
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
      mode: "brush",
      isEraser: false,
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

      showTextSize: false,
      showBrushWidth: false,
      showLineWidth: false
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
    }
  },
  mounted() {
    console.log('page Mounted');

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

      if (this.activePage.pageJson) {
        this.canvasInit();
        this.canvas.loadFromJSON(this.activePage.pageJson, function() {
          _this.canvas.renderAll.bind(_this.canvas);
          _this.setDefaultZoom();
          _this.addHistory();
        });
      }
    }
    /** Trigger canvas resize on browser resize */

    window.addEventListener("resize", function(event) {
      _this.$nextTick()
          .then(function () {
              // DOM updated
              _this.canvas.setHeight(595);
              _this.canvas.setWidth(842);
              _this.setDefaultZoom();
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
        if (_this.isEraser) {
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
        if (_this.mode === "brush") {
          _this.brush.active = true;
        }
        /** SELECT */
        if (_this.mode === "select") {
          if (canvas.getActiveObject()) {
            _this.isSelected = true;
          } else {
            _this.isSelected = false;
          }
        }
        /** LINE */
        if (_this.mode === "line") {
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
        if (_this.mode === "text") {
          if (
            !canvas.getActiveObject() ||
            !canvas.getActiveObject().isEditing
          ) {
            const pointer = canvas.getPointer(o.e);
            const textOptions = {
              fontSize: 16,
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
            const text = new fabric.IText("Enter text here...", textOptions);
            canvas.add(text).setActiveObject(text);
            text.enterEditing();
            text.selectAll();
            _this.mode = "select";
            _this.addHistory();
          } else {
          }
        }
        /** FILL */
        if (_this.mode === "fill") {
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
        if (_this.mode === "line") {
          const pointer = canvas.getPointer(o.e);
          line.set({ x2: pointer.x, y2: pointer.y });
          canvas.renderAll();
        }
      });
      this.canvas.on("mouse:up", o => {
        _this.isDown = false;
        canvas.selection = false;
        if (_this.mode === "line") {
          _this.addHistory();
        }
        if (_this.mode === "brush") {
          _this.brush.active = false;
        }
      });
      this.canvas.setHeight(595);
      this.canvas.setWidth(842);

      /* this.canvas.on("mouse:wheel", function(opt) {
        if (!_this.brush.active) {
          var delta = opt.e.deltaY;
          var zoom = canvas.getZoom();
          var pointer = canvas.getPointer(opt.e);
          zoom = zoom + delta / 200;
          if (zoom > 20) zoom = 20;
          if (zoom < _this.page.zoom) zoom = _this.page.zoom;
          _this.page.offsetY = opt.e.offsetY;
          _this.page.offsetX = opt.e.offsetX;
          console.log('opt.e.offsetX=', opt.e.offsetX);
          canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
          opt.e.preventDefault();
          opt.e.stopPropagation();
        }
      }); */
      this.draw();
    },
    offsetYPos() {
      const h = this.canvas.height;
      const z = this.page.zoom/this.canvas.getZoom();
      const topMargin = (h - (h * z)) / 2;
      const offset = ((this.page.offsetY - (h/2)) * z);
      return topMargin;
    },
    offsetXPos() {
      const w = this.canvas.width;
      const z = this.page.zoom/this.canvas.getZoom();
      const leftMargin = (w - (w * z)) / 2;
      const offset = ((this.page.offsetX - (w/2)) * z);
      return leftMargin;
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
      console.log('this.page.width', this.page.width, ' this.canvas.width', this.canvas.width);
      console.log('maxWidthRatio', maxWidthRatio);
      if (maxHeightRatio < maxWidthRatio) {
        this.page.zoom = maxHeightRatio;
        this.canvas.setHeight(this.canvas.height * maxHeightRatio);
        this.canvas.setWidth(this.canvas.width * maxHeightRatio);
        this.canvas.setZoom(maxHeightRatio);
      } else {
        this.page.zoom = maxWidthRatio;

        this.canvas.setHeight(this.canvas.height * maxWidthRatio);
        this.canvas.setWidth(this.canvas.width * maxWidthRatio);
        this.canvas.setZoom(maxWidthRatio);
      }
      this.scaleBrushWidth();
    },
    setSelect() {
      this.mode = "select";
      this.canvas.isDrawingMode = false;
      this.canvas.forEachObject(function(object) {
        object.selectable = true;
      });
    },
    fillColor() {
      this.mode = "fill";
      this.canvas.isDrawingMode = false;
      this.canvas.forEachObject(function(object) {
        object.selectable = true;
      });
    },
    line() {
      this.canvas.forEachObject(function(object) {
        object.selectable = false;
      });
      this.mode = "line";
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

    addText() {
      this.mode = "text";
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
    },

    draw() {
      this.isEraser = false;
      this.canvas.forEachObject(function(object) {
        object.selectable = true;
      });
      this.mode = "brush";
      this.setFreeBrush();
    },

    erase() {
      this.isEraser = true;
      this.canvas.freeDrawingBrush.color = "rgba(255,255,255,.9)";
    },

    setFreeBrush() {
      this.canvas.isDrawingMode = true;
      this.canvas.freeDrawingBrush.color = this.color;
      this.canvas.freeDrawingBrush.width = this.brush.width;
    },

    setBackground() {
      this.mode = "background";
      this.canvas.isDrawingMode = false;
    },

    addBgPhoto() {
      this.imageModal = true;
      this.canvas.forEachObject(function(object) {
        object.selectable = true;
      });
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
    zoomIn() {
      this.canvas.zoomToPoint(
        { x: this.canvas.width / 2, y: this.canvas.height / 2 },
        this.canvas.getZoom() * 1.1
      );
      this.scaleBrushWidth();
    },
    zoomOut() {
      if (this.canvas.getZoom() > this.page.zoom) {
        this.canvas.zoomToPoint(
          { x: this.canvas.width / 2, y: this.canvas.height / 2 },
          this.canvas.getZoom() * 0.9
        );
        this.scaleBrushWidth();
      }
    },
    resetZoom() {
      this.canvas.setZoom(this.page.zoom);
      this.panCenter();
      this.scaleBrushWidth();
    },
    panCanvas(dir) {
      clearTimeout(this.panning.timer);
      this.panning.active = true;
      const units = 10;
      let delta;
      switch (dir) {
        case "right":
          delta = new fabric.Point(units, 0);
          break;
        case "left":
          delta = new fabric.Point(units * -1, 0);
          break;
        case "up":
          delta = new fabric.Point(0, units * -1);
          break;
        case "down":
          delta = new fabric.Point(0, units);
          break;
        default:
          break;
      }
      this.canvas.relativePan(delta);
      const _this = this;
      if (this.panning.active) {
        this.panning.timer = setTimeout(() => {
          _this.panCanvas(dir);
        }, 50);
      }
    },
    panCenter() {
      const point = { x: 0, y: 0 };
      this.canvas.absolutePan(point);
    },
    stopPanning() {
      this.panning.active = false;
      clearTimeout(this.panning.timer);
    },
    toggleTextSize() {
      this.showTextSize = true;
    },
    toggleBrushWidth() {
      this.showBrushWidth = true;
    },
    toggleLineWidth() {
      this.showLineWidth = true;
    }
  },
  watch: {
    $route: {
      handler: function(from, to) {
        console.log('to=', to);
        if (
          (from.params.id === to.params.id &&
            from.params.pageId != to.params.pageId) ||
          !to.params.pageId
        ) {
          console.log('handle route change');
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
        if (this.mode === "background") {
          this.background.color = newColor;
          this.addHistory();
        }
      }
    },
    insertImage: {
      handler: function(newImage, oldImage) {
        this.$store.commit('setLoading', false);
        if (newImage && this.mode === "photo") {
          this.canvasInsertImage(newImage);
        } else if (newImage && this.mode === "background") {
          this.backgroundAddImage(newImage);
        }
      }
    },
    activePage: {
      handler: function(newPage, oldPage) {
        if (!this.canvas && newPage && newPage.pageJson) {
          this.background.color = this.activePage.background.color;
          this.background.image = this.activePage.background.image;
          this.canvasInit();
          const _this = this;
          this.canvas.loadFromJSON(this.activePage.pageJson, function() {
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
}
.main-content {
  width: 100%;
  display: flex;
  flex-wrap: nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  flex-grow: 1;
}

.canvas-ref {
  padding-left: 10px;
  display: flex;
  max-height: calc(100vh - 120px);
  overflow: hidden;
  max-width: 100%;
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
  display: flex;
  justify-content: center;
}

.tools > * {
  margin-right: 5px;
  margin-bottom: 5px;
}

.extra-tools {
  align-self: stretch;
  min-width: 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
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
  right: 50px;
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
@media(orientation: portrait) {
  .main-content {
    flex-direction: column;
  }
  .canvas-ref {
    padding-left: 0;
  }
  .extra-tools {
    flex-direction: row;
  }
}
@media(max-width: $breakpoint-md) {
  .canvas-ref {
    max-height: calc(100vh - 70px);
  }
}
</style>