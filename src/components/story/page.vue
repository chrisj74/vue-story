<template>
    <div class="main-content-wrapper">
      <!-- Main tools -->
        <div class="tools">
            <q-btn icon="mdi-undo" round @click="undo()" :disable="!canUndo" />
            <q-btn icon="mdi-redo" round @click="redo()" :disable="!canRedo" />

            <q-btn icon="mdi-camera" :color="mode === 'addPhoto' ? 'primary' : 'dark'" round @click="addPhoto()" />
            <q-btn icon="mdi-format-text" :color="mode === 'text' ? 'primary' : 'dark'" round @click="addText()" />
            <q-btn icon="mdi-cursor-move" :color="mode === 'select' ? 'primary' : 'dark'" round @click="setSelect()" />
            <q-btn icon="mdi-cursor-move" :color="mode === 'select' ? 'primary' : 'dark'" round @click="setSelect()" />
            <q-btn icon="mdi-file-image" :color="mode === 'background' ? 'primary' : 'dark'" round @click="setBackground()" />
            <q-btn icon="mdi-ruler" :color="mode === 'line' ? 'primary' : 'dark'" round @click="line()" />
            <q-btn icon="mdi-pencil" :color="mode === 'brush' ? 'primary' : 'dark'" round @click="draw()" />
            <q-btn icon="mdi-close" round @click="clearCanvas()" />
        </div>
      <div class="main-content">
          <!-- Canvas -->
          <div class="canvas-ref" ref="page">
            <div class="canvas-wrapper">
              <canvas id="storyCanvas" ref="canvas" :style="{backgroundColor: background.color, backgroundImage: background.image? 'url('+background.image+')' : 'none'}">

              </canvas>
                <div class="zoom-controls" v-if="canvas && !brush.active && !isDown">
                    <i @click="zoomIn()" class="q-icon mdi mdi-magnify-plus zoom-in"></i>
                    <i @click="resetZoom()" class="q-icon mdi mdi-adjust reset-canvas" :class="{disabled: canvas.getZoom() === page.zoom}"></i>
                    <i @click="zoomOut()" class="q-icon  mdi mdi-magnify-minus zoom-out" :class="{disabled: canvas.getZoom() === page.zoom}"></i>
                </div>

                <div class="pan-controls" v-if="canvas && !brush.active && !isDown && canvas.getZoom() > page.zoom" :style="{bottom: ((page.height - canvas.height) + 10) + 'px'}">
                    <div>
                        <i @mouseup="stopPanning()" @mouseout="stopPanning()" @mousedown="panCanvas('up')" class="q-icon mdi mdi-chevron-up pan-up"></i>
                    </div>
                    <div>
                        <i @mouseup="stopPanning()" @mouseout="stopPanning()" @mousedown="panCanvas('left')" class="q-icon mdi mdi-chevron-left pan-left"></i>
                        <i @click="panCenter()" class="q-icon mdi mdi-adjust reset-canvas"></i>
                        <i @mouseup="stopPanning()" @mouseout="stopPanning()" @mousedown="panCanvas('right')" class="q-icon mdi mdi-chevron-right pan-right"></i>
                    </div>
                    <div>
                        <i @mouseup="stopPanning()" @mouseout="stopPanning()" @mousedown="panCanvas('down')" class="q-icon mdi mdi-chevron-down pan-down"></i>
                    </div>
                </div>
            </div>
          </div>

          <!-- Extra context tools -->
          <div class="extra-tools" v-if="canvas">
              <swatches v-model="color" colors="text-advanced" popover-to="left" :trigger-style="{ width: '30px', height: '30px', borderRadius: '50%' }"></swatches>
              <q-btn v-if="mode === 'background'" icon="mdi-camera" size="sm" :color="'dark'" round @click="addBgPhoto()" />
              <q-btn v-if="isSelected" size="sm" color="negative" icon="mdi-delete" round @click="deleteObj()" :disabled="!isSelected" />
              <q-btn v-if="mode === 'brush'" icon="mdi-pencil" size="sm" :color="mode === 'brush' && !isEraser ? 'primary' : 'dark'" round @click="draw()" />
              <q-btn v-if="mode === 'brush'" size="sm" :color="isEraser ? 'primary' : 'dark'" icon="mdi-eraser" round @click="erase()" />
              <div class="tool-slider" v-if="mode === 'text'">
                  <q-btn size="sm" color="primary" icon="mdi-format-size" round @click="toggleTextSize()" />
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
                  <q-btn size="sm" icon="mdi-signal" round :color="showBrushWidth ? 'primary' : 'dark'" @click="toggleBrushWidth()" />
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
                  <q-btn size="sm" icon="mdi-signal" round :color="showLineWidth ? 'primary' : 'dark'" @click="toggleLineWidth()" />
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
      <q-modal v-if="canvas" v-model="imageModal" :content-css="{minWidth: '600px', height: '90vh', maxWidth: canvas.width+'px', width: canvas.width+'px'}">
          <add-image v-if="mode === 'photo' || mode === 'background'"></add-image>
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
            background: {
                color: null,
                image: false
            },
            mode: 'brush',
            isEraser: false,
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
        console.log('page mounted');
        const _this = this;
        if (this.activePage && !this.canvas){
            if (this.activePage.background) {
                this.background.color = this.activePage.background.color;
                this.background.image = this.activePage.background.image;
            }



            if (this.activePage.pageJson) {
                this.canvasInit();
                this.canvas.loadFromJSON(
                    this.activePage.pageJson,
                    function() {
                        _this.canvas.renderAll.bind(_this.canvas);
                        _this.setDefaultZoom();
                        _this.addHistory();
                    }
                );
            }
        }
        /** Trigger canvas resize on browser resize */

        window.addEventListener('resize', function(event) {
            console.log('resize');
            _this.setDefaultZoom();
        });

    },
    methods: {
        canvasInit() {
            /** Main canvas */
            this.canvas = new fabric.Canvas('storyCanvas');
            const _this = this;
            const canvas = this.canvas;

            this.canvas.targetFindTolerance = 4;
            this.canvas.preserveObjectStacking = true;
            canvas.renderAll.bind(canvas)

            /** Canvas events */
            let line;
            const ctx = canvas.getContext("2d");
            this.canvas.on('path:created', function(e) {
                console.log('path:created');
                if (_this.isEraser) {
                    console.log('eraser');
                    e.path.globalCompositeOperation = 'destination-out';
                    canvas.renderAll();
                }
                _this.addHistory();
            });
            this.canvas.on('object:moved', () => {
                console.log('object:moved');
                canvas.renderAll.bind(canvas);
                _this.addHistory();
            });
            this.canvas.on('selection:created', function(o) {
                _this.isSelected = true;
            });
            this.canvas.on('selection:cleared', function(o) {
                _this.isSelected = false;
            });
            /** MOUSE DOWN */
            this.canvas.on('mouse:down', (o) => {
                _this.isDown = true;
                _this.showtextSize = false;
                _this.showBrushWidth = false;
                _this.showLineWidth = false;
                /** BRUSH */
                if (_this.mode === 'brush') {
                    _this.brush.active = true;
                }
                /** SELECT */
                if (_this.mode === 'select') {
                    if (canvas.getActiveObject()) {
                      _this.isSelected = true;
                    } else {
                      _this.isSelected = false;
                    }
                }
                /** LINE */
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
                /** TEXT */
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
                    _this.mode = 'select';
                    _this.addHistory();
                  } else {

                  }
                }
                /** FILL */
                if (_this.mode === 'fill') {
                    const activeObject = canvas.getActiveObject();
                    if (activeObject) {
                        if (activeObject.stroke) {
                            activeObject.set('fill', _this.color);
                            activeObject.set('stroke', activeObject.stroke);
                        } else if (activeObject.stroke && activeObject.fill) {
                            activeObject.set('fill', _this.color);
                            activeObject.set('stroke', _this.color);
                        }
                        canvas.renderAll.bind(canvas);
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

        backgroundAddImage(imageObj) {
            this.imageModal = false;
            this.$store.commit('clearInsertImage');
            this.$store.commit('clearImageSearchResults');
            this.background.image = imageObj.webformatURL;
            this.addHistory();
        },

        draw() {
            this.isEraser = false;
            this.canvas.forEachObject(function(object) {
                object.selectable = true;
            });
            this.mode = 'brush';
            this.setFreeBrush();
        },

        erase() {
            this.isEraser = true;
            this.canvas.freeDrawingBrush.color = 'rgba(255,255,255,.25)';
        },

        setFreeBrush() {
            this.canvas.isDrawingMode = true;
            this.canvas.freeDrawingBrush.color = this.color;
            this.canvas.freeDrawingBrush.width = this.brush.width;
        },

        setBackground() {
            this.mode = 'background';
            this.canvas.isDrawingMode = false;
        },

        addBgPhoto() {
            this.imageModal = true;
            this.canvas.forEachObject(function(object) {
                object.selectable = true;
            });
        },

        saveStory() {
            const jsonObj = this.canvas.toJSON(['globalCompositeOperation']);
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
              }
              this.$store.dispatch('updatePage', payload);
            }
        },
        addHistory() {
            const snapshot = {
                json: this.canvas.toJSON(['globalCompositeOperation']),
                background: {
                    color: this.background.color,
                    image: this.background.image
                },
            }
            if (this.restoreIndex === (this.history.length - 1)) {
                this.history.push(snapshot);
                this.restoreIndex++;
            } else {
                this.history = this.history.slice(0, this.restoreIndex + 1);
                this.history.push(snapshot);
                this.restoreIndex = (this.history.length - 1);
            }
            this.canUndo = this.history.length > 1;
            this.canRedo = (this.restoreIndex < (this.history.length - 1));
            this.saveStory();
        },
        undo() {
            if (this.restoreIndex > 0) {
                this.restoreIndex--;
                this.canvas.loadFromJSON(this.history[this.restoreIndex].json);
                this.canvas.renderAll.bind(this.canvas);
                this.background =  {
                    color: this.history[this.restoreIndex].background.color,
                    image: this.history[this.restoreIndex].background.image
                };
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
                this.canvas.loadFromJSON(this.history[this.restoreIndex].json);
                this.canvas.renderAll.bind(this.canvas);
                this.background =  {
                    color: this.history[this.restoreIndex].background.color,
                    image: this.history[this.restoreIndex].background.image
                };
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
          console.log('page.vue route watcher, from=', from);
          if(from.params.id === to.params.id
             && (from.params.pageId != to.params.pageId) || !to.params.pageId) {
            // same story new page
            // detroy canvas
            if (this.canvas) {
              this.canvas.dispose();
              this.canvas = null;
              this.background = {
                  color: null,
                  image: 'none'
              }
            }
            // reset history
              this.history = [];
            // set activePage
            const payload = {
                user: this.user,
                storyKey: this.$route.params.id,
                pageKey: this.$route.params.pageId ? this.$route.params.pageId : null
            }
            console.log('payload for setPage=', payload);
            this.$store.dispatch('setPage', payload);
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
                console.log('color watcher')
                this.canvas.freeDrawingBrush.color = newColor;
                if (this.mode === 'background') {
                    this.background.color = newColor;
                    this.addHistory();
                }
            }
        },
        insertImage: {
            handler: function(newImage, oldImage) {
                if (newImage && this.mode === 'photo') {
                    this.canvasInsertImage(newImage);
                } else if (newImage && this.mode === 'background') {
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
                    this.canvas.loadFromJSON(
                        this.activePage.pageJson,
                        function() {
                            _this.canvas.renderAll.bind(_this.canvas);
                            _this.setDefaultZoom();
                            _this.addHistory();
                        }
                    );

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
  flex-grow: 1
}

.canvas-ref{
  padding-left: 10px;
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
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center center;
}

.color-picker-input {
    visibility: none;
}

.tools {
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
</style>