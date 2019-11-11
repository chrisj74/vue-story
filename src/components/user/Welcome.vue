<template>
  <q-modal-layout>
    <div class="welcome-wrapper">
      <h4>Welcome to the BETA</h4>
      <div class="welcome-content row gutter-sm">
        <div class="col-6">
          <div class="welcome-video">
            <iframe
              :src="'https://player.vimeo.com/video/368143095?autoplay=true&color=80a998&title=0&byline=0&portrait=0'"
              frameborder="0"
              allow="autoplay; fullscreen"
              allowfullscreen
            ></iframe>
          </div>
          <p>Start by updating your profile by adding or changing your name and updating your picture (don't forget to click the SAVE button).</p>
          <p>Next, close this popup and on the homepage click on the <strong>Start here (Beta)</strong> project and then click the ADD TO MY PROJECTS button.</p>
          <p>This quick project introduces you to the app and gets you started.</p>
          <p>Cheers<br />
          Chris
          </p>
        </div>
        <div class="col-6">
          <q-card class="layout-padding">
            <edit-profile v-if="activeProfile" :profileId="activeProfile.id"></edit-profile>
          </q-card>
        </div>
      </div>

    </div>
    <q-toolbar slot="footer">
      <q-btn color="white" text-color="black" @click="closeModal('showWelcome')">Close</q-btn>
      <q-toolbar-title></q-toolbar-title>

    </q-toolbar>
  </q-modal-layout>
</template>

<script>
import EditProfile from './EditProfile'
export default {
  name: "Welcome",
  components: { EditProfile },
  data() {
    return {

    };
  },
  computed: {
    user() {
      return this.$store.getters.user;
    },
    loading() {
      return this.$store.getters.loading;
    },
    activeProfile () {
      return this.$store.getters.profile;
    },
  },
  methods: {
    closeModal(type) {
      const newSetting = {};
      newSetting[type] = false;
      this.$store.commit("setProfileSettings", newSetting);
    },
  }
};
</script>

<style lang="stylus">
@import '~variables';
.welcome-wrapper {
  padding: 10px;
  h4 {
    margin: 10px 0;
  }
  .welcome-video {
    position: relative;
    padding-bottom: 56.25%; /* 16:9 */
    height: 0;
    margin-bottom: 10px;
    iframe, object, embed {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
  }
}

.add-actions {
  display: flex;
  justify-content: center;
}
</style>