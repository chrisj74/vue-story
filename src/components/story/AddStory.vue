<template>
    <q-modal-layout>
      <!-- HEADER -->
      <q-toolbar slot="header">
        <q-toolbar-title>
          Add Project
        </q-toolbar-title>
      </q-toolbar>

      <!-- CONTENT -->
      <div class="modal-inner-content">
        <!-- Profile -->
        <p>Who's Profile to use?</p>
        <div class="row justify-start profiles-sm" v-if="profiles">
          <div class="profile"
            v-for="profile in profiles"
            :key="profile.id"
            @click="changeProfile(profile.id)"
          >
            <div class="profile-avatar" :class="{'profile-active' : profile.id === profileId}">
                <div :style="{backgroundImage: 'url(' + profile.profilePic + ')'}" class="profile-img"
                  v-if="profile && profile.profilePic"
                ></div>
                <div v-else class="profile-initials" :class="{'profile-active' : profile.id === profileId}">
                  {{ getInitials(profile.nickName)}}
                </div>
            </div>
            <div class="profile-label" v-if="profile && profile.nickName">
              {{profile.nickName}}
            </div>
          </div>
        </div>
        <!-- Title -->
        <q-input type="text" v-model="title" float-label="Story Name" class="text-input" />
        <!-- Description -->
        <q-input type="textarea"
          v-model="description"
          float-label="Story Description"
          :max-height="100"
          rows="3"
          class="text-input" />
        <!-- Cover -->
        <div class="cover-image-container">
          <div class="cover-image-thumb">
            <img :src="coverImage" v-if="coverImage" />
          </div>
          <div class="cover-image-actions">
            <q-btn color="negative" icon="mdi-delete" @click="removeCoverImage" v-if="coverImage">Remove Image</q-btn>
            <q-btn color="primary" icon="mdi-image-plus" @click="showCoverImageModal()">{{ coverImage ? 'change Image' : 'Add Image'}}</q-btn>
          </div>
        </div>
        <!-- Page size -->
        <div class="page-size-wrapper">
          <div class="page-size" @click="setSize(595, 842, 0)" :class="{selected: selectedIndex === 0}">
            <div class="portrait outline"></div>
            portrait
          </div>
          <div class="page-size" @click="setSize(842, 595, 1)" :class="{selected: selectedIndex === 1}">
            <div class="landscape outline"></div>
            landscape
          </div>
          <div class="page-size" @click="setSize(595, 595, 2)" :class="{selected: selectedIndex === 2}">
            <div class="square outline"></div>
            square
          </div>
        </div>
      </div>

      <!-- FOOTER -->
      <q-toolbar slot="footer">
        <q-btn color="white" text-color="black" @click="close()">Cancel</q-btn>
        <q-toolbar-title></q-toolbar-title>
        <q-btn color="secondary" text-color="black" icon="mdi-plus-circle" @click="addStory()" :disabled="!selectedHeight || !selectedWidth || title.length === 0">Add Project</q-btn>
      </q-toolbar>

      <!-- IMAGE MODAL -->
      <template>
        <q-modal
          v-model="settings.showImageModal"
          :content-css="{minWidth: '350px', height: '90vh', maxWidth: '100%', width: '80vw'}">
          <add-image :maxWidth="500" :aspectRatio="1.5"></add-image>
        </q-modal>
      </template>
    </q-modal-layout>
</template>

<script>
import AddImage from "./PixabaySearch";
export default {
  name: 'AddStory',
  components: { AddImage},
  data() {
      return {
        selectedWidth: null,
        selectedHeight: null,
        selectedIndex: null,
        title: '',
        description: '',
        coverImage: null,
        profileId: null,
        submitting: false,
      }
  },
  mounted() {
    /** Reset data */
    this.title = '';
    this.description = '';
    this.selectedWidth = null;
    this.selectedHeight = null;
    this.selectedIndex = null;
    this.coverImage = null;
    this.profileId = this.activeProfile ? this.activeProfile.id : null;
    this.submitting = false
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
    profiles () {
      return this.$store.getters.profiles;
    },
    activeProfile () {
      return this.$store.getters.profile;
    },
  },
  methods: {
    changeProfile(profileId) {
      this.profileId = profileId;
    },

    getInitials(name) {
      let initialsStr = '';
      let initials = name.split(' ');
      initials.forEach((initial, index) => {
        if (index === 0 || index === (initials.length -1)) {
          initialsStr += initial.substr(0,1);
        }
      });
      return initialsStr;
    },

    close() {
      const payload = {
        showAddStory: false,
      };
      this.$store.commit('setSettings', payload);
    },

    setSize(width, height, index) {
      this.selectedWidth = width;
      this.selectedHeight = height;
      this.selectedIndex = index;
    },

    addStory() {
      const page = {
        commit: 0,
        photoLayer: {},
        drawingLayer: {},
        textLayer: [
          /* {
            backgroundColor: "#ffffff",
            borderColor: "#ffffff",
            borderWidth: 0,
            delta: [{"insert":"Story Title","attributes":{"size":"huge"}},{"insert":"\n","attributes":{"align":"center"}}],
            height: 150,
            opacity: 0,
            text: "<p class=\"ql-align-center\"><span class=\"ql-size-huge\">Story Title</span></p>",
            width: (this.selectedWidth - 100),
            x: 50,
            y: 100,
            range: {"index":1,"length":0}
          } */
        ],
        background: {
          color: '#ffffff',
          image: false,
        },
        order: 0,
        pageSize: {
          width: this.selectedWidth,
          height: this.selectedHeight,
        }
      };
      const payload = {
          user: this.user,
          storyKey: this.$route.params.id,
          pageKey: this.$route.params.pageId ? this.$route.params.pageId : null,
          newStory: {
            title: this.title,
            description: this.description,
            modified: new Date(),
            profile: this.profileId,
            commit: 0,
            plan: [{
              video: '',
              videoObj: {},
              text: '',
              title: '',
              delta: [],
              range: {}
            }],
            thumb: this.coverImage ? this.coverImage : '',
          },
          page: page,
      }
      this.$store.dispatch('addStory', payload)
        .then((newStoryId) => {
          this.submitting = false;
          this.title = '';
          this.description = '';
          this.coverImage = null;
          const payload = {
            showAddStory: false,
          };
          this.$store.commit('setSettings', payload);
          this.$store.commit('setMode', "draw");
          this.$store.commit('setSubMode', "brush");
          this.$router.push({ path: '/project/'+newStoryId });
        });
    },

    showCoverImageModal() {
      this.$store.commit('setMode', "addStory");
      this.$store.commit('setSubMode', "cover");
      const newSetting = {
        showImageModal: true,
      };
      this.$store.commit('setSettings', newSetting);
    },

    addCoverImage(imageObj) {
      this.$store.commit("clearInsertImage");
      this.$store.commit("clearImageSearchResults");
      this.coverImage = imageObj.webformatURL;
      this.$store.commit('setSubMode', "view");
      const newSetting = {
        showImageModal: false,
      };
      this.$store.commit('setSettings', newSetting);
    },

    removeCoverImage() {
      this.coverImage = null;
    }

  },
  watch: {
    insertImage: {
      handler: function(newImage, oldImage) {
        this.$store.commit('setLoading', false);
        if (newImage && this.modes.mode === "addStory" && this.modes.subMode === "cover") {
          this.addCoverImage(newImage);
        }
      },
      deep: true
    }
  }
}
</script>

<style lang="stylus">
@import '~variables';
.modal-inner-content {
  padding: 20px;
  h4 {
    margin-top: 0;
    margin-bottom: 5px;
  }
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
        align-self: center;
        box-shadow: 0 1px 5px rgba(0,0,0,0.2), 0 2px 2px rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12);
        border: solid 3px transparent;
        border-radius: 3px;
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