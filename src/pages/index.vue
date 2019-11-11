<template>
  <q-page class="home-page layout-padding">

    <div v-if="popularProjects && popularProjects.length > 0">
      <h2>Popular</h2>
      <div class="row-wrapper">
        <carousel :responsive="{0:{items:2,nav:false},600:{items:3,nav:false},1000:{items: 4, nav: false}, 1200:{items: 5, nav: false}}" v-if="projects && projects.length > 0">
          <template v-for="project in projects">
            <div :key="'popular'+project.projectId" class="project-wrapper" @click="showProject(project)">
              <q-card v-if="project.keywords.includes('popular')">
                <q-card-media>
                  <img :src="project.cover" class="project-cover" />
                </q-card-media>
                <q-card-title>{{ project.title }}</q-card-title>
                <q-card-actions>
                  <q-btn color="primary" @click="showProject(project)">
                    More
                  </q-btn>
                </q-card-actions>
              </q-card>
            </div>
          </template>
        </carousel>
      </div>
    </div>

    <!-- My Projects -->
    <div v-if="profileStories && profileStories.length > 0">
      <h2><router-link :to="'/projects'">My Projects</router-link></h2>
      <div class="row-wrapper">
        <carousel :responsive="{0:{items:2,nav:false},600:{items:3,nav:false},1000:{items: 4, nav: false}, 1200:{items: 5, nav: false}}" v-if="profileStories && profileStories.length > 0">
          <template v-for="(story) in profileStories">
            <div class="project-wrapper" :key="'myprojects'+story.id">
              <q-card>
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
                <q-card-actions>
                <q-btn color="primary" :to="'/project/'+story.id">
                    Open
                  </q-btn>
                </q-card-actions>
              </q-card>
            </div>
          </template>
        </carousel>
      </div>
    </div>
    <div v-else>
      <h2><router-link :to="'/projects'">My Projects</router-link></h2>
      <div class="row-wrapper">
        <div class="project-wrapper static-wrapper">
          <q-card>
            <q-card-title>
              Choose a project or create your own to get started.
            </q-card-title>
            <q-card-actions>
              <q-btn color="primary" to="/projects">
                Get Started
              </q-btn>
            </q-card-actions>
          </q-card>
        </div>
      </div>
    </div>
    <!-- Family -->
    <div v-if="familyProjects && familyProjects.length > 0">
      <h2>Family</h2>
      <div class="row-wrapper">
        <carousel :responsive="{0:{items:2,nav:false},600:{items:3,nav:false},1000:{items: 4, nav: false}, 1200:{items: 5, nav: false}}" v-if="projects && projects.length > 0">
          <template v-for="project in projects">
            <div :key="'faily'+project.projectId" class="project-wrapper" @click="showProject(project)">
              <q-card v-if="project.category === 'Family'">
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


    <!-- Project modal -->
    <q-modal
      v-model="settings.showProjectModal"
      :content-css="{minWidth: '350px', height: '90vh', maxWidth: '100%', width: '80vw'}">
      <view-project v-if="activeProject" :project="activeProject"></view-project>
    </q-modal>

    <!-- Welcome modal -->
    <q-modal
      v-model="profileSettings.showWelcome"
      :content-css="{minWidth: '350px', height: '90vh', maxWidth: '100%', width: '90vw'}">
      <welcome v-if="profileSettings.showWelcome"></welcome>
    </q-modal>
  </q-page>
</template>

<script>
import carousel from 'vue-owl-carousel';

import ViewProject from '../components/home/ViewProject';
import Welcome from '../components/user/Welcome';

export default {
  name: 'PageIndex',
  components: { carousel, ViewProject, Welcome },
  data() {
    return {
      activeProject: null,
      profileFilter: null,
      newUser: true,
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
    },
    profileStories () {
      return this.$store.getters.getStoriesByActiveProfile;
    },
    profileSettings () {
      return this.$store.getters.getProfileSettings;
    },
    popularProjects () {
      return this.$store.getters.getPublishedProjectsByKeyword('popular');
    },
    familyProjects () {
      return this.$store.getters.getPublishedProjectsByCategory('Family');
    },
    projects () {
      return this.$store.getters.getPublishedProjects;
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
    margin: 0;
    font-size: 20px;
    a {
      text-decoration: none;
    }
  }
}
.project-wrapper {
  padding: 10px;
  .q-card-title {
    font-size: 15px;
  }
  .q-card-container {
    padding: 6px;
  }
  &.static-wrapper {
    max-width: 50%;
  }
  h4 {
    font-size: 23px;
    margin: 10px 0 5px 0;
  }
  .project-cover {
    max-width: 100%
  }
}
@media (min-width: 600px) {
  .project-wrapper {
    &.static-wrapper {
      max-width: 33%;
    }
  }
}

@media (min-width: 1000px) {
  .project-wrapper {
    &.static-wrapper {
      max-width: 25%;
    }
  }
}
@media (min-width: 1200px) {
  .project-wrapper {
    &.static-wrapper {
      max-width: 20%;
    }
  }
}
</style>
