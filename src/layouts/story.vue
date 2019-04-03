<template>
  <q-layout view="lHh Lpr lFf" v-if="!loading">
    <q-layout-header>
      <q-toolbar color="primary">
        <q-btn
          flat
          dense
          round
          @click="leftDrawerOpen = !leftDrawerOpen"
        >
          <q-icon name="menu" />
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
          <q-item-side icon="home"/>
          <q-item-main label="HOME" />
        </q-item>
        <q-item :link="true" to="/stories">
          <q-item-side icon="book"/>
          <q-item-main label="STORIES" />
        </q-item>
        <q-item @click.native="onLogout" v-if="user">
          <q-item-side icon="power settings new" />
          <q-item-main label="EXIT" />
        </q-item>
        <q-item :link="true" to="/login" v-else>
          <q-item-side icon="fas fa-user" />
          <q-item-main label="Login" />
        </q-item>
      </q-list>
    </q-layout-drawer>

    <q-page-container>
      <transition appear>
        <router-view />
      </transition>
    </q-page-container>
    <q-spinner-bars color="primary" :size="50" v-if="loading" />
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
</style>
