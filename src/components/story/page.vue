<template>
    <div class="main-content-wrapper">
      <!-- Main tools -->
        <div class="tools">
            <q-btn icon="undo" round @click="undo()" :disable="!canUndo" />
            <q-btn icon="redo" round @click="redo()" :disable="!canRedo" />
            <swatches v-model="color" colors="text-advanced" popover-to="right"></swatches>
            <q-btn icon="add_a_photo" :color="mode === 'addPhoto' ? 'primary' : 'dark'" round @click="addPhoto()" />
            <q-btn icon="text_fields" :color="mode === 'text' ? 'primary' : 'dark'" round @click="addText()" />
            <q-btn icon="open_with" :color="mode === 'select' ? 'primary' : 'dark'" round @click="setSelect()" />
            <q-btn icon="format_color_fill" :color="mode === 'fill' ? 'primary' : 'dark'" round @click="fillColor()" />
            <q-btn icon="straighten" :color="mode === 'line' ? 'primary' : 'dark'" round @click="line()" />
            <q-btn icon="edit" :color="mode === 'brush' ? 'primary' : 'dark'" round @click="draw()" />
            <q-btn icon="clear" round @click="clearCanvas()" />
        </div>
      <div class="main-content">
          <!-- Canvas -->
          <div class="canvas-ref" ref="page">
            <div class="canvas-wrapper">
              <canvas id="storyCanvas" ref="canvas">

              </canvas>
                <div class="zoom-controls" v-if="!brush.active && !isDown">
                    <i @click="zoomIn()" class="q-icon material-icons zoom-in">zoom_in</i>
                    <i @click="resetZoom()" class="q-icon material-icons reset-canvas">center_focus_weak</i>
                    <i @click="zoomOut()" class="q-icon material-icons zoom-out">zoom_out</i>
                </div>

                <div class="pan-controls" v-if="!brush.active && !isDown">
                    <div>
                        <i @mouseup="stopPanning()" @mouseout="stopPanning()" @mousedown="panCanvas('up')" class="q-icon material-icons pan-up">keyboard_arrow_up</i>
                    </div>
                    <div>
                        <i @mouseup="stopPanning()" @mouseout="stopPanning()" @mousedown="panCanvas('left')" class="q-icon material-icons pan-left">keyboard_arrow_left</i>
                        <i @click="panCenter()" class="q-icon material-icons reset-canvas">adjust</i>
                        <i @mouseup="stopPanning()" @mouseout="stopPanning()" @mousedown="panCanvas('right')" class="q-icon material-icons pan-right">keyboard_arrow_right</i>
                    </div>
                    <div>
                        <i @mouseup="stopPanning()" @mouseout="stopPanning()" @mousedown="panCanvas('down')" class="q-icon material-icons pan-down">keyboard_arrow_down</i>
                    </div>
                </div>
            </div>
          </div>

          <!-- Extra context tools -->
          <div class="extra-tools" v-if="canvas">
              <q-btn v-if="mode === 'select'" size="sm" color="primary" icon="delete" round @click="deleteObj()" :disabled="!isSelected" />
              <div class="tool-slider" v-if="mode === 'text'">
                  <q-btn size="sm" color="primary" icon="format_size" round @click="toggleTextSize()" />
                  <div class="q-slider-wrap" v-if="showTextSize">
                      <q-slider
                      v-model="text.size"
                      :min="5"
                      :max="100"
                      :step="1"
                      label
                      snap
                      />
                  </div>
              </div>
              <div class="tool-slider" v-if="mode === 'brush'">
                  <q-btn size="sm" color="primary" icon="format_size" round @click="toggleBrushWidth()" />
                  <div class="q-slider-wrap" v-if="showBrushWidth">
                      <q-slider
                      v-model="brush.width"
                      :min="1"
                      :max="50"
                      :step="1"
                      label
                      snap
                      />
                  </div>
              </div>
              <div class="tool-slider" v-if="mode === 'line'">
                  <q-btn size="sm" color="primary" icon="format_size" round @click="toggleLineWidth()" />
                  <div class="q-slider-wrap" v-if="showLineWidth">
                      <q-slider
                      v-model="lineObj.width"
                      :min="1"
                      :max="20"
                      :step="1"
                      label
                      snap
                      />
                  </div>
              </div>
          </div>
      </div>
      <q-modal v-if="canvas" v-model="imageModal" :content-css="{minWidth: '600px', minHeight: '600px', maxWidth: canvas.width+'px', width: canvas.width+'px', maxHeight: canvas.height+'px'}">
          <add-image v-if="mode === 'photo'"></add-image>
      </q-modal>
      <span v-if="mode != 'text'" v-shortkey="{undoWin:['ctrl', 'z'], undoMac:['meta', 'z'], deleteKey:['del'], backspaceKey:['backspace']}" @shortkey="shortKeys($event)"></span>
    </div>
</template>

<script>
import { fabric } from 'fabric';
import Swatches from 'vue-swatches';
import "vue-swatches/dist/vue-swatches.min.css";
import AddImage from "../../components/story/PixabaySearch";
export default {
    name: 'Page',
    components: { Swatches, AddImage },
    data() {
        return {
            page: {
                width: 0,
                height: 0,
                zoom: 1,
            },
            mode: 'brush',
            isSelected: false,
            isDown: false,
            brush: {
                width: 5,
                active: false
            },
            text: {
              size: 16,
            },
            lineObj: {
              width: 5,
            },
            color: '#000000',
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
            showLineWidth: false,
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
    },
    mounted() {
        /** Trigger canvas resize on browser resize */
        const _this = this;
        window.addEventListener('resize', function(event) {
            _this.setDefaultZoom();
        });

    },
    methods: {
        canvasInit() {
            /** Main canvas */
            this.canvas = new fabric.Canvas('storyCanvas');
            const _this = this;
            const canvas = this.canvas;

            this.canvas.backgroundColor = '#ffffff';
            this.canvas.targetFindTolerance = 4;

            /** Canvas events */
            let line;
            this.canvas.on('path:created', function(e) {
                _this.addHistory();
            });
            this.canvas.on('object:moved', () => {
                _this.addHistory();
            });
            this.canvas.on('mouse:down', (o) => {
                _this.isDown = true;
                _this.showtextSize = false;
                _this.showBrushWidth = false;
                _this.showLineWidth = false;
                if (_this.mode === 'brush') {
                    _this.brush.active = true;
                }
                if (_this.mode === 'select') {
                    if (canvas.getActiveObject()) {
                      _this.isSelected = true;
                    } else {
                      _this.isSelected = false;
                    }
                }
                if (_this.mode === 'line') {
                    canvas.selection = false;
                    const pointer = canvas.getPointer(o.e);
                    const points = [pointer.x, pointer.y, pointer.x, pointer.y];
                    line = new fabric.Line(points, {
                        strokeWidth: _this.lineObj.width,
                        fill: _this.color,
                        stroke: _this.color,
                        originX: 'center',
                        originY: 'center'
                    });
                    canvas.add(line);
                }
                if (_this.mode === 'text') {
                  if (!canvas.getActiveObject() || !canvas.getActiveObject().isEditing) {
                    const pointer = canvas.getPointer(o.e);
                    const textOptions = {
                      fontSize:16,
                      left: pointer.x,
                      top: pointer.y,
                      radius:10,
                      borderRadius: '25px',
                      hasRotatingPoint: true,
                      lockScalingX: true,
                      lockScalingY: true,
                      hiddenTextarea: true,
                      editingBorderColor: '#999999',
                    };
                    const text = new fabric.IText('Enter text here...', textOptions);
                    canvas.add(text).setActiveObject(text);
                    text.enterEditing();
                    text.selectAll();
                    _this.addHistory();
                  } else {

                  }
                }
                if (_this.mode === 'fill') {
                    console.log('fill click');
                    const activeObject = canvas.getActiveObject();
                    console.log(activeObject);
                    if (activeObject) {
                        if (activeObject.stroke) {
                            console.log('stroke');
                            activeObject.set('fill', _this.color);
                            activeObject.set('stroke', activeObject.stroke);
                        } else if (activeObject.stroke && activeObject.fill) {
                            activeObject.set('fill', _this.color);
                            activeObject.set('stroke', _this.color);
                        }
                        canvas.renderAll();
                    } else {
                        canvas.set('backgroundColor', _this.color);
                        canvas.renderAll();
                    }
                    _this.addHistory();
                }
            });
            this.canvas.on('mouse:move', (o) => {
                if (!_this.isDown) return;
                if (_this.mode === 'line') {
                    const pointer = canvas.getPointer(o.e);
                    line.set({ x2: pointer.x, y2: pointer.y });
                    canvas.renderAll();
                }
            });
            this.canvas.on('mouse:up', (o) => {
                _this.isDown = false;
                canvas.selection = false;
                if (_this.mode === 'line') {
                    _this.addHistory();
                }
                if (_this.mode === 'brush') {
                    _this.brush.active = false;
                }
            });
            this.canvas.setHeight(595);
            this.canvas.setWidth(842);

            this.canvas.on('mouse:wheel', function(opt) {
                if (!_this.brush.active) {
                    var delta = opt.e.deltaY;
                    var zoom = canvas.getZoom();
                    var pointer = canvas.getPointer(opt.e);
                    zoom = zoom + delta / 200;
                    if (zoom > 20) zoom = 20;
                    if (zoom < _this.page.zoom) zoom = _this.page.zoom;
                    canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
                    opt.e.preventDefault();
                    opt.e.stopPropagation();
                }
            });
            this.draw();
        },
        addPage() {
            const payload = {
                user: this.user,
                storyKey: this.$route.params.id,
                pageKey: this.$route.params.pageId ? this.$route.params.pageId : null,
                order: this.pages.length,
            }
            this.$store.dispatch('addPage', payload)
            .then(newPage => {
                this.$router.push({ path: newPage })
            }) ;
        },
        shortKeys(e) {
            switch (e.srcKey) {
                case 'undoWin':
                case 'undoMac':
                    this.undo();
                    break;
                case 'deleteKey':
                case 'backspaceKey':
                    this.deleteObj();
                    break
            }
        },
        deleteObj() {
            const activeObject = this.canvas.getActiveObject();
            if (activeObject && !activeObject.isEditing) {
                this.canvas.remove(activeObject);
                this.canvas.renderAll();
            }
            this.addHistory();
        },
        setPageSize() {
            this.page.height = this.$refs.page.clientHeight;
            this.page.width = this.$refs.page.clientWidth;
        },
        setDefaultZoom() {
            this.setPageSize();
            const maxHeightRatio = (this.page.height / this.canvas.height);
            const maxWidthRatio = (this.page.width / this.canvas.width);
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
            this.mode = 'select';
            this.canvas.isDrawingMode = false;
            this.canvas.forEachObject(function(object) {
                object.selectable = true;
            });
        },
        fillColor() {
            this.mode = 'fill';
            this.canvas.isDrawingMode = false;
            this.canvas.forEachObject(function(object) {
                object.selectable = true;
            });
        },
        line() {
            this.canvas.forEachObject(function(object) {
                object.selectable = false;
            });
            this.mode = 'line';
            this.canvas.isDrawingMode = false;
        },
        addPhoto() {
            this.mode = 'photo';
            this.imageModal = true;
            this.canvas.isDrawingMode = false;
            this.canvas.forEachObject(function(object) {
                object.selectable = true;
            });
        },
        addText() {
          this.mode = 'text';
            this.canvas.isDrawingMode = false;
            this.canvas.forEachObject(function(object) {
                object.selectable = true;
            });
        },
        canvasInsertImage(imageObj) {
            this.imageModal = false;
            this.$store.commit('clearInsertImage');
            this.$store.commit('clearImageSearchResults');

            const canvas = this.canvas
            const _this = this;
            fabric.Image.fromURL(imageObj.webformatURL, function(myImg) {
                myImg.set({ left: canvas.width / 4, top: 100, width: imageObj.webformatWidth, height: imageObj.webformatHeight });
                myImg.scaleToWidth(canvas.width / 2);
                canvas.add(myImg);
                _this.addHistory();
            },  { crossOrigin: 'Anonymous' });

        },
        draw() {
            this.canvas.forEachObject(function(object) {
                object.selectable = true;
            });
            this.mode = 'brush';
            this.setFreeBrush();
        },
        setFreeBrush() {
            this.canvas.isDrawingMode = true;
            this.canvas.freeDrawingBrush.color = this.color;
            this.canvas.freeDrawingBrush.width = this.brush.width;
        },
        saveStory() {
            const jsonObj = this.canvas.toJSON();

            const payload = {
                user: this.user,
                storyKey: this.$route.params.id,
                pageKey: this.activePage.id,
                page: {
                  json: JSON.stringify(jsonObj),
                }
            }
            this.$store.dispatch('updatePage', payload);
        },
        addHistory() {
            if (this.restoreIndex === (this.history.length - 1)) {
                this.history.push(this.canvas.toJSON());
                this.restoreIndex++;
            } else {
                this.history = this.history.slice(0, this.restoreIndex + 1);
                this.history.push(JSON.stringify(this.canvas));
                this.restoreIndex = (this.history.length - 1);
            }
            this.canUndo = this.history.length > 1;
            this.canRedo = (this.restoreIndex < (this.history.length - 1));
            this.saveStory();
        },
        undo() {
            if (this.restoreIndex > 0) {
                this.restoreIndex--;
                this.canvas.loadFromJSON(this.history[this.restoreIndex]);
                this.canvas.renderAll.bind(this.canvas);
                this.saveStory();
                if (this.history.length === (this.restoreIndex + 1)) {
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
            if (this.restoreIndex < (this.history.length - 1)) {
                this.restoreIndex++;
                this.canvas.loadFromJSON(this.history[this.restoreIndex]);
                this.canvas.renderAll.bind(this.canvas);
                this.saveStory();
                if (this.history.length === (this.restoreIndex + 1)) {
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
            this.canvas.freeDrawingBrush.width = Math.ceil(this.brush.width * this.canvas.getZoom());
        },
        zoomIn() {
            this.canvas.zoomToPoint({ x: (this.canvas.width / 2), y: (this.canvas.height / 2) }, this.canvas.getZoom() * 1.1);
            this.scaleBrushWidth();
        },
        zoomOut() {
            if (this.canvas.getZoom() > this.page.zoom) {
              this.canvas.zoomToPoint({ x: (this.canvas.width / 2), y: (this.canvas.height / 2) }, this.canvas.getZoom() * 0.9);
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
                case 'right':
                    delta = new fabric.Point(units, 0);
                    break;
                case 'left':
                    delta = new fabric.Point((units * -1), 0);
                    break;
                case 'up':
                    delta = new fabric.Point(0, (units * -1));
                    break;
                case 'down':
                    delta = new fabric.Point(0, units);
                    break;
                default:
                    break;
            }
            this.canvas.relativePan(delta);
            const _this = this;
            if (this.panning.active) {
                this.panning.timer = setTimeout(() => { _this.panCanvas(dir) }, 50);
            }
        },
        panCenter() {
            const point = { x: 0, y: 0 };
            this.canvas.absolutePan(point)
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
        handler: function(from, to){
          console.log('route watcher, from=', from);
          if(from.params.id === to.params.id && from.params.pageId != to.params.pageId) {
            // same story new page
            // detroy canvas
            this.canvas.dispose();
            this.canvas = null;
            // reset history
            this.history = [];
            // set activePage
            const payload = {
                user: this.user,
                storyKey: this.$route.params.id,
                pageKey: this.$route.params.pageId ? this.$route.params.pageId : null
            }
            this.$store.dispatch('setPage', payload);
          }
        }
      },
        brush: {
            handler: function(newBrush, oldVal) {
                this.canvas.freeDrawingBrush.width = newBrush.width;
                this.canvas.freeDrawingBrush.color = this.color;
            },
            deep: true
        },
        color: {
            handler: function(newColor, oldColor) {
                this.canvas.freeDrawingBrush.color = newColor;
            }
        },
        insertImage: {
            handler: function(newImage, oldImage) {
                if (newImage) {
                    this.canvasInsertImage(newImage);
                }
            }
        },
        activePage: {
            handler: function(newPage, oldPage) {
                if (!this.canvas && newPage.pageJson) {
                    this.canvasInit();
                    const _this = this;
                    this.canvas.loadFromJSON(
                      this.activePage.pageJson,
                      function() {
                            _this.canvas.renderAll.bind(_this.canvas);
                            _this.setDefaultZoom();
                            _this.addHistory();
                      });

                } else if (!this.canvas) {
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
                        user : this.user,
                        storyKey : this.$route.params.id
                    };
                    this.$store.dispatch('setStory', payload);
                    this.storiesSet = true;
                }
            }
        },
    },
}
</script>

<style>
.main-content-wrapper {
  flex-grow: 1;

}
.main-content {
  width: 100%;
  display: flex;
  flex-wrap: nowrap;
  justify-content: flex-start;
  align-items: flex-start;
}

.canvas-ref{
  padding-left: 10px;
  flex-grow: 1;
  align-self: stretch;
  display: flex;
  max-height: calc(100vh - 120px);
  overflow: hidden;
}

.canvas-wrapper {
    position: relative;
    /* max-height: calc(100vh - 70px);
    overflow: hidden; */
}

#storyCanvas {
    height: 595px;
    width: 842px;
    background: #fff;
}

.color-picker-input {
    visibility: none;
}

.tools {
  flex-basis: 100%;
  padding-left: 40px;
  display: flex;
  justify-content: center;
}

.tools>* {
    margin-right: 5px;
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
    font-size: 2em;
    position: absolute;
    bottom: 10px;
    right: 10px;
    z-index: 999;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    background: rgba(255, 255, 255, 0.8);
}

.zoom-controls {
    font-size: 2em;
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 999;
    display: inline-flex;
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
</style>