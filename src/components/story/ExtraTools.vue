<template>
  <!-- EXTRA TOOLS -->
  <div class="extra-tools" v-if="pageDimensions" :style="{left: leftPos()}" key="extra-tools">
    <!-- COLORS -->
    <swatches
      :value="settings.color"
      @input="updateColor"
      colors="text-advanced"
      :popover-to="'left'"
      :trigger-style="{ width: $q.screen.lt.sm ? '30px' : '42px', height: $q.screen.lt.sm ? '30px' : '42px', borderRadius: '50%', border: 'solid 1px #000' }"
      v-if="(modes.mode !== 'text' && modes.mode !== 'photo')"
      @open="resetSliders()"
    ></swatches>
    <!-- TEXT -->
      <template v-if="modes.mode === 'text'">
        <div style="margin-top: 40px;">
          <q-btn
            icon="mdi-format-text"
            :color="modes.subMode === 'text' ? 'primary' : 'dark'"
            round
            :size="$q.screen.lt.sm ? 'sm' : 'md'"
            @click="setText()"
          >
            <q-tooltip :disable="$q.screen.lt.sm || $q.platform.has.touch" anchor="center left" self="center right" :offset="[10, 10]">
              type
            </q-tooltip>
          </q-btn>
        </div>
        <!-- TEXT BOX OPTIONS -->
        <div class="tool-slider">
          <q-btn
            :size="$q.screen.lt.sm ? 'sm' : 'md'"
            :color="showTextOptions ? 'primary' : 'dark'"
            :icon="showTextOptions ? 'mdi-chevron-double-right' : 'mdi-checkbox-blank-outline'"
            round
            @click="toggleTextOptions()"
            :disabled="isNaN(settings.activeEditor)">
            <q-tooltip :disable="$q.screen.lt.sm || $q.platform.has.touch" anchor="center left" self="center right" :offset="[10, 10]">
              Text box colour &amp; border
            </q-tooltip>
          </q-btn>
          <div class="q-slider-wrap" v-if="showTextOptions">
            <div>
              <p>Box border width</p>
              <q-slider :value="settings.textBoxBorderWidth" :min="0" :max="10" :step="1" label snap @input="val => {updateTextBoxOptions(val, 'borderWidth')}"/>
            </div>
            <div>
              <p>Box border color</p>
              <swatches
                :value="settings.textBoxBorderColor"
                @input="val => {updateTextBoxOptions(val, 'borderColor')}"
                colors="text-advanced"
                :popover-to="'left'"
                :trigger-style="{ width: $q.screen.lt.sm ? '30px' : '42px', height: $q.screen.lt.sm ? '30px' : '42px', borderRadius: '50%', border: 'solid 1px #000' }"
              ></swatches>
            </div>
            <div>
              <p>Background opactiy</p>
              <q-slider :value="settings.textBoxOpacity" :min="0" :max="1" :step="0.1" label snap @input="val => {updateTextBoxOptions(val, 'opacity')}"/>
            </div>
            <div>
              <p>Background color</p>
              <swatches
                :value="settings.textBoxBackgroundColor"
                @input="val => {updateTextBoxOptions(val, 'backgroundColor')}"
                colors="text-advanced"
                :popover-to="'left'"
                :trigger-style="{ width: $q.screen.lt.sm ? '30px' : '42px', height: $q.screen.lt.sm ? '30px' : '42px', borderRadius: '50%', border: 'solid 1px #000' }"
              ></swatches>
            </div>
            <!-- <q-slider v-model="text.size" :min="5" :max="100" :step="1" label snap/> -->
          </div>
        </div>
        <!-- ADD TEXT BLOCK -->
        <span class="attention-wrapper"
          :class="{'btn-attention': storeTextLayer.length === 0}">
          <q-btn
            key="addTextBlock"
            icon="mdi-plus-circle"
            :size="$q.screen.lt.sm ? 'sm' : 'md'"
            :color="'dark'"
            round
            @click="addTextBlock()"
          >
            <q-tooltip :disable="$q.screen.lt.sm || $q.platform.has.touch" anchor="center left" self="center right" :offset="[10, 10]">
              Add text block
            </q-tooltip>
          </q-btn>
        </span>
        <!-- DELETE OBJ -->
        <q-btn
          :size="$q.screen.lt.sm ? 'sm' : 'md'"
          color="negative"
          icon="mdi-delete"
          round
          @click="deleteTextBlock()"
        >
          <q-tooltip :disable="$q.screen.lt.sm || $q.platform.has.touch" anchor="center left" self="center right" :offset="[10, 10]">
            Delete text block
          </q-tooltip>
        </q-btn>
      </template>
    <!-- PAGE TOOLS -->
      <template v-if="modes.mode === 'page'">
        <!-- BG COLOR -->
        <q-btn
          icon="mdi-format-color-fill"
          :color="modes.subMode === 'backgroundColor' ? 'primary' : 'dark'"
          round
          :size="$q.screen.lt.sm ? 'sm' : 'md'"
          @click="setBackgroundColor()"
        >
          <q-tooltip :disable="$q.screen.lt.sm || $q.platform.has.touch" anchor="center left" self="center right" :offset="[10, 10]">
            Change background color
          </q-tooltip>
        </q-btn>
        <!-- BG IMAGE -->
        <q-btn
          key="bgImageButton"
          icon="mdi-image-plus"
          :size="$q.screen.lt.sm ? 'sm' : 'md'"
          :color="'dark'"
          round
          @click="addBgPhoto()"
        >
          <q-tooltip :disable="$q.screen.lt.sm || $q.platform.has.touch" anchor="center left" self="center right" :offset="[10, 10]">
            Add a background image
          </q-tooltip>
        </q-btn>
        <!-- REMOVE BG IMAGE -->
        <q-btn
          key="bgImageRemoveButton"
          icon="mdi-image-off"
          :size="$q.screen.lt.sm ? 'sm' : 'md'"
          :color="'negative'"
          round
          @click="backgroundRemoveImage()"
        >
          <q-tooltip :disable="$q.screen.lt.sm || $q.platform.has.touch" anchor="center left" self="center right" :offset="[10, 10]">
            Remove background image
          </q-tooltip>
        </q-btn>
      </template>
    <!-- SHAPE TOOLS -->
    <template v-if="modes.mode === 'shape'">
      <!-- MOVE -->
      <q-btn
        icon="mdi-cursor-move"
        :color="modes.subMode === 'select' ? 'primary' : 'dark'"
        round
        :size="$q.screen.lt.sm ? 'sm' : 'md'"
        @click="setSelect()"
      />
      <!-- RULER -->
      <q-btn
        icon="mdi-ruler"
        :color="modes.subMode === 'line' ? 'primary' : 'dark'"
        round @click="line()"
        :size="$q.screen.lt.sm ? 'sm' : 'md'"
      />
      <!-- RECT -->
      <q-btn
        icon="mdi-shape-rectangle-plus"
        :color="modes.subMode === 'rect' ? 'primary' : 'dark'"
        round @click="rect()"
        :size="$q.screen.lt.sm ? 'sm' : 'md'"
      />
      <!-- FILL OBJ -->
      <q-btn
        icon="mdi-format-color-fill"
        :color="modes.subMode === 'fill' ? 'primary' : 'dark'"
        round
        :size="$q.screen.lt.sm ? 'sm' : 'md'"
        @click="fillColor()"
        :disabled="!settings.isSelected"
      />

      <!-- TEXT -->
      <!-- <q-btn
        icon="mdi-format-text"
        :color="modes.subMode === 'text' ? 'primary' : 'dark'"
        round
        :size="$q.screen.lt.sm ? 'sm' : 'md'"
        @click="canvasText()"
      /> -->
      <!-- TEXT SIZE -->
      <!-- <div class="tool-slider" v-if="modes.mode === 'shape' && (modes.subMode === 'text' || modes.subMode === 'selectText')">
        <q-btn
          :size="$q.screen.lt.sm ? 'sm' : 'md'"
          color="primary"
          :icon="modes.subMode === 'selectText' ? 'mdi-chevron-double-right' : 'mdi-format-size'"
          round
          @click="toggleTextSize()"/>
        <div class="q-slider-wrap" v-if="showTextSize">
          <q-slider :value="text.size" :min="5" :max="100" :step="1" label snap/>
        </div>
      </div> -->
      <!-- LINE WIDTH -->
      <div class="tool-slider" v-if="modes.subMode === 'line' || modes.subMode === 'rect'">
        <q-btn
          :size="$q.screen.lt.sm ? 'sm' : 'md'"
          icon="mdi-signal"
          round
          :color="showLineWidth ? 'primary' : 'dark'"
          @click="toggleLineWidth()"
        />
        <div class="q-slider-wrap" v-if="showLineWidth">
          <q-slider :value="settings.lineWidth" :min="1" :max="20" :step="1" label snap  @input="val => {updateLineWidth(val)}" />
        </div>
      </div>
      <!-- DELETE OBJ -->
      <q-btn
        :size="$q.screen.lt.sm ? 'sm' : 'md'"
        color="negative"
        icon="mdi-delete"
        round
        @click="deleteObj()"
        :disabled="!settings.isSelected"
      />
      <!-- CLEAR -->
      <q-btn icon="mdi-close" round @click="clearCanvas()" :size="$q.screen.lt.sm ? 'sm' : 'md'"/>
    </template>

    <!-- PHOTO TOOLS -->
    <template v-if="modes.mode === 'photo'">
      <!-- Add photo -->
      <q-btn
        icon="mdi-plus-circle"
        :color="modes.mode === 'photo' && !settings.showImageOpacity ? 'primary' : 'dark'"
        round
        :size="$q.screen.lt.sm ? 'sm' : 'md'"
        @click="addPhoto()"
      >
        <q-tooltip :disable="$q.screen.lt.sm || $q.platform.has.touch" anchor="center left" self="center right" :offset="[10, 10]">
          Add an image
        </q-tooltip>
      </q-btn>

      <!-- OPACITY -->
      <div class="tool-slider">
        <q-btn
          :size="$q.screen.lt.sm ? 'sm' : 'md'"
          :icon="settings.showImageOpacity ? 'mdi-chevron-double-right' : 'mdi-signal'"
          round
          :color="settings.showImageOpacity ? 'primary' : 'dark'"
          @click="toggleImageOpacity()"
          :disabled="!settings.isSelected"
        >
          <q-tooltip :disable="$q.screen.lt.sm || $q.platform.has.touch" anchor="center left" self="center right" :offset="[10, 10]">
            Change image opacity (how see through it is)
          </q-tooltip>
        </q-btn>
        <div class="q-slider-wrap" v-if="settings.showImageOpacity">
          <div>Image opacity (how see through it is)</div>
          <q-slider :value="settings.imageOpacity" :min="0" :max="1" :step="0.1" label snap @input="val => {updateImageOpacity(val)}"/>
        </div>
      </div>

      <!-- DELETE OBJ -->
      <q-btn
        :size="$q.screen.lt.sm ? 'sm' : 'md'"
        color="negative"
        icon="mdi-delete"
        round
        @click="deleteObj()"
        :disabled="!settings.isSelected"
      >
        <q-tooltip :disable="$q.screen.lt.sm || $q.platform.has.touch" anchor="center left" self="center right" :offset="[10, 10]">
          Delete image
        </q-tooltip>
      </q-btn>
    </template>

    <!-- DRAW TOOLS -->
    <template v-if="modes.mode === 'draw'">
      <!-- BRUSH -->
      <q-btn
        key="pencil"
        icon="mdi-pencil"
        :size="$q.screen.lt.sm ? 'sm' : 'md'"
        :color="modes.subMode === 'brush'? 'primary' : 'dark'"
        round
        @click="setDraw()"
      >
        <q-tooltip :disable="$q.screen.lt.sm || $q.platform.has.touch" anchor="center left" self="center right" :offset="[10, 10]">
          Use pen
        </q-tooltip>
      </q-btn>
      <!-- ERASER -->
      <q-btn
        key="eraser"
        :size="$q.screen.lt.sm ? 'sm' : 'md'"
        :color="modes.subMode === 'eraser' ? 'primary' : 'dark'"
        icon="mdi-eraser"
        round
        @click="setEraser()"
      >
        <q-tooltip :disable="$q.screen.lt.sm || $q.platform.has.touch" anchor="center left" self="center right" :offset="[10, 10]">
          Use eraser
        </q-tooltip>
      </q-btn>
      <!-- BRUSH SIZE -->
      <div class="tool-slider" v-if="modes.subMode === 'brush' || modes.subMode === 'eraser'">
        <q-btn
          :size="$q.screen.lt.sm ? 'sm' : 'md'"
          :icon="settings.showBrushWidth ? 'mdi-chevron-double-right' :'mdi-signal'"
          round
          :color="settings.showBrushWidth ? 'primary' : 'dark'"
          @click="toggleBrushWidth()"
        >
          <q-tooltip :disable="$q.screen.lt.sm || $q.platform.has.touch" anchor="center left" self="center right" :offset="[10, 10]">
            Change pen width
          </q-tooltip>
        </q-btn>
        <div class="q-slider-wrap" v-if="settings.showBrushWidth">
          <div>Pen width</div>
          <q-slider :value="settings.brushWidth" :min="1" :max="50" :step="1" label snap @change="val => {updateBrushWidth(val)}"/>
        </div>
      </div>
      <!-- CLEAR -->
      <q-btn
        :size="$q.screen.lt.sm ? 'sm' : 'md'"
        :color="'dark'"
        icon="mdi-close"
        round
        @click="clearDrawing()"
      >
        <q-tooltip :disable="$q.screen.lt.sm || $q.platform.has.touch" anchor="center left" self="center right" :offset="[10, 10]">
          Clear drawing
        </q-tooltip>
      </q-btn>
    </template>
  </div>
</template>

<script>
import Swatches from "vue-swatches";
export default {
  name: "ExtraTools",
  components: { Swatches },
  data() {
    return {
      showTextSize: false,
      showLineWidth: false,
      showTextOptions: false,
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
    storeTextLayer() {
      return this.$store.getters.getPageTextLayer;
    },

    leftDrawerOpen() {
      return this.$store.getters.getLeftDrawerOpen;
    }
  },
  methods: {
    leftPos() {
      if (this.leftDrawerOpen) {
        return ((((this.pageDimensions.maxWidth - this.pageDimensions.width) / 2) + (this.pageDimensions.width + 20)) + 300) + 'px';
      } else {
        return (((this.pageDimensions.maxWidth - this.pageDimensions.width) / 2) + (this.pageDimensions.width + 20)) + 'px';
      }
    },

    fillColor() {
      this.$store.commit('setSubMode', "fill");
    },

    line() {
      this.$store.commit('setSubMode', "line");
    },

    rect() {
      this.$store.commit('setSubMode', "rect");
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

    setBackgroundColor() {
      this.$store.commit('setToolAction', 'setBackgroundColor');
      this.$store.commit('setSubMode', "background");
    },

    pageText() {
      this.$store.commit('setSubMode', "text");
    },

    setEraser() {
      this.$store.commit('setSubMode', "eraser");
    },

    setDraw() {
      this.$store.commit('setSubMode', "brush");
    },

    setSelect() {
      this.$store.commit('setSubMode', "select");
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
      this.$store.commit('setToolAction', 'addTextBlock');
    },

    deleteTextBlock() {
      this.$store.commit('setToolAction', 'deleteTextBlock');
    },

    backgroundRemoveImage() {
      this.$store.commit('setToolAction', 'backgroundRemoveImage');
    },

    updateBrushWidth(newVal) {
      const payload = {
        brushWidth: newVal
      };
      this.$store.commit('setSettings', payload);
    },

    updateImageOpacity(newVal) {
      const payload = {
        imageOpacity: newVal
      };
      this.$store.commit('setSettings', payload);
    },
    updateLineWidth(newVal) {
      const payload = {
        lineWidth: newVal
      };
      this.$store.commit('setSettings', payload);
    },

    updateTextBoxOptions(newVal, type) {
      let payload = {};
      let textLayer = this.storeTextLayer[this.settings.activeEditor];
      if (type === 'borderWidth') {
        payload['textBoxBorderWidth'] = newVal;
        textLayer['borderWidth'] = newVal;
      } else if (type === 'opacity') {
        payload['textBoxOpacity'] = newVal;
        textLayer['opacity'] = newVal;
      } else if (type === 'backgroundColor') {
        payload['textBoxBackgroundColor'] = newVal;
        textLayer['backgroundColor'] = newVal;
      } else if (type === 'borderColor') {
        payload['textBoxBorderColor'] = newVal;
        textLayer['borderColor'] = newVal;
      }
      /* Update settings */
      this.$store.commit('setSettings', payload);
      /* Update page */
      payload = {
        user: this.user,
        storyKey: this.$route.params.id,
        pageKey: this.activePage.id,
        index: this.settings.activeEditor,
        textLayer: textLayer
      };
      this.$store.dispatch('updatePageText', payload);
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
    /** Toggles  */
    resetSliders() {
      this.showTextOptions = false;

      const payload = {
        showImageOpacity: false,
        showBrushWidth: false
      };
      this.$store.commit('setSettings', payload);
    },

    toggleTextSize() {
      this.showTextSize = !this.showTextSize;
    },

    toggleTextOptions() {
      if (this.showTextOptions) {
        this.showTextOptions = false;
        this.$store.commit('setSubMode', "text");
      } else {
        this.showTextOptions = true;
        this.$store.commit('setSubMode', "options");
      }
    },

    toggleBrushWidth() {
      const payload = {
        showBrushWidth: !this.settings.showBrushWidth
      };
      this.$store.commit('setSettings', payload);
    },

    toggleImageOpacity() {
      const payload = {
        showImageOpacity: !this.settings.showImageOpacity
      };
      this.$store.commit('setSettings', payload);
    },

    toggleLineWidth() {
      this.showLineWidth = !this.showLineWidth;
    },
  },
  watch: {
    modes: {
      handler: function(newMode, oldMode) {
        if(this.modes.subMode !== 'options') {
          this.showTextOptions = false;
        }
      },
      deep: true
    },
    settings: {
      handler: function(newSettings, oldSettings) {
        if (this.storeTextLayer && this.storeTextLayer.length > 0 &&
        (newSettings.activeEditor !== oldSettings.activeEditor || !oldSettings.activeEditor)) {
          let payload = {};
          if(this.storeTextLayer[this.settings.activeEditor].borderWidth !== this.settings.textBoxBorderWidth) {
            /* Border width changed */
            payload['textBoxBorderWidth'] = this.storeTextLayer[this.settings.activeEditor].borderWidth;
          }
          if(this.storeTextLayer[this.settings.activeEditor].borderColor !== this.settings.textBoxBorderColor) {
            /* Border color changed */
            payload['textBoxBorderColor'] = this.storeTextLayer[this.settings.activeEditor].borderColor;
          }
          if(this.storeTextLayer[this.settings.activeEditor].opacity !== this.settings.textBoxOpacity) {
            /* Opacity changed */
            payload['textBoxOpacity'] = this.storeTextLayer[this.settings.activeEditor].opacity;
          }
          if(this.storeTextLayer[this.settings.activeEditor].backgroundColor !== this.settings.textBoxBackgroundColor) {
            /* bg color changed */
            payload['textBoxBackgroundColor'] = this.storeTextLayer[this.settings.activeEditor].backgroundColor
          }
          if(!this.settings.isSelected && this.settings.showImageOpacity) {
            const payload = {
              showImageOpacity: false
            };
            this.$store.commit('setSettings', payload);
          }
          if (Object.keys(payload).length > 0) {
            /* only update if changed */
            this.$store.commit('setSettings', payload);
            this.$store.commit('setSubMode', "text");
            this.showTextOptions = false;
          }
        }
      },
      deep: true
    },
  }
};
</script>

<style lang="stylus">
@import '~variables'
.color-picker-input {
  visibility: none;
}
.extra-tools {
  display: flex;
  position: fixed;
  top: 47px;
  right: 0;
  z-index: 100;
  flex-direction: column;
  justify-content: center;
  width: 45px;
  transition: left .2s ease-in-out;
  .attention-wrapper {
    border-radius: 50%;
  }
  .btn-attention {
    animation: pulse 2s infinite;
  }
  .q-slider-handle {
    width: 20px;
    height: 20px;
  }
}
.touch {
  .extra-tools {
    .q-slider-handle {
      width: 30px;
      height: 30px;
    }
  }
}

.extra-tools > * {
  margin-bottom: 5px;
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
  z-index: 100;
  padding: 5px;
  background-color: #fff;
  box-shadow: 0 1px 5px rgba(0,0,0,0.2), 0 2px 2px rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12);
  border-radius: 3px;
}

@media(max-width: $breakpoint-xs) {
  .extra-tools {
    width: 35px;
  }
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.7);
  }

  70% {
    transform: scale(1);
    box-shadow: 0 0 0 10px rgba(0, 0, 0, 0);
  }

  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
  }
}

</style>