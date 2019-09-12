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

        <q-toolbar-title>
          Quasar + Firebase Auth
        </q-toolbar-title>
      </q-toolbar>
    </q-layout-header>

    <q-layout-drawer
      v-model="leftDrawerOpen"
      content-class="bg-grey-2"
    >
      <div class="profile">
        <div class="profile-avatar" v-if="profile">
          <router-link :to="'/profiles'">
            <div :style="{backgroundImage: 'url(' + profile.profilePic + ')'}" class="profile-img profile-active" v-if="profile.profilePic"></div>
            <div class="profile-initials profile-active" v-else>
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
        <q-item :link="true" to="/">
          <q-item-side icon="mdi-home"/>
          <q-item-main label="HOME" />
        </q-item>
        <q-item :link="true" to="/stories">
          <q-item-side icon="mdi-book"/>
          <q-item-main label="MY STORIES" />
        </q-item>
        <!-- <q-item :link="true" to="/profile" v-if="user">
          <q-item-side icon="mdi-account" />
          <q-item-main label="MY ACCOUNT" />
        </q-item> -->
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
    <div v-if="loading" class="loading-box">
      <q-spinner-bars color="primary" :size="100" v-if="loading" />
    </div>
  </q-layout>
</template>

<script>
export default {
  name: 'LayoutDefault',
  data () {
    return {
      leftDrawerOpen: this.$q.platform.is.desktop,
      storiesSet: false
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
   onLogout () {
      this.$store.dispatch('logout');
      this.$router.push('/');
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
      this.storiesSet = true;
    }
  },
  watch: {
    user(newUser) {
      if (!this.storiesSet) {
        this.$store.dispatch('setStories', this.user.id);
        this.storiesSet = true;
      }
    }
  }
}
</script>

<style lang="stylus">
.profile {
  margin-top: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  a {
    text-decoration: none;
    color: #000;
  }
  .profile-avatar {
    display: inline-block;
    width: 150px;
    max-width: 100%;
    border-radius: 50%;
    .profile-active {
      box-shadow: 0 1px 5px rgba(0,0,0,0.2), 0 2px 2px rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12);
      border: solid 3px transparent;
    }
    .profile-img {
      border-radius: 50%;
      max-width: 100%;
      height: 150px;
      background-position: center center;
      background-size: cover;
    }
    .profile-initials {
      width: 150px;
      max-width: 100%;
      height: 150px;
      display: flex;
      border-radius: 50%;
      align-items: center;
      justify-content: center;
      font-size: 4em;
      border: none;
      background-color: #ddd;
    }
  }
  .profile-label {
    text-align: center;
    margin-top: 5px;
  }
}
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
