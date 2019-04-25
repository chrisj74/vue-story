<template>
  <q-layout view="lHh Lpr lFf">
    <q-layout-header>
      <q-toolbar color="primary">
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
          <div slot="subtitle">Quasar Framework 0.15.6 + Firebase Auth</div>
        </q-toolbar-title>
      </q-toolbar>
    </q-layout-header>

    <q-layout-drawer
      v-model="leftDrawerOpen"
      content-class="bg-grey-2"
    >
      <q-list
        no-border
        link
        inset-delimiter
      >
        <q-list-header>Essential Links</q-list-header>
        <q-item :link="true" to="/">
          <q-item-side icon="mdi-home"/>
          <q-item-main label="HOME" />
        </q-item>
        <q-item :link="true" to="/stories">
          <q-item-side icon="mdi-book"/>
          <q-item-main label="STORIES" />
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
      <transition appear>
        <router-view />
      </transition>
    </q-page-container>
    <div v-if="loading" class="loading-box">
      <q-spinner-bars color="primary" :size="100" />
    </div>

  </q-layout>
</template>

<script>
export default {
  name: 'Story',
  data () {
    return {
      leftDrawerOpen: false,
      storiesSet: false
    }
  },
  computed: {
    user () {
      return this.$store.getters.user
    },
    loading () {
      return this.$store.getters.loading
    }
  },
  methods: {
   onLogout () {
      this.$store.dispatch('logout');
      this.$router.push('/');
    }
  },
  mounted () {
    /* if (this.user) {
      this.$store.dispatch('setStories', this.user.id);
      this.storiesSet = true;
    } */
  },
  watch: {
    /* user(newUser) {
      if (!this.storiesSet) {
        this.$store.dispatch('setStories', this.user.id);
        this.storiesSet = true;
      }
    } */
  }
}
</script>

<style>
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