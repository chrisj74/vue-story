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
        <h5>{{project.title}}</h5>
        <div class="project-description" v-html="project.description"></div>
        <q-card>
          <q-card-main>
            <!-- Profile -->
            <p><strong>Which Profile?</strong></p>
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
          </q-card-main>
        </q-card>
      </div>

      <!-- FOOTER -->
      <q-toolbar slot="footer">
        <q-btn color="white" text-color="black" @click="close()">Cancel</q-btn>
        <q-toolbar-title></q-toolbar-title>
        <q-btn color="secondary" text-color="black" icon="mdi-plus-circle" @click="cloneStory()" :disabled=" title.length === 0">Add To My Projects</q-btn>
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
import AddImage from "../story/PixabaySearch";
export default {
  name: 'ViewProject',
  components: { AddImage },
  props: ['project'],
  data() {
      return {
        title: '',
        coverImage: null,
        profileId: null,
        submitting: false,
      }
  },
  mounted() {
    /** Reset data */
    this.title = this.project.title;
    this.coverImage = this.project.cover;
    this.profileId = this.activeProfile ? this.activeProfile.id : null;
    this.submitting = false;
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
    settings() {
      return this.$store.getters.getSettings;
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
        showProjectModal: false,
      };
      this.$store.commit('setSettings', payload);
    },

    cloneStory() {
      const payload = {
        projectUserId: this.project.projectUserId,
        user: this.user,
        storyKey: this.project.projectId,
        newStory: {
          title: this.title,
          modified: new Date(),
          profile: this.activeProfile.id,
          thumb: this.coverImage ? this.coverImage : '',
        }
      }
      this.$store.dispatch('cloneStory', payload)
        .then((newStoryId) => {
          const newSetting = {
            showProjectModal: false,
          };
          this.$store.commit('setSettings', newSetting);

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
    },
    project: {
      handler: function(newProject, oldProject) {
        this.title = this.project.title;
        this.coverImage = this.project.cover;
        this.profileId = this.activeProfile ? this.activeProfile.id : null;
        this.submitting = false;
      },
      deep: true
    }
  }
}
</script>

<style lang="stylus">
@import '~variables';
h5 {
  margin: 0 0 20px 0;
}
.project-description {
  margin-bottom: 20px;
}
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