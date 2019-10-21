<template>
  <div class="plan-container">
    <div class="plan-form">
      <!-- Title -->
      <q-input :value="story.plan[0].title" float-label="Title" @input="val => {changeTitle(val)}" />
      <!-- Video -->
      <q-input :value="story.plan[0].video" float-label="Video Embed URL" placeholder="e.g. https://www.youtube.com/embed/abcdefg_123" @input="val => {changeVideo(val)}" />
      <!-- Editor toolbar -->
      <div id="planToolbar">
        <span class="ql-format-group">
          <button type="button" class="ql-bold"></button>
          <button type="button" class="ql-italic"></button>
          <button type="button" class="ql-underline" v-if="$q.screen.gt.sm"></button>
          <button type="button" class="ql-blockquote" v-if="$q.screen.gt.sm"></button>
          <select class="ql-align"></select>

          <button type="button" class="ql-list" value="ordered"></button>
          <button type="button" class="ql-list" value="bullet"></button>

          <select class="ql-size"></select>
          <select class="ql-font" v-if="$q.screen.gt.sm">
            <option selected>Normal</option>
            <option value="schoolbell">Handwriting</option>
          </select>

          <select class="ql-color"></select>
          <select class="ql-background"></select>

          <button class="ql-link"></button>
          <button class="ql-video"></button>
          <button id="planTable"><i class="mdi mdi-table"></i></button>
        </span>
      </div>
      <!-- Editor -->
      <quill-editor
        :content="editorContent"
        ref="planEditor"
        @ready="onEditorReady($event)"
        @change="onEditorChange($event)"
        @focus="onEditorFocus($event)"
        @blur="onEditorBlur($event)"
        :options="editorConfig"
        class="plan-editor"
        v-if="editorContent && editorConfig">
      </quill-editor>

    </div>
    <div class="plan-preview" ref="planPreview">
      <div v-if="story.plan[0].videoObj && story.plan[0].videoObj.id" class="plan-video" ref="planPreviewVideo">
        <iframe
          style="width: 100%"
          :src="'https://www.youtube.com/embed/' + story.plan[0].videoObj.id + '?playsinline=1'"
          frameborder="0"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          v-if="story.plan[0].videoObj.service === 'youtube'"></iframe>
        <iframe
          :src="'https://player.vimeo.com/video/' + story.plan[0].videoObj.id + '?color=80a998&title=0&byline=0&portrait=0'"
          frameborder="0" allow="autoplay; fullscreen"
          allowfullscreen
          v-if="story.plan[0].videoObj.service === 'vimeo'"></iframe>
      </div>
      <div v-html="previewContent" class="plan-text ql-editor" :style="{maxHeight: textHeight + 'px'}">

      </div>
    </div>
  </div>
</template>

<script>
import * as _ from 'lodash';
import QuillBetterTable from 'quill-better-table';
import * as getVideoId from 'get-video-id';

export default {
  name: 'PlanEditor',
  data() {
    return {
      editorContent: 'Loading',
      previewContent: 'Loading',
      editorConfig: null,
      cursorSelection: null,
      contentSet: false,
      textHeight: 100,
    }
  },
  mounted() {
    const _this = this;
    this.$nextTick()
      .then(function () {
      if (_this.story && _this.story.plan[0].text !== _this.editorContent) {
        if(_this.story.plan[0].text !== '') {
          _this.editorContent = _.cloneDeep(_this.story.plan[0].text);
        } else {
          _this.editorContent = ' ';
        }
        _this.previewContent = _this.editorContent;
      }

      _this.editorConfig = {
          bounds: '.plan-preview',
          modules: {
            blotFormatter: {
              overlay: {
                style: {
                  zIndex: 105
                }
              }
            },
            cursors: true,
            toolbar: '#planToolbar',
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


        document.body.querySelector('#planTable')
        .onclick = () => {
          let tableModule = _this.editor.getModule('better-table')
          tableModule.insertTable(3, 3)
        }
      });

    this.setTextHeight();
  },
  computed: {
    editor() {
      return this.$refs.planEditor ? this.$refs.planEditor.quill : null;
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
    settings() {
      return this.$store.getters.getSettings;
    }
  },
  methods: {
    setTextHeight() {
      this.textHeight = this.$refs.planPreviewVideo ? (this.$refs.planPreview.clientHeight - (this.$refs.planPreviewVideo.clientHeight + 10)) : 100;
    },

    onEditorChange: _.debounce(function(event) {
      if (!this.contentSet) {
        /** First time content loaded move cursor to the end */
        this.contentSet = true;
        event.quill.focus();
        const range = this.cursorSelection ? this.cursorSelection : {index: this.editorContent.length, length:0};
        event.quill.setSelection(range, 'api');
        this.cursorSelection = null;
      }
      if (this.user
        && (!this.story.plan[0].delta
            || !_.isEqual(event.quill.editor.delta.ops, JSON.parse(JSON.stringify(this.story.plan[0].delta))))) {
        this.previewContent = event.html === '' ? ' ' : event.html;
        const newRange = this.cursorSelection ? this.cursorSelection : {index: this.editorContent.length, length:0};
          const payload = {
              user: this.user,
              storyKey: this.$route.params.id,
              planIndex: 0,
              plan: {
                title: this.story.plan[0].title,
                video: this.story.plan[0].video,
                videoObj: this.story.plan[0].videoObj,
                text: event.html === '' ? ' ' : event.html,
                delta: _.cloneDeep(event.quill.editor.delta.ops),
                range: newRange
              }
          };
          this.$store.dispatch('updateStory', payload);
        }
    }, 100),

    onEditorFocus(quill) {


    },

    onEditorBlur(quill) {

    },

    onEditorReady(quill) {
      this.contentSet = true;
      quill.setSelection(this.editorContent.length, 0, 'api');
    },

    changeVideo(videoPath) {
      const payload = {
          user: this.user,
          storyKey: this.$route.params.id,
          planIndex: 0,
          plan: {
            title: this.story.plan[0].title,
            video: videoPath,
            videoObj: getVideoId(videoPath),
            text: this.story.plan[0].text,
            delta: this.story.plan[0].delta,
            range: this.story.plan[0].range
          }
      };
      this.$store.dispatch('updateStory', payload);
    },

    changeTitle(title) {
      const payload = {
          user: this.user,
          storyKey: this.$route.params.id,
          planIndex: 0,
          plan: {
            title: title,
            video: this.story.plan[0].video,
            videoObj: this.story.plan[0].videoObj,
            text: this.story.plan[0].text,
            delta: this.story.plan[0].delta,
            range: this.story.plan[0].range
          }
      };
      this.$store.dispatch('updateStory', payload);
    }
  },
  watch: {
    story: {
      handler: function(to, from) {
        if ((!this.story.plan[0].delta
          || !_.isEqual(JSON.parse(JSON.stringify(this.story.plan[0].delta)), this.editor.getContents().ops))) {
          /** Only update content from the store if needed  */
          this.editorContent = this.story.plan[0].text ? _.cloneDeep(this.story.plan[0].text) : ' ';
        }
      },
      deep: true
    },
  }
}
</script>

<style lang="stylus">
@import '~variables';
.plan-container {
  display: flex;
  align-items: stretch;
  flex-direction: row;
  justify-content: space-between;
  padding: 10px;
  height: 100%
  .plan-form {
    padding: 10px;
    max-height: 100%;
    #planToolbar {
      margin-top: 10px;
    }
    .plan-editor {
      min-height: 200px;
      width: 100%;
      max-height: 100%;
    }
  }
  .plan-preview {
    min-width: 200px;
    width: 50%;
    box-shadow: 0 1px 5px rgba(0,0,0,0.2), 0 2px 2px rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12);
  }
}

</style>