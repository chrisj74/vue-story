<template>
  <!-- EXTRA TOOLS -->
  <div class="extra-tools" v-if="pageDimensions" key="extra-tools">
    <!-- COLORS -->
    <swatches
      :value="settings.color"
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
      <!-- ADD TEXT BLOCK -->
      <q-btn
        v-if="modes.mode === 'page'"
        key="addTextBlock"
        icon="mdi-plus-circle"
        size="sm"
        :color="'primary'"
        round
        @click="addTextBlock()"
      />
      <!-- DELETE OBJ -->
      <q-btn
        size="sm"
        color="negative"
        icon="mdi-delete"
        round
        @click="deleteTextBlock()"
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
  },
  methods: {
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
    },

    setEraser() {
      this.$store.commit('setSubMode', "eraser");
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
};
</script>

<style lang="stylus">
@import '~variables'
.color-picker-input {
  visibility: none;
}
.extra-tools {
  width: 50px;
  display: flex;
  position: fixed;
  right: 0;
  z-index: 3;
  flex-direction: column;
  justify-content: center;
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
  z-index: 1000;
}


@media (orientation: portrait) {
  .extra-tools {
    flex-direction: row;
    width: 100%;
    position: relative;
    margin-top: 5px;
    > * {
      margin-bottom: 0;
    }
  }
  .tool-slider .q-slider-wrap {
    width: 200px;
    left: -20px;
    right: auto;
    top: -30px;
    z-index: 1000;
  }
  .vue-swatches__container:not(.vue-swatches--inline) {
    bottom: 40px;
  }

}

</style>