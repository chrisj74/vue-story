<template>
  <q-layout view="lHh Lpr lFf">
    <q-layout-header>
      <q-toolbar color="primary" shrink>
        <q-btn
          flat
          dense
          round
          @click="toggleLeftDawer()"
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
        <!-- Home -->
        <q-item :link="true" to="/home">
          <q-item-side icon="mdi-home"/>
          <q-item-main label="HOME" />
        </q-item>
        <!-- My Projects -->
        <q-item :link="true" to="/projects">
          <q-item-side icon="mdi-book"/>
          <q-item-main label="MY PROJECTS" />
        </q-item>
        <!-- Profiles -->
        <q-item :link="true" to="/profiles">
          <q-item-side icon="mdi-account"/>
          <q-item-main label="PROFILES" />
        </q-item>
        <!-- Feedback -->
        <q-item>
          <q-item-side icon="mdi-bullhorn"></q-item-side>
          <q-item-main>
            <span @click="openFeedback()">
              <!-- <bruit-io :config.prop="bruitConfig">FEEDBACK</bruit-io> -->
            </span>
          </q-item-main>
        </q-item>
        <!-- Beta -->
        <q-item @click.native="showBeta()">
          <q-item-side icon="mdi-test-tube" />
          <q-item-main label="BETA INFO" />
        </q-item>
        <!-- Logout -->
        <q-item @click.native="onLogout" v-if="user">
          <q-item-side icon="mdi-power" />
          <q-item-main label="EXIT" />
        </q-item>
        <!-- Login -->
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

    <!-- Welcome modal -->
    <q-modal
      v-model="profileSettings.showWelcome"
      :no-route-dismiss="true"
      :content-css="{minWidth: '350px', maxHeight: '98vh', maxWidth: '800px', width: '98vw'}">
      <welcome v-if="profileSettings.showWelcome"></welcome>
    </q-modal>
  </q-layout>
</template>

<script>
import bruitConfig from '../assets/bruit-config.json';
import Welcome from '../components/user/Welcome';
export default {
  name: 'LayoutDefault',
  components: {
    Welcome
  },
  data () {
    return {
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
    },
    leftDrawerOpen: {
      set() {
        this.$store.dispatch("toggleLeftDrawerOpen");
      },
      get() {
        return this.$store.getters.getLeftDrawerOpen;
      }
    },
    profileSettings () {
      return this.$store.getters.getProfileSettings;
    },
    account () {
      return this.$store.getters.getAccount;
    }
  },
  mounted () {
    if (this.account && this.account.sessions <= 1) {
      this.showBeta();
    }

    if (this.user && this.user.id) {
      this.$store.dispatch('setStories', this.user.id);
      this.$store.dispatch('setImages', this.user.id);
      this.storiesSet = true;
    }
  },
  methods: {
    openFeedback() {
      this.$store.commit('setLeftDrawerOpen', false);
    },

    showBeta() {
      const newSetting = {
        showWelcome: true
      };
      this.$store.commit("setProfileSettings", newSetting);
    },

    toggleLeftDawer() {
      this.$store.dispatch("toggleLeftDrawerOpen");
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
  watch: {
    user(newUser) {
      if (!this.storiesSet) {
        this.$store.dispatch('setStories', this.user.id);
        this.$store.dispatch('setImages', this.user.id);
        this.storiesSet = true;
      }
    },

    account (newAccount) {
      if (this.account && this.account.sessions <= 1) {
        this.showBeta();
      }
    }
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
