<template>
  <vue-draggable-resizable
    :prevent-deactivation="true"
    :w="storeTextLayer[layerIndex].width"
    :h="storeTextLayer[layerIndex].height"
    :x="storeTextLayer[layerIndex].x"
    :y="storeTextLayer[layerIndex].y"
    @dragstop="onDrag"
    @dragging="onDragging"
    @resizestop="onResize"
    :parent="'.text-layer'"
    :drag-handle="'.drag-handle'"
    :active="active"
    :class="{print: print, 'text-mode' : modes.mode === 'text'}"
    class="text-box"
    >
    <div
      class="text-outer-box"
      :style="{
        borderWidth: storeTextLayer[layerIndex].borderWidth + 'px',
        borderColor: storeTextLayer[layerIndex].borderColor,
        backgroundColor: backgroundColor}">
      <tinymce-editor
        :key="activePage.id + '_text_' + layerIndex"
        v-model="editorContent"
        class="editor"
        v-if="editorConfig"
        api-key="p0igcqysw2jkny4v7wki9qyg6p05lplhpctohfurcbsjc7dp"
        :init="editorConfig"
        @onActivate="onEditorReady($event)"
        @onFocus="onEditorFocus($event)"
        @onBlur="onEditorBlur($event)">
      </tinymce-editor>

      <div v-else v-html="storeTextLayer[layerIndex].text" class="text-render ql-editor ql-container"></div>
    </div>
    <div class="drag-handle" v-if="active && layerIndex === settings.activeEditor"><i class="mdi mdi-cursor-move"></i></div>
  </vue-draggable-resizable>
</template>

<script>

import VueDraggableResizable from 'vue-draggable-resizable';
import * as _ from 'lodash';
import Editor from '@tinymce/tinymce-vue';


export default {
  name: 'TextEditor',
  components: {
    VueDraggableResizable,
    'tinymce-editor': Editor
  },
  props: ['zoom','pageWidth','pageHeight','print','textLayerIndex'],
  data() {
    return {
      layerIndex: this.textLayerIndex,
      editorContent: 'Loading',
      editorConfig: null,
      editorToolbar: null,
      cursorSelection: null,
      contentSet: false,
      active: false,
    }
  },
  mounted() {
    if (this.storeTextLayer && this.storeTextLayer[this.layerIndex].text !== this.editorContent) {
      if(this.storeTextLayer[this.layerIndex].text !== '') {
        this.editorContent = _.cloneDeep(this.storeTextLayer[this.layerIndex].text);
      } else {
        this.editorContent = ' ';
      }
      const payload = {
        activeEditor: this.layerIndex
      };
      this.$store.commit('setSettings', payload);
    }

    this.editorConfig = {
      plugins: 'wordcount, table, media, emoticons, lists',
      inline: true,
      fixed_toolbar_container: '.text-toolbar-wrapper',
      menubar: false,
      draggable_modal: true,
      toolbar: ' alignleft aligncenter alignright | styleselect | bold italic emoticons | table media | bullist numlist | fontsizeselect fontselect | forecolor',
      contextmenu: 'inserttable | cell row column deletetable',
      mobile: {
        theme: 'mobile',
        plugins: 'lists, autolink',
        toolbar: 'undo, bold, italic, styleselect'
      }
    };

    const _this = this;

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
    storeTextLayer() {
        return this.$store.getters.getPageTextLayer;
    },
    modes() {
      return this.$store.getters.getModes;
    },
    pageDimensions() {
      return this.$store.getters.getPageDimensions;
    },
    settings() {
      return this.$store.getters.getSettings;
    },
    backgroundColor() {
      /* convert opcity to hex */
      let hexOpacity = (Math.round(this.storeTextLayer[this.layerIndex].opacity * 255)).toString(16);
      while (hexOpacity.length < 2) {
        hexOpacity = "0" + hexOpacity;
      }
      let bgColor = this.storeTextLayer[this.layerIndex].backgroundColor;
      /* manipulate color to include opacity */
      return bgColor.substring(0, 7) + hexOpacity;
    },
  },
  methods: {

    onEditorFocus(event) {
      this.active = true;
      const payload = {
        activeEditor: this.layerIndex
      };
      this.$store.commit('setSettings', payload);
    },

    onEditorBlur(event) {
      this.active = false;
    },

    onEditorReady(event) {
      if (this.modes.mode === 'text') {
        this.active = true;
      } else {
        this.active = false;
      }
      this.contentSet = true;
    },

    onResize: _.debounce(function (x, y, width, height) {
      if (this.user) {
        const payload = {
            user: this.user,
            storyKey: this.$route.params.id,
            pageKey: this.activePage.id,
            index: this.layerIndex,
            textLayer: {
              x: (x * 1),
              y: (y * 1),
              width: (width * 1),
              height: (height * 1),
              text: this.editorContent,
            }
        };
        this.$store.dispatch('updatePageText', payload);
      }
    }, 500),

    onDragging() {
      this.active = true;
    },

    onDrag: _.debounce(function (x, y) {
      if (this.user) {
          const payload = {
            user: this.user,
            storyKey: this.$route.params.id,
            pageKey: this.activePage.id,
            index: this.layerIndex,
            textLayer: {
              x: x,
              y: y,
              width: this.storeTextLayer[this.layerIndex].width,
              height: this.storeTextLayer[this.layerIndex].height,
              text: this.editorContent,
            }
          };
          this.$store.dispatch('updatePageText', payload);
      }
    }, 500),
  },
  watch: {
    $route: {
      handler: function(from, to) {
        if (
          (from.params.id === to.params.id &&
            from.params.pageId != to.params.pageId) ||
          !to.params.pageId
        ) {
          /* Update to new page */
          this.editorContent = _.cloneDeep(this.storeTextLayer[this.layerIndex].text);
        }
      },
      deep: true
    },

    editorContent: {
      handler: _.debounce(function(oldText, newText) {
        const textLayer = _.cloneDeep(this.storeTextLayer);
        const payload = {
            user: this.user,
            storyKey: this.$route.params.id,
            pageKey: this.activePage.id,
            index: this.layerIndex,
            textLayer: {
              x: (textLayer[this.layerIndex].x * 1),
              y: (textLayer[this.layerIndex].y * 1),
              width: (textLayer[this.layerIndex].width * 1),
              height: (textLayer[this.layerIndex].height * 1),
              text: _.cloneDeep(this.editorContent),
            }
        };
        this.$store.dispatch('updatePageText', payload);
      }, 1000)
    },

    storeTextLayer: {
      handler: function(to, from) {
        if (this.storeTextLayer && !isNaN(this.layerIndex))
        {
          /** Only update content from the store if needed  */
          this.editorContent = _.cloneDeep(this.storeTextLayer[this.layerIndex].text);
        }
      },
      deep: true
    },

    modes: {
      handler: function(newMode, oldMode) {
        if(this.modes.mode !== 'text') {
          this.active = false;
        }
      },
      deep: true
    }
  }
}
</script>

<style lang="stylus">
@import '~variables';
@import '../../../node_modules/vue-draggable-resizable/dist/VueDraggableResizable.css'

.text-wrapper {
  position: relative;
}

.text-render {
  padding: 12px 15px;
  overflow: hidden;
  position: absolute;
  width: 100%;
  top: 0;
  bottom: 0;
  font-size: 13px;
}
.text-outer-box {
  position: relative;
  border-style: solid;
  border-color: red;
  width: 100%;
}
.editor-box {
  border: 1px #999 dashed;
}
.drag-handle {
  position: absolute;
  bottom: -1em;
  font-size: 2em;
  z-index: 9999;
}
.active {

}
.editor {
  top: 0;
  bottom: 0;
  position: absolute;
  width: 100%;
}
.text-render, .editor {
  .ql-size-small {
    font-size: 0.75em;
  }
  .ql-size-large {
    font-size: 2em;
  }
  .ql-size-huge {
    font-size: 4em;
  }
  .ql-size-massive {
    font-size: 6em;
  }

  .ql-font-schoolbell {
    font-family: "Schoolbell", cursive;
  }

  .ql-container.ql-snow {
    border: none;
  }
}

.vdr.text-mode {
  border: dashed 1px rgba(0,0,0,0.2);
}
.vdr {
  border: dashed 1px rgba(0,0,0,0);
  display: flex;
  justify-content: stretch;
  &.print {
    border: none;
  }
}
.blot-formatter__proxy-image {
  z-index: 105;
}


</style>
