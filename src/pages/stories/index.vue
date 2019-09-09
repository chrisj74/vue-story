<template>
  <q-page class="story-index-container">
    <h2>Stories <q-btn icon="mdi-plus-circle" round label="New Story" @click="showAddStory()" /></h2>
    <div class="row justify-end">
      <q-btn @click="showEdit()" v-if="!editStories">edit</q-btn>
      <q-btn @click="showEdit()" v-if="editStories">done</q-btn>
    </div>
    <div v-if="stories" class="story-wrapper">
      <q-card v-for="(story) in stories" :key="story.id" class="story">
        <q-card-media :style="story.thumb ? {backgroundImage: 'url(' + story.thumb + ')'}
          : {backgroundImage: 'url(statics/image-area.svg)'}">
          <router-link :to="'/story/'+story.id">
            <!-- <span v-if="!story.thumb">
              <svg style="width:300px;height:300px" viewBox="0 0 24 24"><path fill="#000000" d="M20,5A2,2 0 0,1 22,7V17A2,2 0 0,1 20,19H4C2.89,19 2,18.1 2,17V7C2,5.89 2.89,5 4,5H20M5,16H19L14.5,10L11,14.5L8.5,11.5L5,16Z" /></svg>
            </span> -->
          </router-link>
        </q-card-media>
        <q-card-title>
          <router-link :to="'/story/'+story.id">
            <a>{{ story.title }}</a>
          </router-link>
        </q-card-title>
        <q-card-main v-if="story.description && story.description.length > 0">
          <p>{{ story.description }}</p>
        </q-card-main>
        <template v-if="editStories">
          <q-card-separator />
          <q-card-actions align="between">
            <q-btn icon="mdi-delete" @click="deleteStory(story.id)" round color="negative" size="sm"></q-btn>
            <q-btn icon="mdi-content-copy" @click="cloneStory(story.id)" round color="tertiary" size="sm"></q-btn>
            <q-btn round type="a" @click="showEditStory(story.id)" icon="mdi-pencil" size="sm" color="positive" />
          </q-card-actions>
        </template>
      </q-card>
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
  </q-page>
</template>

<script>
import AddStory from '../../components/story/AddStory';
import EditStory from '../../components/story/EditStory';
export default {
  name: 'StoriesIndex',
  components: { AddStory, EditStory },
  data() {
    return {
      submitting: false,
      editStories: false,
      editStoryId: null,
    }
  },
  mounted() {
    /** Reset story & page so deleting doesn't create issues */
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
    }
  },
  methods: {
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
          console.log('done cloning id=', newStoryId);
          this.$router.push({ path: '/story/'+newStoryId });
        });
    },

    getPlaceholder() {
      const img = '<svg style="width:300px;height:300px" viewBox="0 0 24 24"><path fill="#000000" d="M20,5A2,2 0 0,1 22,7V17A2,2 0 0,1 20,19H4C2.89,19 2,18.1 2,17V7C2,5.89 2.89,5 4,5H20M5,16H19L14.5,10L11,14.5L8.5,11.5L5,16Z" /></svg>';
      return encodeURIComponent(img);
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
        width: 100%
        &:after {
          content: "";
          display: block;
          width: 100%;
          padding-top: 66%;
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

