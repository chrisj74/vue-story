<template>
  <div>
    <q-layout view="lHh Lpr lFf" :class="'app-dragging'">
      <!-- left drawer -->
      <q-btn
        class="drawer-btn"
        flat
        dense
        round
        size="lg"
        @click="toggleLeftDawer()"
        :style="{left: leftDrawerOpen ? '300px' : 0}"
      >
        <q-icon name="mdi-menu" />
      </q-btn>
      <!-- plan -->
      <q-btn
        class="plan-btn"
        flat
        dense
        round
        size="lg"
        @click="togglePlan()"
      >
        <q-icon :name="showPlan ? 'mdi-close' : 'mdi-file-document-box-outline'" />
      </q-btn>

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
          <q-item :link="true" to="/projects">
            <q-item-side icon="mdi-book"/>
            <q-item-main label="MY PROJECTS" />
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
    </q-layout>
    <div v-show="loading" class="loading-box">
      <q-spinner-bars color="primary" :size="100" />
    </div>
</div>
</template>

<script>
export default {
  name: 'Story',
  data () {
    return {
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
    screen() {
      return this.$store.getters.screen;
    },
    showPlan() {
      return this.$store.getters.showPlan;
    },
    leftDrawerOpen() {
      return this.$store.getters.getLeftDrawerOpen;
    }
  },
  mounted () {
    this.$store.dispatch('setImages', this.user.id);
  },
  methods: {
   onLogout () {
      this.$store.dispatch('logout');
      this.$router.push('/');
    },
    togglePlan() {
      this.$store.commit('setLeftDrawerOpen', false);
      this.$store.dispatch('toggleShowPlan');
    },
    toggleLeftDawer() {
      this.$store.dispatch('toggleLeftDrawerOpen');
    }
  },
}
</script>

<style>
.app-dragging {
  position: fixed;
}
.drawer-btn {
  position: absolute;
  top: 0;
  left: 5px;
  z-index: 999;
}
.plan-btn {
  position: absolute;
  top: 0;
  right: 5px;
  z-index: 999;
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
