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
    :active="active && settings.activeEditor === layerIndex"
    :class="{print: print, 'text-mode' : modes.mode === 'text'}"
    class="text-box"
    >
    <div
      class="text-outer-box"
      :style="{
        borderWidth: storeTextLayer[layerIndex].borderWidth + 'px',
        borderColor: storeTextLayer[layerIndex].borderColor,
        backgroundColor: backgroundColor}"
      :class="{'inactive-editor' : layerIndex !== settings.activeEditor}"
      @click="selectLayer()">
      <tinymce-editor
        :key="activePage.id + '_text_' + layerIndex"
        v-model="editorContent"
        class="editor"
        v-if="editorConfig"
        api-key="p0igcqysw2jkny4v7wki9qyg6p05lplhpctohfurcbsjc7dp"
        :init="editorConfig"
        :disabled="layerIndex !== settings.activeEditor"
        @onFocus="onEditorFocus"
        @onInit="onEditorReady"
        @onBlur="onEditorBlur">
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
      editor: null
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
    if (this.modes && this.modes.mode === 'text') {
      this.active = true;
    }
    if (this.$q.screen.lt.sm) {
      this.editorConfig = {
        plugins: 'wordcount, table, media, emoticons, lists',
        inline: true,
        fixed_toolbar_container: '.text-toolbar-wrapper',
        menubar: false,
        draggable_modal: true,
        toolbar: ' styleselect | bold italic emoticons' ,
        contextmenu: 'inserttable | cell row column deletetable',
        mobile: {
          theme: 'mobile',
          plugins: 'lists, autolink',
          toolbar: 'undo, bold, italic, styleselect'
        }
      };
    } else {
      this.editorConfig = {
        plugins: 'wordcount, table, media, emoticons, lists',
        inline: true,
        fixed_toolbar_container: '.text-toolbar-wrapper',
        menubar: false,
        draggable_modal: true,
        toolbar: ' alignleft aligncenter alignright | styleselect | bold italic emoticons | table media | bullist numlist | fontsizeselect fontselect | forecolor',
        toolbar_drawer: 'floating',
        font_formats: 'Handwriting=Schoolbell; Arial=arial,helvetica,sans-serif; Arial Black=arial black, sans-serif; Courier New=courier new,courier,monospace',
        fontsize_formats: '9px 11px 12px 14px 16px 18px 20px 24px 36px 48px 56px',
        contextmenu: 'inserttable | cell row column deletetable',
        mobile: {
          theme: 'mobile',
          plugins: 'lists, autolink',
          toolbar: 'undo, bold, italic, styleselect'
        }
      };
    }


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

    selectLayer() {
      if (this.settings.activeEditor !== this.layerIndex)   {
        const payload = {
          activeEditor: this.layerIndex
        };
        this.$store.commit('setSettings', payload);
      }
    },

    onEditorFocus(event, editor) {
      console.log('focus');
    },

    onEditorBlur(event) {
      console.log('blur');
    },

    onEditorReady(event, editor) {
      /* if (this.modes.mode === 'text') {
        this.active = true;
      } else {
        this.active = false;
      } */
      this.editor = editor;
      this.contentSet = true;
      if (this.layerIndex === this.settings.activeEditor && !event.target.hasFocus() && this.modes.mode === 'text') {
        editor.focus();
      }
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

    settings: {
      handler: function(newSettings, oldSettings) {
        if (newSettings.activeEditor !== oldSettings.activeEditor && this.settings.activeEditor === this.layerIndex && this.editor) {
          const _this = this;
            this.$nextTick()
              .then(function () {
                _this.editor.focus();
              });
        }
      },
      deep: true
    },

    modes: {
      handler: function(newMode, oldMode) {
        if(this.modes.mode !== 'text') {
          this.active = false;
        } else {
          this.active = true;
          if (this.settings.activeEditor === this.layerIndex) {
            this.editor.focus();
          }
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
.inactive-editor {
  user-select: none;
  .editor {
    user-select: none;
    * {
      user-select: none;
    }
  }
}
.editor {
  top: 0;
  bottom: 0;
  position: absolute;
  width: 100%;
  font-family: "Schoolbell";
  padding: 3px;
  overflow: hidden;
}
.text-render, .editor {
  h1, h2, h3, h4, h5, h6 {
    margin: 5px 0 10px 0;
  }
  p {
    margin: 2px 0 5px 0;
  }
  td {
    vertical-align: top;
    padding: 3px;
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
