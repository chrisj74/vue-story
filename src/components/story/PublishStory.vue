<template>
  <q-modal-layout>
    <!-- HEADER -->
    <q-toolbar slot="header">
      <q-toolbar-title>
        Publish Project
      </q-toolbar-title>
    </q-toolbar>

    <!-- CONTENT -->
    <div class="modal-inner-content layout-padding" v-if="!loading">
      <!-- Title -->
      <h2>{{ story.title }}</h2>
      <!-- Description -->
      <div v-html="story.description"></div>
      <!-- Cover -->
      <div class="cover-image-container">
        <div class="cover-image-thumb">
          <img :src="story.thumb" />
        </div>
      </div>
      <!-- Category -->
      <q-input type="text" v-model="category" float-label="Category" class="text-input" />
      <!-- keywords -->
      <q-chips-input v-model="keywords" add-icon="mdi-plus-circle" float-label="Keywords" />
    </div>

    <!-- FOOTER -->
    <q-toolbar slot="footer">
        <q-btn color="white" text-color="black" @click="resetClose()">Cancel</q-btn>
        <q-toolbar-title></q-toolbar-title>
        <q-btn color="secondary" text-color="black" icon="mdi-plus-circle" @click="publishStory()">Publish</q-btn>
    </q-toolbar>

  </q-modal-layout>
</template>

<script>
import AddImage from "./PixabaySearch";
import * as _ from 'lodash';

export default {
  name: 'PublishStory',
  components: { AddImage },
  props: ['storyId'],
  data() {
      return {
        submitting: false,
        keywords: [],
        category:null,
        publishSettings: {},
      }
  },
  mounted() {
    /** Reset data */
    this.publishSettings['title'] = this.story.title;
    this.publishSettings['description'] = this.story.description;
    this.publishSettings['cover'] = this.story.thumb;
    this.publishSettings['projectId'] = this.storyId;
    this.publishSettings['projectUserId'] = this.user.id;
    this.publishSettings['author'] = this.activeProfile.nickName,
    this.publishSettings['authorAvatar'] = this.activeProfile.profilePic,
    this.publishSettings['dateCreated'] = new Date();
    this.publishSettings['publishId'] = this.story.publishId ? this.story.publishId : null;
    this.submitting = false;

    this.setActiveProject();

  },
  computed: {
    user() {
        return this.$store.getters.user;
    },
    loading() {
        return this.$store.getters.loading;
    },
    screen() {
        return this.$store.getters.screen;
    },
    modes() {
      return this.$store.getters.getModes;
    },
    insertImage() {
      return this.$store.getters.getInsertImage;
    },
    settings() {
      return this.$store.getters.getSettings;
    },
    story() {
      return this.$store.getters.getStoryById(this.storyId);
    },
    projects() {
      return this.$store.getters.getPublishedProjects;
    },
    profiles () {
      return this.$store.getters.profiles;
    },
    activeProfile () {
      return this.$store.getters.profile;
    },
    isAdmin () {
      return this.$store.getters.isAdmin;
    }
  },
  methods: {
    setActiveProject() {
      const activeProject = this.projects.find(project => {
        return project.publishId === this.story.publishId;
      });
      if (activeProject) {
        this.keywords = activeProject.keywords;
        this.category = activeProject.category;
      }
    },

    publishStory() {
      const _this = this;
      if (this.user) {
        const actionString = this.publishSettings.publishId ? 'updatePublishStory' : 'addPublishStory';
        const payload = _.cloneDeep(this.publishSettings);
        payload['keywords'] = this.keywords;
        payload['category'] = this.category;

        this.$store.dispatch(actionString, _.cloneDeep(payload)).then( () => {
            _this.resetClose()
          }
        );
      }
    },

    resetClose() {
      this.submitting = false;
      this.publishSettings = {};
      this.keywords = [];
      this.category = null;
      const payload = {
        showPublishStory: false,
      };
      this.$store.commit('setSettings', payload);
      this.$store.commit('setMode', "text");
      this.$store.commit('setSubMode', "text");
    }
  },
  watch: {
    story: {
      handler: function(newStory, oldStory) {
        this.publishSettings['title'] = this.story.title;
        this.publishSettings['description'] = this.story.description;
        this.publishSettings['cover'] = this.story.thumb;
        this.publishSettings['projectId'] = this.storyId;
        this.publishSettings['projectUserId'] = this.user.id;
        this.publishSettings['author'] = this.activeProfile.nickName,
        this.publishSettings['authorAvatar'] = this.activeProfile.profilePic,
        this.publishSettings['dateCreated'] = new Date();
        this.publishSettings['publishId'] = this.story.publishId ? this.story.publishId : null;
        this.setActiveProject();
      },
      deep: true
    },
    projects: {
      handler: function(newProjects, oldProjects) {
        this.setActiveProject();
      }
    }
  }
}
</script>

<style lang="stylus">
@import '~variables';
.modal-inner-content {
  .text-input {
    margin-bottom: 20px;
  }
  .cover-image-container {
    margin: 0 auto 20px auto;
    display: flex;
    justify-content: center;
    flex-direction: column;
    max-width: 350px;
    .cover-image-thumb {
      display: flex;
      justify-content: center;
      margin-bottom: 10px;
      img {
        max-width: 200px;
        box-shadow: 0 1px 5px rgba(0,0,0,0.2), 0 2px 2px rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12);
        border: solid 3px transparent;
        border-radius: 3px;
        align-self: center;
      }
    }
  }
  .page-size-wrapper {
    display: flex;
    justify-content: space-evenly;
    margin-bottom: 20px;
    .page-size {
      flex-basis: 30%;
      padding: 10px;
      box-shadow: 0 1px 5px rgba(0,0,0,0.2), 0 2px 2px rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12);
      border: solid 3px transparent;
      border-radius: 3px;
      background: #fff;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      &.selected {
        border: solid 3px $primary;
        .outline {
          border: solid 2px $primary;
        }
      }
      .outline {
        border: solid 2px #666;
        border-radius: 3px;
        margin-bottom: 5px;
        &.portrait {
          width: 50%;
          &:after {
            content: "";
            padding-top: 150%;
            position: relative;
            display: block;
          }
        }
        &.landscape {
          width: 80%;
          &:after {
            content: "";
            padding-top: 50%;
            position: relative;
            display: block;
          }
        }
        &.square {
          width: 50%;
          &:after {
            content: "";
            padding-top: 100%;
            position: relative;
            display: block;
          }
        }
      }
    }
  }
  .add-actions, .cover-image-actions {
    display: flex;
    justify-content: space-between;
  }
}

</style>