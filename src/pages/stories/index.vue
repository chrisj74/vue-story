<template>
  <q-page class="">
    <h1>Stories</h1>
    <div v-if="stories">
      <div v-for="(story) in stories" :key="story.id">
        <router-link :to="'/story/'+story.id">
          <a>{{ story.title }} {{ story.id }}</a>
        </router-link>
        <q-btn icon="" @click="deleteStory(story.id)" label="delete"></q-btn>
      </div>
    </div>
    <div>
      <q-btn icon="create" label="New Story" @click="showAddStory = true" />
    </div>
    <div v-if="showAddStory">
      <q-input type="text" v-model="newStory.title" float-label="Float Label" placeholder="Story Name" />
      <q-btn icon="create" label="Add" @click="addStory" />
    </div>
  </q-page>
</template>

<style>
</style>

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
        plan: "",
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
