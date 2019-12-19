<template>
  <q-page class="home-page">

    <!-- My Projects -->
    <div class="recent-projects shadow-5">
      <h2><router-link :to="'/projects'">Your Recent Projects</router-link></h2>
      <div v-if="profileStories && profileStories.length > 0">
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
        <div class="row-wrapper">
          <div class="project-wrapper static-wrapper">
            <q-card>
              <q-card-title>
                Choose a project or create your own to get started.
              </q-card-title>
              <q-card-actions>
                <q-btn color="primary" to="/projects">
                  Create Your Own
                </q-btn>
              </q-card-actions>
            </q-card>
          </div>
        </div>
      </div>
    </div>

    <div class="browse-projects">
      <h2>Find New Projects</h2>
      <!-- POPULAR -->
      <div v-if="popularProjects && popularProjects.length > 0">
        <h3>Popular</h3>
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

      <!-- Family -->
      <div v-if="familyProjects && familyProjects.length > 0">
        <h3>Family</h3>
        <div class="row-wrapper">
          <carousel :responsive="{0:{items:2,nav:false},600:{items:3,nav:false},1000:{items: 4, nav: false}, 1200:{items: 5, nav: false}}" v-if="projects && projects.length > 0">
            <template v-for="project in projects">
              <div :key="'faily'+project.projectId" class="project-wrapper" @click="showProject(project)">
                <q-card v-if="project.category === 'Family'">
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

      <!-- Kids -->
      <div v-if="kidsProjects && kidsProjects.length > 0">
        <h3>Kids</h3>
        <div class="row-wrapper">
          <carousel :responsive="{0:{items:2,nav:false},600:{items:3,nav:false},1000:{items: 4, nav: false}, 1200:{items: 5, nav: false}}">
            <template v-for="project in kidsProjects">
              <div :key="'kids'+project.projectId" class="project-wrapper" @click="showProject(project)">
                <q-card>
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
    </div>

    <!-- Project modal -->
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
    kidsProjects () {
      return this.$store.getters.getPublishedProjectsByCategory('Kids');
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
    margin: 20px 0 0 0;
    font-size: 30px;
    text-align: center;
    a {
      text-decoration: none;
      color: #000;
    }
  }
  h3 {
    margin: 0;
    font-size: 20px;
    a {
      text-decoration: none;
    }
  }
  .recent-projects {
    background-color: $grey-2;
  }
  .browse-projects, .recent-projects {
    padding: 1rem;

  }
}
.project-wrapper {
  padding: 10px;
  .q-card {
    background-color: #fff;
  }
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
  .browse-projects, .recent-projects {
    padding: 10px 3rem;
  }
}
</style>
