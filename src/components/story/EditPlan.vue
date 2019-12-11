<template>
  <div class="plan-container">
    <div class="plan-thumbs">
      Thumbs
      <div id="plan-thumb-wrapper">
        <draggable class="plan-thumb-draggable" v-model="plan">
          <div
            v-for="(lesson, index) of plan"
            :key="lesson.uuid"
            class="plan-thumb"
            :class="{'active-plan-thumb': index === activeLesson}"
          >
            <span @click="setLesson(index)">{{ lesson.title ? lesson.title : index }}</span>
            <span v-if="index !== 0" @click="deleteLesson(index)" class="mdi mdi-trash-can"></span>
          </div>
        </draggable>
      </div>
      <q-btn @click="addLesson()">Add Lesson</q-btn>
    </div>
    <div class="plan-form">
      <!-- Title -->
      <q-input :value="plan[activeLesson].title" float-label="Title" @input="val => {changeTitle(val)}" />
      <!-- Video -->
      <q-input :value="plan[activeLesson].video" float-label="Video Embed URL" placeholder="e.g. https://www.youtube.com/embed/abcdefg_123" @input="val => {changeVideo(val)}" />
      <!-- Editor toolbar -->
      <div id="planToolbar">

      </div>
      <!-- Editor -->
      <div class="plan-editor">
        <tinymce-editor
          v-model="editorContent"
          v-if="editorConfig"
          class="editor"
          api-key="p0igcqysw2jkny4v7wki9qyg6p05lplhpctohfurcbsjc7dp"
          :init="editorConfig"
          @onActivate="onEditorReady($event)">
        </tinymce-editor>
      </div>

    </div>
    <div>
      <q-list v-if="plan[activeLesson].pages">
        <q-list-header>Pages</q-list-header>
        <q-item tag="label" v-for="(page, index) of this.pages" :key="page.id">
          <q-item-side>
            <q-checkbox v-model="plan[activeLesson].pages" :val="page.id" color="primary" @input="(val) => {updatePages(index, val)}" />
          </q-item-side>
          <q-item-main>
            <q-item-tile>{{ page.id }}</q-item-tile>
            <!-- <q-item-tile sublabel>Notify me about updates to apps or games that I downloaded</q-item-tile> -->
          </q-item-main>
        </q-item>
      </q-list>
    </div>
    <div class="plan-preview" ref="planPreview">
      <div v-if="plan[activeLesson].videoObj && plan[activeLesson].videoObj.id" class="plan-video" ref="planPreviewVideo">
        <iframe
          style="width: 100%"
          :src="'https://www.youtube.com/embed/' + plan[activeLesson].videoObj.id + '?playsinline=1'"
          frameborder="0"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          v-if="plan[activeLesson].videoObj.service === 'youtube'"></iframe>
        <iframe
          :src="'https://player.vimeo.com/video/' + plan[activeLesson].videoObj.id + '?color=80a998&title=0&byline=0&portrait=0'"
          frameborder="0" allow="autoplay; fullscreen"
          allowfullscreen
          v-if="plan[activeLesson].videoObj.service === 'vimeo'"></iframe>
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
import draggable from "vuedraggable";
import uuid from 'uuidv4';

export default {
  name: 'PlanEditor',
  components: {
    'tinymce-editor': Editor,
    draggable

  },
  data() {
    return {
      editorContent: 'Loading',
      previewContent: 'Loading',
      editorConfig: null,
      cursorSelection: null,
      contentSet: false,
      textHeight: 100,
      activeLesson: 0
    }
  },
  mounted() {
    const _this = this;
    this.$nextTick()
      .then(function () {
        _this.initEditor();

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
    plan: {

      get() {
        return this.$store.getters.getPlan;
      },
      set(value) {
        const payload = {
          user: this.user,
          storyKey: this.$route.params.id,
          plan: value
        };
        this.scrollTop = -1;
        this.$store.dispatch("updateStory", payload);
      }
    },
    pages() {
      return this.$store.getters.getPages;
    },
    settings() {
      return this.$store.getters.getSettings;
    }
  },
  methods: {
    setLesson(index) {
      this.activeLesson = index;
      this.initEditor();
    },

    initEditor() {
      if (this.plan && this.plan[this.activeLesson].text !== this.editorContent) {
        if(this.plan[this.activeLesson].text !== '') {
          this.editorContent = _.cloneDeep(this.plan[this.activeLesson].text);
        } else {
          this.editorContent = ' ';
        }
        this.previewContent = this.editorContent;
        this.setTextHeight();
      }
    },

    addLesson() {
      const plan = _.cloneDeep(this.plan);
      const newLesson = {
        text: ' ',
        title: '',
        video: '',
        uuid: uuid(),
        videoObj: {},
        pages: []
      }
      plan.push(newLesson);

      const payload = {
        user: this.user,
        storyKey: this.$route.params.id,
        plan: plan
      };
      this.scrollTop = -1;
      this.$store.dispatch("updateStory", payload).then(() => {
        this.activeLesson = plan.length - 1;
        this.initEditor();
      });
    },

    deleteLesson(index) {
      const plan = _.cloneDeep(this.plan);
      plan.splice(index, 1);

      const payload = {
        user: this.user,
        storyKey: this.$route.params.id,
        plan: plan
      };
      this.scrollTop = -1;
      this.$store.dispatch("updateStory", payload).then(() => {
        this.activeLesson = plan.length - 1;
        this.initEditor();
      });
    },

    setTextHeight() {
      this.textHeight = this.$refs.planPreviewVideo ? (this.$refs.planPreview.clientHeight - (this.$refs.planPreviewVideo.clientHeight + 10)) : this.$refs.planPreview.clientHeight;
    },

    onEditorReady() {
      this.contentSet = true;
    },

    changeVideo(videoPath) {
      const payload = {
          user: this.user,
          storyKey: this.$route.params.id,
          planIndex: this.activeLesson,
          plan: {
            title: this.plan[this.activeLesson].title,
            video: videoPath,
            videoObj: getVideoId(videoPath),
            text: this.plan[this.activeLesson].text,
            pages: this.plan[this.activeLesson].pages,
            uuid: this.plan[this.activeLesson].uuid ? this.plan[this.activeLesson].uuid : uuid()
          }
      };
      this.$store.dispatch('updateStory', payload);
    },

    updatePages (index, val) {
      console.log('val=', val);
    },

    changeTitle(title) {
      const payload = {
          user: this.user,
          storyKey: this.$route.params.id,
          planIndex: this.activeLesson,
          plan: {
            title: title,
            video: this.plan[this.activeLesson].video,
            videoObj: this.plan[this.activeLesson].videoObj,
            text: this.plan[this.activeLesson].text,
            pages: this.plan[this.activeLesson].pages,
            uuid: this.plan[this.activeLesson].uuid ? this.plan[this.activeLesson].uuid : uuid()
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
              planIndex: this.activeLesson,
              plan: {
                title: this.plan[this.activeLesson].title,
                video: this.plan[this.activeLesson].video,
                videoObj: this.plan[this.activeLesson].videoObj,
                text: this.editorContent,
                pages: this.plan[this.activeLesson].pages,
                uuid: this.plan[this.activeLesson].uuid ? this.plan[this.activeLesson].uuid : uuid(),
              }
          };
          this.$store.dispatch('updateStory', payload);
          this.previewContent = this.editorContent;
      }, 1000)
    },

    story: {
      handler: function(to, from) {

        this.setTextHeight();
        this.editorContent = _.cloneDeep(this.plan[this.activeLesson].text);
        this.previewContent = this.editorContent;
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
  .plan-thumbs {
    width: 100px;
    padding: 5px;
    #plan-thumb-wrapper {
      margin-top: 5px;
      padding-top: 3px;
      max-height: calc(100vh - 190px);
      max-height: calc((var(--vh, 1vh) * 100) - 190px);
      overflow: auto;

      .plan-thumb-draggable {
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: center;
      }
      .plan-thumb.active-plan-thumb {
        border: solid 3px $primary;
      }
      .plan-thumb {
        padding: 2px;
        max-width: 100%;
        overflow: hidden;
        border: solid 3px #aeaeae;
      }
    }
  }
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
      height: calc(100% - 130px);
      position: relative;
    }
  }
  .plan-preview {
    min-width: 200px;
    width: 20%;
    box-shadow: 0 1px 5px rgba(0,0,0,0.2), 0 2px 2px rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12);
    padding: 10px;
  }
}

</style>