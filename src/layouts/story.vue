<template>
  <div :class="{'show-plan': showPlan}">
    <q-layout view="lHh Lpr lFf" :class="'app-dragging'">
      <!-- left drawer -->
      <q-btn
        class="drawer-btn"
        flat
        dense
        round
        size="lg"
        @click="toggleLeftDawer()"
        :color="leftDrawerOpen ? 'white' : 'standard'"
        :style="{left: leftDrawerOpen ? '300px' : 0}"
      >
        <q-icon
          :name="leftDrawerOpen ? 'mdi-close' : 'mdi-menu'"
          :color="leftDrawerOpen ? 'black' : 'standard'"
        />
      </q-btn>
      <!-- plan -->
      <q-btn class="plan-btn" flat dense round size="lg" @click="togglePlan()">
        <q-icon :name="showPlan ? 'mdi-close' : 'mdi-file-document-box-outline'" />
      </q-btn>

      <q-layout-drawer v-model="leftDrawerOpen" content-class="bg-grey-2">
        <div class="profile">
          <div class="profile-avatar profile-active" v-if="profile">
            <router-link :to="'/profiles'">
              <div
                :style="{backgroundImage: 'url(' + profile.profilePic + ')'}"
                class="profile-img"
                v-if="profile.profilePic"
              ></div>
              <div class="profile-initials" v-else>{{ getInitials(profile.nickName) }}</div>
            </router-link>
          </div>
          <div class="profile-label" v-if="profile && profile.nickName">
            <router-link :to="'/profiles'">{{profile.nickName}}</router-link>
          </div>
        </div>
        <q-list no-border link inset-delimiter>
          <q-item :link="true" to="/home">
            <q-item-side icon="mdi-home" />
            <q-item-main label="HOME" />
          </q-item>
          <q-item :link="true" to="/projects">
            <q-item-side icon="mdi-book" />
            <q-item-main label="MY PROJECTS" />
          </q-item>
          <q-item>
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
import bruitConfig from "../assets/bruit-config.json";
export default {
  name: "Story",
  data() {
    return {
      storiesSet: false,
      bruitConfig
    };
  },
  computed: {
    user() {
      return this.$store.getters.user;
    },
    loading() {
      return this.$store.getters.loading;
    },
    screen() {
      return this.$store.getters.screen;
    },
    showPlan() {
      return this.$store.getters.showPlan;
    },
    leftDrawerOpen: {
      set() {
        this.$store.dispatch("toggleLeftDrawerOpen");
      },
      get() {
        return this.$store.getters.getLeftDrawerOpen;
      }
    },
    profile() {
      return this.$store.getters.profile;
    }
  },
  mounted() {
    this.$store.dispatch("setImages", this.user.id);
    this.$store.dispatch('setStories', this.user.id);
  },
  methods: {
    openFeedback() {
      this.$store.commit('setLeftDrawerOpen', false);
    },

    getInitials(name) {
      let initialsStr = "";
      let initials = name.split(" ");
      initials.forEach((initial, index) => {
        if (index === 0 || index === initials.length - 1) {
          initialsStr += initial.substr(0, 1);
        }
      });
      return initialsStr;
    },

    onLogout() {
      this.$store.dispatch("logout");
      this.$router.push("/login");
    },
    togglePlan() {
      this.$store.commit("setLeftDrawerOpen", false);
      this.$store.dispatch("toggleShowPlan");
    },
    toggleLeftDawer() {
      this.$store.dispatch("toggleLeftDrawerOpen");
    }
  }
};
</script>

<style>
.app-dragging {
  position: fixed;
}
.drawer-btn {
  position: absolute;
  top: 0;
  left: 5px;
  z-index: 4999;
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
  background: rgba(255, 255, 255, 0.8);
}
</style>
