<template>
  <q-page class="">
    <h1>Stories</h1>
    <div v-if="stories" class="story-wrapper">
      <q-card v-for="(story) in stories" :key="story.id" class="story">
        <q-card-media>
          <!-- <img src="~assets/donuts.png"> -->
        </q-card-media>
        <q-card-title>
          <router-link :to="'/story/'+story.id">
            <a>{{ story.title }}</a>
          </router-link>
        </q-card-title>
        <q-card-main>
          <p>Info about the story</p>
        </q-card-main>
        <q-card-separator />
        <q-card-actions align="between">
          <q-btn icon="mdi-delete" @click="deleteStory(story.id)" round color="negative" size="sm"></q-btn>
          <router-link :to="'/story/'+story.id">
            <q-btn round type="a" icon="mdi-edit" size="sm" color="positive" />
          </router-link>
        </q-card-actions>
      </q-card>
    </div>
    <div>
      <q-btn icon="mdi-add-circle" round label="New Story" @click="showAddStory = true" />
    </div>
    <div v-if="showAddStory">
      <q-input type="text" v-model="newStory.title" float-label="Float Label" placeholder="Story Name" />
      <q-btn icon="mdi-create" label="Add" @click="addStory" />
    </div>
  </q-page>
</template>

<script>
export default {
  name: 'StoriesIndex',
  data() {
    return {
      showAddStory: false,
      submitting: false,
      newStory: {
        title: ""
      }
    }
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
    }
  },
  methods: {
    addStory() {
      this.submitting = true;
      const newStory = {
        title: this.newStory.title,
        plan: "<p>Plan from db</p>",
        thumbs: []
      };
      const payload = {
        user: this.user,
        newStory : newStory
      };
      this.$store.dispatch('addStory', payload)
        .then(() => {
          this.showAddStory = false;
          this.submitting = false;
          this.newStory.title = "";
        });
    },
    deleteStory(storyKey) {
      const payload = {
        storyKey: storyKey,
        user: this.user
      };
      this.$store.dispatch('deleteStory', payload)
        .then(() => {
          this.showAddStory = false;
          this.submitting = false;
          this.newStory.title = "";
        });
    }
  }
}
</script>

<style>
.story-wrapper {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: wrap;
  flex-direction: row;
}
.story {
  flex-basis: 23%;
  margin: 1%;
}
</style>

