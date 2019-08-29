<template>
  <div>
    <div class="modal-wrapper">
      <h4>Add Story</h4>
      <!-- Title -->
      <q-input type="text" v-model="newStory.title" float-label="Story Name" class="text-input" />
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

      <!-- Actions -->
      <div class="add-actions">
        <q-btn color="dark" icon="mdi-close" @click="close()">Cancel</q-btn>
        <q-btn color="primary" icon="mdi-plus-circle" @click="saveStory()" :disabled="newStory.title.length === 0">Save</q-btn>
      </div>
    </div>

    <!-- Image modal -->
    <q-modal
      v-model="settings.showImageModal"
      :content-css="{minWidth: '350px', height: '90vh', maxWidth: '100%', width: '80vw'}">
      <add-image></add-image>
    </q-modal>
  </div>
</template>

<script>
import AddImage from "./PixabaySearch";
export default {
  name: 'EditStory',
  components: { AddImage },
  props: ['storyId'],
  data() {
      return {
        newStory: {
          title: "",
        },
        coverImage: null,
        submitting: false,
      }
  },
  mounted() {
    /** Reset data */
    this.newStory.title = this.story.title;
    this.coverImage = this.story.thumb;
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
      story() {
        return this.$store.getters.getStoryById(this.storyId);
      }
  },
  methods: {
    close() {
      const payload = {
        showEditStory: false,
      };
      this.$store.commit('setSettings', payload);
    },

    saveStory() {
      if (this.user) {
          const payload = {
              user: this.user,
              storyKey : this.storyId,
              title: this.newStory.title,
              thumb: this.coverImage
          };
          this.$store.dispatch('updateStory', payload).then( () => {
              this.submitting = false;
              this.newStory = {
                title: "",
              };
              this.coverImage = null;
              const payload = {
                showEditStory: false,
              };
              this.$store.commit('setSettings', payload);
              this.$store.commit('setMode', "text");
              this.$store.commit('setSubMode', "text");
            }
          );
      }
    },

    showCoverImageModal() {
      this.$store.commit('setMode', "story");
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
      this.$store.commit('setSubMode', "add");
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
        console.log('insert image watcher');
        this.$store.commit('setLoading', false);
        if (newImage && this.modes.subMode === "cover") {
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
.modal-wrapper {
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
      min-height: 200px;
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