<template>
  <q-layout view="lHh Lpr lFf" v-if="!loading">
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
      <router-view />
    </q-page-container>
    <q-spinner-bars color="primary" :size="50" v-if="loading" />
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
    }
  },
  methods: {
   onLogout () {
      this.$store.dispatch('logout');
      this.$router.push('/');
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

<style>
</style>
