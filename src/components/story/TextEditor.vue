<template>
  <vue-draggable-resizable
    :prevent-deactivation="true"
    :w="storeTextLayer[layerIndex].width"
    :h="storeTextLayer[layerIndex].height"
    :x="storeTextLayer[layerIndex].x"
    :y="storeTextLayer[layerIndex].y"
    :scaling="pageDimensions.zoom"
    @dragstop="onDrag"
    @resizestop="onResize"
    :parent="true"
    :drag-handle="'.drag-handle'"
    :active="active"
    :class="{print: print}"
    >
    <quill-editor
      :content="editorContent"
      ref="textLayerEditor"
      @ready="onEditorReady($event)"
      @change="onEditorChange($event)"
      @focus="onEditorFocus($event)"
      :options="editorConfig"
      class="editor"
      v-if="active && editorContent && editorConfig">
    </quill-editor>
    <div v-else v-html="storeTextLayer[layerIndex].text" class="text-render ql-editor ql-container"></div>
    <div class="drag-handle" v-if="active"><i class="mdi mdi-cursor-move"></i></div>
  </vue-draggable-resizable>
</template>

<script>

import VueDraggableResizable from 'vue-draggable-resizable';
import * as _ from 'lodash';

export default {
  name: 'TextEditor',
  components: {
    VueDraggableResizable,
  },
  props: ['zoom','active','pageWidth','pageHeight','print','textLayerIndex'],
  data() {
    return {
      layerIndex: this.textLayerIndex,
      editorContent: 'Loading',
      editorConfig: null,
      cursorSelection: null,
      contentSet: false,
    }
  },
  mounted() {
    if (this.storeTextLayer && this.storeTextLayer[this.layerIndex].text !== this.editorContent) {
      if(this.storeTextLayer[this.layerIndex].text !== '') {
        this.editorContent = _.cloneDeep(this.storeTextLayer[this.layerIndex].text);
      } else {
        this.editorContent = ' ';
      }

    }
    this.editorConfig = {
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
          syntax: {
            highlight: text => hljs.highlightAuto(text).value
          }
        }
      };
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
  },
  methods: {
    onEditorChange: _.debounce(function(event) {
      if (!this.contentSet) {
        /** First time content loaded move cursor to the end */
        this.contentSet = true;
        event.quill.focus();
        const range = this.cursorSelection ? this.cursorSelection : {index: this.editorContent.length, length:0};
        event.quill.setSelection(range, 'api');
        this.cursorSlection = null;
      }
      if (this.user && event.html !== this.editorContent) {
        this.editorContent = event.html;
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
                  text: event.html === '' ? ' ' : event.html
                }
            };
            this.$store.dispatch('updatePageText', payload)
        }
    }, 500),

    onEditorFocus(quill) {
      const payload = {
        activeEditor: this.layerIndex
      };
      this.$store.commit('setSettings', payload);
    },
    onEditorReady(quill) {
      this.contentSet = true;
      quill.setSelection(this.editorContent.length, 0, 'api');
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
              text: this.editorContent === '' ? ' ' : this.editorContent
            }
        };
        this.$store.dispatch('updatePageText', payload);
      }
    }, 500),
    onDrag: _.debounce(function (x, y) {
      // console.log('onDrag x=', x, ' y=', y);
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
              text: this.editorContent === '' ? ' ' : this.editorContent
            }
          };
          this.$store.dispatch('updatePageText', payload);
      }
    }, 500),
  },
  watch: {
    editorContent: {
      handler: function(from, to) {
        /* if (this.editor && !this.editor.cursors) {
          console.log('no cursor yet');
          const cursors = this.editor.getModule('cursors');
          console.log('module =', cursors);
          cursors.createCursor(1, 'User 1', 'red');
          console.log('this.editor.cursors=', this.editor.cursors);
        } */
        // console.log('watcher', this.cursorSelection.index);
        // this.editor.setSelection(this.cursorSelection);
        /* this.$nextTick(() => {
          const editorToolbar = document.querySelectorAll('.ql-toolbar.ql-snow ');
          console.log('editorToolbar=', editorToolbar);
          editorToolbar[0].style.transform = 'scale(' + (1 / this.zoom) + ')';
        }); */
      }
    },
    storeTextLayer: {
      handler: function(to, from) {
        /* console.log('storeTextLayer watcher=');
        console.log('store text=', this.storeTextLayer[this.layerIndex].text);
        console.log('this.editorContent=', this.editorContent);
        console.log('this.layerIndex=', isNaN(this.layerIndex)) */
        if (this.storeTextLayer && !isNaN(this.layerIndex) && this.storeTextLayer[this.layerIndex].text !== this.editorContent) {
          /* console.log('update text from store');
          console.log('this.editor=selection.cursor.selection.lastRange', this.editor.selection.cursor.selection.lastRange); */
          this.cursorSelection = this.editor.selection.cursor.selection.lastRange;
          this.contentSet = false;
          this.editorContent = _.cloneDeep(this.storeTextLayer[this.layerIndex].text);

          // this.editor.setSelection(lastRange, 'api');
        }
      },
      deep: true
    },
    layerIndex: {
      handler: function(to, from) {
        if (this.storeTextLayer && this.layerIndex && this.storeTextLayer[this.layerIndex].text !== this.editorContent) {
          this.editorContent = _.cloneDeep(this.storeTextLayer[this.layerIndex].text);
          this.editor.setSelection(this.editorContent.length, 0, 'api');
        }
      },
      deep: true
    },
    toolAction: {
      handler: function(newAction, oldAction) {

      }
    }
    /* active: {
      handler: function(to, from) {
        console.log('from=', from, ' to=', to);
        if (to) {
          console.log('isactive');
          // text has become active move cursor to end
          this.$nextTick(() => {
            console.log('this.editor =', this.editor);
            this.editor.setSelection(5, 1, 'api');
          });

        }
      },
      deep: true
    }*/
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
.editor-box {
  border: 1px #999 dashed;
}
.drag-handle {
  position: absolute;
  bottom: 0;
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
  background-color: rgba(255,255,255,.5);
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
}

.vdr {
  border: dashed 1px rgba(0,0,0,0.2);
  &.active {
    border-color: rgba(0,0,0,1);
  }
  &.print {
    border: none;
  }
}
.blot-formatter__proxy-image {
  z-index: 105;
}


</style>
