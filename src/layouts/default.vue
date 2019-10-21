<template>
  <q-layout view="lHh Lpr lFf">
    <q-layout-header>
      <q-toolbar color="primary" shrink>
        <q-btn
          flat
          dense
          round
          @click="leftDrawerOpen = !leftDrawerOpen"
        >
          <q-icon name="mdi-menu" />
        </q-btn>
        <div>
          <img src="statics/tuc-v4.png" height="50px" class="logo" />
        </div>
        <q-toolbar-title>
          BETA
        </q-toolbar-title>
        <div class="profile-xs">
        <div class="profile">
          <div class="profile-avatar profile-active" v-if="profile">
            <router-link :to="'/profiles'">
              <div :style="{backgroundImage: 'url(' + profile.profilePic + ')'}" class="profile-img" v-if="profile.profilePic"></div>
              <div class="profile-initials" v-else>
                {{ getInitials(profile.nickName) }}
              </div>
            </router-link>
          </div>
        </div>
      </div>
      </q-toolbar>
    </q-layout-header>

    <q-layout-drawer
      v-model="leftDrawerOpen"
      content-class="bg-grey-2"
    >
      <div class="profile">
        <div class="profile-avatar profile-active" v-if="profile">
          <router-link :to="'/profiles'">
            <div :style="{backgroundImage: 'url(' + profile.profilePic + ')'}" class="profile-img" v-if="profile.profilePic"></div>
            <div class="profile-initials" v-else>
              {{ getInitials(profile.nickName) }}
            </div>
          </router-link>
        </div>
        <div class="profile-label" v-if="profile && profile.nickName">
          <router-link :to="'/profiles'">{{profile.nickName}}</router-link>
        </div>
      </div>
      <q-list
        no-border
        link
        inset-delimiter
      >
        <q-item :link="true" to="/home">
          <q-item-side icon="mdi-home"/>
          <q-item-main label="HOME" />
        </q-item>
        <q-item :link="true" to="/projects">
          <q-item-side icon="mdi-book"/>
          <q-item-main label="MY PROJECTS" />
        </q-item>
        <q-item :link="true" to="/profiles">
          <q-item-side icon="mdi-account"/>
          <q-item-main label="PROFILES" />
        </q-item>
        <!-- <q-item :link="true" to="/profile" v-if="user">
          <q-item-side icon="mdi-account" />
          <q-item-main label="MY ACCOUNT" />
        </q-item> -->
        <q-item @click="openFeedback()">
          <q-item-side icon="mdi-bullhorn"></q-item-side>
          <q-item-main>
            <span @click="openFeedback()">
              <bruit-io :config.prop="bruitConfig">FEEDBACK</bruit-io>
            </span>
          </q-item-main>
        </q-item>
        <q-item @click.native="onLogout" v-if="user">
          <q-item-side icon="mdi-power" />
          <q-item-main label="EXIT" />
        </q-item>
        <q-item :link="true" to="/login" v-else>
          <q-item-side icon="mdi-account" />
          <q-item-main label="Login" />
        </q-item>
      </q-list>
    </q-layout-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
    <div v-show="loading" class="loading-box">
      <q-spinner-bars color="primary" :size="100" />
    </div>
  </q-layout>
</template>

<script>
import bruitConfig from '../assets/bruit-config.json';
export default {
  name: 'LayoutDefault',
  data () {
    return {
      leftDrawerOpen: this.$q.platform.is.desktop,
      storiesSet: false,
      bruitConfig,
    }
  },
  computed: {
    user () {
      return this.$store.getters.user
    },
    loading () {
      return this.$store.getters.loading
    },
    profile () {
      return this.$store.getters.profile
    }
  },
  methods: {
    openFeedback() {
      this.$store.commit('setLeftDrawerOpen', false);
    },

    onLogout () {
      this.$store.dispatch('logout');
      this.$router.push('/login');
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
    }
  },
  mounted () {
    if (this.user) {
      this.$store.dispatch('setStories', this.user.id);
      this.$store.dispatch('setImages', this.user.id);
      this.storiesSet = true;
    }
  },
  watch: {
    user(newUser) {
      if (!this.storiesSet) {
        this.$store.dispatch('setStories', this.user.id);
        this.storiesSet = true;
      }
    },
  }
}
</script>

<style lang="stylus">
@import '~variables';

.loading-box {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255, .8);
}
</style>
