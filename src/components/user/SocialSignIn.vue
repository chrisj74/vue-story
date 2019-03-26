<template>
  <q-btn
    color="primary"
    class="red"
    dark
    :disabled="loading"
    @click.prevent="onSigninGoogle"
  >Login with Google
    <span v-if="!loading">Google LOG IN</span>
    <q-spinner-dots v-else/>
  </q-btn>
</template>

<script>
import { QSpinnerDots } from 'quasar';
export default {
  components: {
      QSpinnerDots
  },
  computed: {
    user() {
      return this.$store.getters.user;
    },
    loading() {
      return this.$store.getters.loading;
    }
  },
  methods: {
    onSigninGoogle() {
      this.$store.dispatch("signUserInGoogle");
    },
    onSigninFacebook() {
      this.$store.dispatch("signUserInFacebook");
    },
    onSigninGithub() {
      this.$store.dispatch("signUserInGithub");
    },
    onSigninTwitter() {
      this.$store.dispatch("signUserInTwitter");
    }
  }
};
</script>
