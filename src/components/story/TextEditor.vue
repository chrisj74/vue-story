<template>
  <div>
    <div id="toolbar" v-if="active" :style="{width: (pageWidth * zoom) + 'px'}">
      <span class="ql-format-group">
        <button type="button" class="ql-bold"></button>
        <button type="button" class="ql-italic"></button>
        <button type="button" class="ql-underline"></button>
        <button type="button" class="ql-blockquote"></button>
        <select class="ql-align"></select>

        <button type="button" class="ql-list" value="ordered"></button>
        <button type="button" class="ql-list" value="bullet"></button>

        <select class="ql-size"></select>
        <select class="ql-font"></select>

        <select class="ql-color"></select>
        <select class="ql-background"></select>

        <button class="ql-link"></button>
        <button class="ql-video"></button>
      </span>
    </div>


    <div v-if="pageWidth" :style="{ transform: 'scale('+zoom+')', height: (pageHeight - 50)+'px', width: pageWidth+'px', pointerEvents: active ? 'all' : 'none', userSelect: active ? 'all' : 'none'}" class="text-layer">
      <vue-draggable-resizable :prevent-deactivation="true" :w="draggableDimensions.width" :h="draggableDimensions.height" :x="draggableDimensions.x" :y="draggableDimensions.y" @dragging="onDrag" @resizing="onResize" :parent="true" :drag-handle="'.drag-handle'" :active="active">
        <quill-editor :content="editorContent"
          ref="textLayerEditor"
          @change="onEditorChange($event)"
          :options="editorConfig" class="editor" v-if="active">
        </quill-editor>
        <div v-else v-html="editorContent" class="text-render ql-editor ql-container"></div>
        <div class="drag-handle" v-if="active"><i class="mdi mdi-cursor-move"></i></div>
      </vue-draggable-resizable>
    </div>
  </div>

</template>

<script>

import VueDraggableResizable from 'vue-draggable-resizable';
import * as _ from 'lodash';

export default {
  name: 'TextEditor',
  components: {
    VueDraggableResizable,
  },
  props: ['zoom','active','pageWidth','pageHeight'],
  data() {
    return {
      editorContent: 'Loading',
      editorConfig: {
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
          toolbar: '#toolbar',
          syntax: {
            highlight: text => hljs.highlightAuto(text).value
          }
        }
      },
      cursorSelection: null,
    }
  },
  mounted() {
    /** Need to hydrate local prop from store, binding to store cuases cursor to move to start after keystroke */
    this.editorContent = this.storeContent;
  },
  computed: {
    editor() {
      return this.$refs.textLayerEditor.quill
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
    storeContent() {
        return this.$store.getters.getPageText;
    },
    draggableDimensions(){
      return this.$store.getters.getPageTextDimensions;
    },
  },
  methods: {
    onEditorChange: _.debounce(function(event) {
      console.log('onEditorChange event=', event.html);
      console.log('this.editorContent=', this.editorContent);
      if (this.user && event.html !== this.editorContent) {
            const payload = {
                user: this.user,
                storyKey: this.$route.params.id,
                pageKey: this.activePage.id,
                textLayer: {
                  x: (this.draggableDimensions.x * 1),
                  y: (this.draggableDimensions.y * 1),
                  width: (this.draggableDimensions.width * 1),
                  height: (this.draggableDimensions.height * 1),
                  text: event.html
                }
            };
            this.$store.dispatch('updatePageText', payload)
        }
    }, 500),
    onResize: _.debounce(function (x, y, width, height) {
      if (this.user) {
        const payload = {
            user: this.user,
            storyKey: this.$route.params.id,
            pageKey: this.activePage.id,
            textLayer: {
              x: (x * 1),
              y: (y * 1),
              width: (width * 1),
              height: (height * 1),
              text: this.editorContent
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
              textLayer: {
                x: x,
                y: y,
                width: this.draggableDimensions.width,
                height: this.draggableDimensions.height,
                text: this.editorContent
              }
          };
          this.$store.dispatch('updatePageText', payload);
      }
    }, 500)
  },
  watch: {
    editorContent: {
      handler: function(from, to) {
        // console.log('watcher', this.cursorSelection.index);
        // this.editor.setSelection(this.cursorSelection);
        /* this.$nextTick(() => {
          const editorToolbar = document.querySelectorAll('.ql-toolbar.ql-snow ');
          console.log('editorToolbar=', editorToolbar);
          editorToolbar[0].style.transform = 'scale(' + (1 / this.zoom) + ')';
        }); */
      }
    }
  }
}
</script>

<style lang="stylus">
@import '~variables';
@import '../../../node_modules/vue-draggable-resizable/dist/VueDraggableResizable.css'

:root {
  --ck-z-modal: 7000;
  --ck-z-default: 7000;
}
.text-layer {
  position: absolute;
  z-index: 100;
  top: 40px;
  left: 0;
  transform-origin: top left;
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
#toolbar {
  z-index: 101;
  &.ql-toolbar.ql-snow  {
    background: #fff;
    position: absolute;
    width: 100%;
    top: 0;
    left: 0;
    display: flex;
    flex-direction: row;
    padding: 0;
    .ql-formats {
      display: flex;
      flex-direction: row;
    }
    .ql-snow .ql-picker-options {
      z-index: 102;
    }
  }
}


.vdr {
  border: dashed 1px rgba(0,0,0,0.2);
  &.active {
    border-color: rgba(0,0,0,1);
  }
}

.blot-formatter__proxy-image {
  z-index: 105;
}

</style>
