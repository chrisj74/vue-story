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


    <div v-if="width" :style="{ transform: 'scale('+zoom+')', height: (pageHeight - 50)+'px', width: pageWidth+'px', pointerEvents: active ? 'all' : 'none', userSelect: active ? 'all' : 'none'}" class="text-layer">
      <vue-draggable-resizable :prevent-deactivation="true" :w="500" :h="500" :x="0" :y="0" @dragging="onDrag" @resizing="onResize" :parent="true" :drag-handle="'.drag-handle'" :active="active">
        <quill-editor v-model="editorContent"
          ref="myQuillEditor"
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

export default {
  name: 'TextEditor',
  components: {
    VueDraggableResizable,
  },
  props: ['zoom','active','pageWidth','pageHeight'],
  data() {
    return {
      editorContent: '',
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
      width: 500,
      height: 800,
      x: 0,
      y: 0,
    }
  },
/*   mounted: {

  },*/
  /* computed: {
    width() {
      return
    }
  },  */
  methods: {
    onResize: function (x, y, width, height) {
      this.x = x
      this.y = y
      this.width = width
      this.height = height
    },
    onDrag: function (x, y) {
      this.x = x
      this.y = y
    }
  },
  /* watch: {
    zoom: {
      handler: function(from, to) {
        this.$nextTick(() => {
          const editorToolbar = document.querySelectorAll('.ql-toolbar.ql-snow ');
          console.log('editorToolbar=', editorToolbar);
          editorToolbar[0].style.transform = 'scale(' + (1 / this.zoom) + ')';
        });
      }
    }
  } */
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
}
.ql-toolbar.ql-snow  {
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
