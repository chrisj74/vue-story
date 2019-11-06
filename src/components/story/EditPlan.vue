<template>
  <div class="plan-container">
    <div class="plan-form">
      <!-- Title -->
      <q-input :value="story.plan[0].title" float-label="Title" @input="val => {changeTitle(val)}" />
      <!-- Video -->
      <q-input :value="story.plan[0].video" float-label="Video Embed URL" placeholder="e.g. https://www.youtube.com/embed/abcdefg_123" @input="val => {changeVideo(val)}" />
      <!-- Editor toolbar -->
      <div id="planToolbar">

      </div>
      <!-- Editor -->
      <tinymce-editor
        v-model="editorContent"
        class="plan-editor"
        v-if="editorConfig"
        api-key="p0igcqysw2jkny4v7wki9qyg6p05lplhpctohfurcbsjc7dp"
        :init="editorConfig"
        @onActivate="onEditorReady($event)">
      </tinymce-editor>

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
import * as getVideoId from 'get-video-id';
import Editor from '@tinymce/tinymce-vue';

export default {
  name: 'PlanEditor',
  components: {
    'tinymce-editor': Editor
  },
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
        plugins: 'wordcount, table, media, emoticons, lists',
        inline: false,
        fixed_toolbar_container: '#planToolbar',
        menubar: false,
        draggable_modal: true,
        toolbar: ' alignleft aligncenter alignright | styleselect | bold italic emoticons',
        mobile: {
          theme: 'mobile',
          plugins: 'lists, autolink',
          toolbar: 'undo, bold, italic, styleselect'
        }
      };
    });
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
    settings() {
      return this.$store.getters.getSettings;
    }
  },
  methods: {
    setTextHeight() {
      this.textHeight = this.$refs.planPreviewVideo ? (this.$refs.planPreview.clientHeight - (this.$refs.planPreviewVideo.clientHeight + 10)) : 100;
    },

    onEditorReady() {
      this.contentSet = true;
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
          }
      };
      this.$store.dispatch('updateStory', payload);
    }
  },
  watch: {
    editorContent: {
      handler: _.debounce(function(oldText, newText) {
        const payload = {
              user: this.user,
              storyKey: this.$route.params.id,
              planIndex: 0,
              plan: {
                title: this.story.plan[0].title,
                video: this.story.plan[0].video,
                videoObj: this.story.plan[0].videoObj,
                text: this.editorContent,
              }
          };
          this.$store.dispatch('updateStory', payload);
      }, 1000)
    },

    story: {
      handler: function(to, from) {

        this.setTextHeight();
        this.editorContent = _.cloneDeep(this.story.plan[0].text);
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
  .tox-statusbar__branding {
    display: none;
  }
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