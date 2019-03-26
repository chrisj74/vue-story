<template>
  <div id="login" v-if="setAuth">
    <div class="layout-padding">
      <div class="mid-bg"></div>
      <div class="login-card shadow-4 bg-white">
        <h5 class="login-title">LOGIN</h5>
        <div class="row gutter-md">
          <div class="col-xs-12">
            <q-input float-label="Email" type="email" v-model="email"/>
          </div>
          <div class="col-xs-12">
            <q-input
              type="password"
              float-label="Password"
              v-model="password"
              @keyup.enter="onSignin"
            />
          </div>
        </div>
        <div class="text-center" style="margin-top: 30px">
          <q-btn color="primary" @click="onSignin">
            <span v-if="!loading">LOG IN</span>
            <q-spinner-dots v-else/>
          </q-btn>
          <social-sign-in></social-sign-in>
          <p>Don't have an account? <a href="/register">Register now</a>.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { QSpinnerDots, Loading } from 'quasar';
import SocialSignIn from '../../components/user/SocialSignIn.vue';
export default {
    components: {
      QSpinnerDots,
      SocialSignIn
    },
    data() {
      return {
        email: '',
        password: ''
      }
    },
    computed: {
      user () {
        return this.$store.getters.user
      },
      setAuth() {
        return this.$store.getters.setAuth;
      },
      loading () {
        return this.$store.getters.loading
      }
    },
    methods: {
      onSignin () {
        this.$store.dispatch('signUserIn', {email: this.email, password: this.password, redirect: this.$router.currentRoute.query});
      },
    },
    mounted () {
      this.$q.loading.show({
        delay: 200
      })
    },
    beforeDestroy() {
      this.$q.loading.hide();
    },
    watch: {
      setAuth(newVal) {
        if (newVal) {
          this.$q.loading.hide();
        }
      }
    },

}
</script>