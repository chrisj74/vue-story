<template>
  <vue-draggable-resizable
    :prevent-deactivation="true"
    :w="storeTextLayer[layerIndex].width"
    :h="storeTextLayer[layerIndex].height"
    :x="storeTextLayer[layerIndex].x"
    :y="storeTextLayer[layerIndex].y"
    @dragstop="onDrag"
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
      <quill-editor
        :content="editorContent"
        ref="textLayerEditor"
        @ready="onEditorReady($event)"
        @change="onEditorChange($event)"
        @focus="onEditorFocus($event)"
        @blur="onEditorBlur($event)"
        :options="editorConfig"
        class="editor"
        v-if="editorContent && editorConfig">
      </quill-editor>
      <div v-else v-html="storeTextLayer[layerIndex].text" class="text-render ql-editor ql-container"></div>
    </div>
    <div class="drag-handle" v-if="active && layerIndex === settings.activeEditor"><i class="mdi mdi-cursor-move"></i></div>
  </vue-draggable-resizable>
</template>

<script>

import VueDraggableResizable from 'vue-draggable-resizable';
import * as _ from 'lodash';
import QuillBetterTable from 'quill-better-table';


export default {
  name: 'TextEditor',
  components: {
    VueDraggableResizable,
  },
  props: ['zoom','pageWidth','pageHeight','print','textLayerIndex'],
  data() {
    return {
      layerIndex: this.textLayerIndex,
      editorContent: 'Loading',
      editorConfig: null,
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
      placeholder: '',
      bounds: '.draggable',
      modules: {
        blotFormatter: {
          overlay: {
            style: {
              transform: 'scale(' + (1 / this.zoom) + ')',
              transformOrigin: 'top left',
              zIndex: 105
            }
          }
        },
        cursors: true,
        toolbar: '#toolbar'+this.layerIndex,
        /* syntax: {
          highlight: text => hljs.highlightAuto(text).value
        }, */
        table: false,  // disable table module
        'better-table': {
          operationMenu: {
            items: {
              unmergeCells: {
                text: 'Another unmerge cells name'
              }
            }
          }
        },
        keyboard: {
          bindings: QuillBetterTable.keyboardBindings
        }
      }
    };
    const _this = this;
    document.body.querySelector('#table'+this.layerIndex)
    .onclick = () => {
      let tableModule = _this.editor.getModule('better-table')
      tableModule.insertTable(3, 3)
    }
  },
  computed: {
    editor() {
      return this.$refs.textLayerEditor ? this.$refs.textLayerEditor.quill : null;
    },
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


    onEditorChange: _.debounce(function(event) {
      if (!this.contentSet) {
        /** First time content loaded move cursor to the end */
        this.contentSet = true;
        event.quill.focus();
        const range = this.cursorSelection ? this.cursorSelection : {index: this.editorContent.length, length:0};
        event.quill.setSelection(range, 'api');
        this.cursorSelection = null;
      }
      if (this.user && !_.isEqual(event.quill.editor.delta.ops, JSON.parse(JSON.stringify(this.storeTextLayer[this.layerIndex].delta)))) {
        const newRange = this.cursorSelection ? this.cursorSelection : {index: this.editorContent.length, length:0};
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
                text: event.html === '' ? ' ' : event.html,
                delta: _.cloneDeep(event.quill.editor.delta.ops),
                range: newRange
              }
          };

          this.$store.dispatch('updatePageText', payload);
        }
    }, 100),

    onEditorFocus(quill) {
      this.active = true;
      const payload = {
        activeEditor: this.layerIndex
      };
      this.$store.commit('setSettings', payload);
    },

    onEditorBlur(quill) {
      this.active = false;
    },

    onEditorReady(quill) {
      if (this.modes.mode === 'text') {
        this.active = true;
        quill.setSelection(this.editorContent.length, 0, 'api');
      } else {
        this.active = false;
        quill.blur();
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
              text: this.editorContent === '' ? ' ' : this.editorContent,
              delta: this.storeTextLayer[this.layerIndex].delta
            }
        };
        this.$store.dispatch('updatePageText', payload);
      }
    }, 500),
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
              text: this.editorContent === '' ? ' ' : this.editorContent,
              delta: this.storeTextLayer[this.layerIndex].delta
            }
          };
          this.$store.dispatch('updatePageText', payload);
      }
    }, 500),
  },
  watch: {
    storeTextLayer: {
      handler: function(to, from) {
        if (this.storeTextLayer && !isNaN(this.layerIndex) &&
          (!this.storeTextLayer[this.layerIndex].delta
          || !_.isEqual(JSON.parse(JSON.stringify(this.storeTextLayer[this.layerIndex].delta)), this.editor.getContents().ops))) {
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
