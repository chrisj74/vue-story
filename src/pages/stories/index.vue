<template>
  <q-page class="story-index-container">
    <h2>Projects <q-btn icon="mdi-plus-circle" label="New Project" @click="showAddStory()" /></h2>
    <div class="row justify-center items-end profiles-sm" v-if="profiles && activeProfile">
      <div class="profile"
        v-for="profile in profiles"
        :key="profile.id"
        @click="changeProfile(false, profile.id)"
      >
        <div class="profile-avatar" :class="{'profile-active' : profile.id === profileFilter}">
            <div :style="{backgroundImage: 'url(' + profile.profilePic + ')'}" class="profile-img"
              v-if="profile && profile.profilePic"
            ></div>
            <div v-else class="profile-initials" :class="{'profile-active' : profile.id === activeProfile.id}">
              {{ getInitials(profile.nickName)}}
            </div>
        </div>
        <div class="profile-label" v-if="profile && profile.nickName">
          {{profile.nickName}}
        </div>
      </div>
      <div class="profile profile-all" @click="changeProfile(true, null)" v-if="profiles.length > 1">
        <div class="profile-avatar" :class="{'profile-active' : !profileFilter}">
          <q-btn icon="mdi-account-group" round size="xl" label="All profiles" />
        </div>
        <div class="profile-label">ALL</div>
      </div>
    </div>
    <div class="row justify-start">
      <q-btn outline dense @click="showEdit()" v-if="!editStories">Edit</q-btn>
      <q-btn outline dense @click="showEdit()" v-if="editStories">Done</q-btn>
    </div>
    <div v-if="stories" class="story-wrapper">
      <template v-for="(story) in stories">
        <q-card v-if="!story.profile || !profileFilter || story.profile === profileFilter" class="story" :key="story.id">
          <q-card-media>
            <router-link :to="'/project/'+story.id">
              <img :src="story.thumb ?  story.thumb : 'statics/image-area.png'" />
            </router-link>
          </q-card-media>
          <q-card-title>
            <router-link :to="'/project/'+story.id">
              <a>{{ story.title }}</a>
            </router-link>
          </q-card-title>
          <!-- <q-card-main v-if="story.description && story.description.length > 0">
            <p>{{ story.description }}</p>
          </q-card-main> -->
          <template v-if="editStories">
            <q-card-separator />
            <q-card-actions align="between">
              <q-btn icon="mdi-delete" @click="deleteStory(story.id)" round color="negative" size="sm"></q-btn>
              <q-btn icon="mdi-content-copy" @click="cloneStory(story.id)" round color="tertiary" size="sm"></q-btn>
              <q-btn icon="mdi-library-books" v-if="isAdmin" @click="showPublishStory(story.id)" round color="tertiary" size="sm"></q-btn>
              <q-btn round type="a" @click="showEditStory(story.id)" icon="mdi-pencil" size="sm" color="positive" />
            </q-card-actions>
          </template>
        </q-card>
      </template>
    </div>
    <div class="row justify-center items-end">
      <q-btn icon="mdi-plus-circle" label="New Project" @click="showAddStory()"></q-btn>
    </div>

    <q-modal
        v-model="settings.showAddStory"
        :content-css="{minWidth: '400px', height: '90vh', maxWidth: '100%', width: '80vw'}">
      <add-story></add-story>
    </q-modal>

    <q-modal
      v-model="settings.showEditStory"
      :content-css="{minWidth: '400px', height: '90vh', maxWidth: '100%', width: '80vw'}">
      <edit-story v-if="editStoryId" :storyId="editStoryId"></edit-story>
    </q-modal>

    <q-modal
      v-model="settings.showPublishStory"
      :content-css="{minWidth: '400px', height: '90vh', maxWidth: '100%', width: '80vw'}">
      <publish-story v-if="publishStoryId" :storyId="publishStoryId"></publish-story>
    </q-modal>
  </q-page>
</template>

<script>
import AddStory from '../../components/story/AddStory';
import EditStory from '../../components/story/EditStory';
import PublishStory from '../../components/story/PublishStory';
export default {
  name: 'StoriesIndex',
  components: { AddStory, EditStory, PublishStory },
  data() {
    return {
      submitting: false,
      editStories: false,
      editStoryId: null,
      publishStoryId: null,
      profileFilter: null,
    }
  },
  mounted() {
    /** Reset story & page so deleting doesn't create issues */
    this.profileFilter = this.activeProfile ? this.activeProfile.id : null;
    this.$store.commit('setStory', {});
    this.$store.commit('resetPage');
  },
  computed: {
    user () {
      return this.$store.getters.user
    },
    loading () {
      return this.$store.getters.loading
    },
    stories () {
      return this.$store.getters.getStories
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
    isAdmin () {
      return this.$store.getters.isAdmin;
    }
  },
  methods: {
    changeProfile(showAll, profileId) {
      if (showAll) {
        this.profileFilter = null;
      } else {
        this.profileFilter = profileId;
      }
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

    closeModal(type) {
      const newSetting = {};
      newSetting[type] = false;
      this.$store.commit('setSettings', newSetting);
    },

    showAddStory() {
      const payload = {
        showAddStory: true,
      };
      this.$store.commit('setSettings', payload);
    },

    showEditStory(id) {
      this.editStoryId = id;
      const payload = {
        showEditStory: true,
      };
      this.$store.commit('setSettings', payload);
    },

    showPublishStory(id) {
      this.publishStoryId = id;
      const payload = {
        showPublishStory: true,
      };
      this.$store.commit('setSettings', payload);
    },

    showEdit() {
      this.editStories = !this.editStories;
    },

    deleteStory(storyKey) {
      const payload = {
        storyKey: storyKey,
        user: this.user
      };
      this.$store.dispatch('deleteStory', payload)
        .then(() => {
          this.submitting = false;
        });
    },

    cloneStory(storyKey) {
      const payload = {
        user: this.user,
        storyKey: storyKey,
      }
      this.$store.dispatch('cloneStory', payload)
        .then((newStoryId) => {
          this.$router.push({ path: '/project/'+newStoryId });
        });
    },

    getPlaceholder() {
      const img = '<svg style="width:300px;height:300px" viewBox="0 0 24 24"><path fill="#000000" d="M20,5A2,2 0 0,1 22,7V17A2,2 0 0,1 20,19H4C2.89,19 2,18.1 2,17V7C2,5.89 2.89,5 4,5H20M5,16H19L14.5,10L11,14.5L8.5,11.5L5,16Z" /></svg>';
      return encodeURIComponent(img);
    }
  },
  watch: {
    activeProfile: {
      handler: function(newSettings, oldSettings) {
        this.profileFilter = this.activeProfile.id;
        if (!this.settings.showPublishStory) {
          this.publishStoryId = null;
        }
        if (!this.settings.showEditStory) {
          this.editStoryId = null;
        }
      },
      deep: true
    },
    settings: {
      handler: function(newProfile, oldProfile) {
        this.profileFilter = this.activeProfile.id;
      },
      deep: true
    }
  }
}
</script>

<style lang="stylus">
@import '~variables';
.story-index-container {
  padding: 10px;
  h2 {
    margin: 10px 0;
  }
}

.story-wrapper {
  .story {
    flex-basis: calc(24% - 20px);
    margin: 10px;
  }
  display: flex;
  justify-content: flex-start;
  align-items: stretch;
  flex-wrap: wrap;
  flex-direction: row;
  .q-card-media {
    display: flex;
    justify-content: center;
    background-position: 50% 50%;
    background-size: 100%;
    background-repeat: no-repeat;
    position: relative;
      a {
        position: relative;
        z-index: 2;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        img {
          max-width: 100%;
        }
      }
  }
}

@media (max-width: $breakpoint-sm) {
  .story-wrapper {
    .story {
      flex-basis: calc(50% - 20px);
      margin: 10px;
    }
  }
}

</style>

