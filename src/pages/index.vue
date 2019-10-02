<template>
  <q-page class="home-page layout-padding">
    <div>
      <h2>Family</h2>
      <div class="row-wrapper">
        <carousel :vitems="3" :nav="true" v-if="projects && projects.length > 0">
          <template v-for="project in projects">
            <div :key="'popular'+project.projectId" class="project-wrapper" @click="showProject(project)">
              <q-card v-if="project.keywords.includes('popular')">
                <q-card-media>
                  <img :src="project.cover" class="project-cover" />
                </q-card-media>
                <q-card-title>{{ project.title }}</q-card-title>
              </q-card>
            </div>
          </template>
        </carousel>
      </div>
    </div>
    <q-modal
      v-model="settings.showProjectModal"
      :content-css="{minWidth: '350px', height: '90vh', maxWidth: '100%', width: '80vw'}">
      <view-project v-if="activeProject" :project="activeProject"></view-project>
    </q-modal>
  </q-page>
</template>

<script>
import carousel from 'vue-owl-carousel';

import ViewProject from '../components/home/ViewProject';

export default {
  name: 'PageIndex',
  components: { carousel, ViewProject },
  data() {
    return {
      activeProject: null,
    }
  },
  computed: {
    projects () {
      return this.$store.getters.getPublishedProjects;
    },
    settings() {
      return this.$store.getters.getSettings;
    },
  },
  methods: {
    showProject(project) {
      this.activeProject = project;
      const newSetting = {
        showProjectModal: true,
      };
      this.$store.commit('setSettings', newSetting);
    }
  },
}
</script>

<style lang="stylus">
@import '~variables';
.home-page {
  h2 {
    margin: 10px 0;
    font-size: 30px;
  }
}
.project-wrapper {
  padding: 10px;
  h4 {
    font-size: 23px;
    margin: 10px 0 5px 0;
  }
  .project-cover {
    max-width: 100%
  }
}
</style>
