<template>
  <div class="tools" v-if="pageDimensions" :style="{width: (pageDimensions.maxWidth) + 'px', left: leftDrawerOpen ? '300px' : 0}">
    <!-- HISTORY -->
    <q-btn icon="mdi-undo" round @click="undo()" :disable="!canUndo" :size="$q.screen.lt.sm ? 'sm' : 'md'"/>
    <q-btn icon="mdi-redo" round @click="redo()" :disable="!canRedo" :size="$q.screen.lt.sm ? 'sm' : 'md'"/>
    <!-- TEXT -->
    <q-btn
      icon="mdi-format-text"
      :color="modes.mode === 'text' ? 'primary' : 'dark'"
      round
      :size="$q.screen.lt.sm ? 'sm' : 'md'"
      @click="setText()"
    >
      <q-tooltip :disable="$q.screen.lt.sm || $q.platform.has.touch" anchor="bottom middle" self="top middle" :offset="[10, 10]">
        Text Mode
      </q-tooltip>
    </q-btn>
    <!-- PHOTO -->
    <q-btn
      icon="mdi-camera"
      :color="modes.mode === 'photo' ? 'primary' : 'dark'"
      round
      :size="$q.screen.lt.sm ? 'sm' : 'md'"
      @click="setPhoto()"
    >
      <q-tooltip :disable="$q.screen.lt.sm || $q.platform.has.touch" anchor="bottom middle" self="top middle" :offset="[10, 10]">
        Image Mode
      </q-tooltip>
    </q-btn>
    <!-- DRAW -->
    <q-btn
      icon="mdi-pencil"
      :color="modes.mode === 'draw' ? 'primary' : 'dark'"
      round
      :size="$q.screen.lt.sm ? 'sm' : 'md'"
      @click="setDraw()"
    >
      <q-tooltip :disable="$q.screen.lt.sm || $q.platform.has.touch" anchor="bottom middle" self="top middle" :offset="[10, 10]">
        Drawing Mode
      </q-tooltip>
    </q-btn>
    <!-- SHAPE -->
    <!-- <q-btn
      icon="mdi-shape"
      :color="modes.mode === 'shape' ? 'primary' : 'dark'"
      round
      :size="$q.screen.lt.sm ? 'sm' : 'md'"
      @click="setShape()"
    >
      <q-tooltip :disable="$q.screen.lt.sm || $q.platform.has.touch" anchor="bottom middle" self="top middle" :offset="[10, 10]">
        Shape Mode
      </q-tooltip>
    </q-btn> -->
    <!-- PAGE -->
    <q-btn
      icon="mdi-file-image"
      :color="modes.mode === 'page' ? 'primary' : 'dark'"
      round
      :size="$q.screen.lt.sm ? 'sm' : 'md'"
      @click="setPage()"
    >
      <q-tooltip :disable="$q.screen.lt.sm || $q.platform.has.touch" anchor="bottom middle" self="top middle" :offset="[10, 10]">
        Page Mode
      </q-tooltip>
    </q-btn>
    <!-- ZOOM IN -->
    <q-btn
      icon="mdi-magnify-plus"
      color="dark"
      round
      :size="$q.screen.lt.sm ? 'sm' : 'md'"
      :disabled="!pageDimensions || pageDimensions.zoom >= pageDimensions.maxWidthRatio"
      @click="setZoomIn()"
    >
      <q-tooltip :disable="$q.screen.lt.sm" anchor="bottom middle" self="top middle" :offset="[10, 10]">
        Zoom In
      </q-tooltip>
    </q-btn>

    <!-- ZOOM OUT -->
    <q-btn
      icon="mdi-magnify-minus"
      color="dark"
      round
      :size="$q.screen.lt.sm ? 'sm' : 'md'"
      :disabled="!pageDimensions || pageDimensions.zoom <= pageDimensions.maxHeightRatio"
      @click="setZoomOut()"
    >
      <q-tooltip :disable="$q.screen.lt.sm || $q.platform.has.touch">
        Zoom Out
      </q-tooltip>
    </q-btn>
    <!-- SHAPE -->
    <!-- <q-btn
      icon="mdi-shape"
      :color="modes.mode === 'shape' ? 'primary' : 'dark'"
      round
      :size="$q.screen.lt.sm ? 'sm' : 'md'"
      @click="setShape()"
    /> -->
  </div>
</template>

<script>


export default {
  name: "MainTools",
  data() {
    return {
      canUndo: false,
      canRedo: false,
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
    leftDrawerOpen() {
      return this.$store.getters.getLeftDrawerOpen;
    }
  },
  methods: {
    setText() {
      this.$store.commit('setMode', "text");
      this.$store.commit('setSubMode', "text");
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
      this.$store.commit('setSubMode', "select");
    },

    setShape() {
      this.$store.commit('setMode', "shape");
      this.$store.commit('setSubMode', "line");
    },

    setPage() {
      this.$store.commit('setMode', "page");
      this.$store.commit('setSubMode', "text");
    },

    setZoomIn() {
      this.$store.commit('setToolAction', 'zoomIn');
    },

     setZoomOut() {
      this.$store.commit('setToolAction', 'zoomOut');
    },

    saveStory() {
      const payload = {
          user: this.user,
          storyKey: this.$route.params.id,
          pageKey: this.activePage.id,
          page: _.cloneDeep(this.activePage),
          restoreIndex: false,
        };
        this.$store.dispatch("updatePage", payload);
    },

    undo() {
      if (this.history.restoreIndex > 0) {
        this.$store.commit('setHistoryRestoreIndex', this.history.restoreIndex - 1);
        this.$store.commit('setHistoryUndo');
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
  },
  watch: {
    history: {
      handler: function(newH, oldH) {
        this.canUndo = this.history.restoreIndex > 0;
        this.canRedo = this.history.restoreIndex < this.history.states.length - 1;
      },
      deep: true
    },
  }
};
</script>

<style lang="stylus">
@import '~variables'

.tools {
  position: fixed;
  margin-left: 20px;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 800;
  display: flex;
  justify-content: center;
  flex-direction: row;
  background-color: #ddd;
  transition: left .2s ease-in-out;
  > button {
    margin-right: 2px;
  }
}
@media (max-width: $breakpoint-md) and (orientation: portrait) {
  .tools {
    margin-top: 5px;
  }
}
</style>