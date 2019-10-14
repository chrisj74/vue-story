<template>
  <div id="login">
    <div class="layout-padding">
      <div class="mid-bg"></div>
      <div class="login-card shadow-4 bg-white">
        <h5 class="login-title">REGISTER</h5>
        <div class="row gutter-md">
          <div class="col-xs-12">
            <q-input float-label="Email" type="email" v-model="email"/>
          </div>
          <div class="col-xs-12">
            <q-input
              type="password"
              float-label="Password"
              v-model="password"
              ref="pw"
              :after="[{icon: 'mdi-eye-outline', content: false, condition: $refs.pw && !$refs.pw.showPass, handler () {$refs.pw.showPass = !$refs.pw.showPass}}, {icon: 'mdi-eye-off-outline', content: false, condition: $refs.pw && $refs.pw.showPass, handler () {$refs.pw.showPass = !$refs.pw.showPass}}]"
              @keyup.enter="onSignup"
            />
          </div>
        </div>
        <div v-if="userError" class="error-message">
          <q-alert type="negative" class="q-mb-sm" icon="mdi-alert">{{ userError.message }} <br> Already have an account?
            <a href="/login">Login now</a></q-alert>
        </div>
        <div class="text-center" style="margin-top: 30px">
          <p>
            <q-btn color="primary" @click="onSignup">
              <span v-if="!loading">SIGN UP WITH EMAIL</span>
              <q-spinner-dots v-else/>
            </q-btn>
          </p>
          <p>OR</p>
          <p>
            <social-sign-in></social-sign-in>
          </p>
          <p>Already have an account? <a href="/login">Login</a>.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { QSpinnerDots } from 'quasar';
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
    mounted() {
      this.$store.dispatch("setUserError", null);
    },
    computed: {
      user () {
        return this.$store.getters.user
      },
      loading () {
        return this.$store.getters.loading
      },
      error () {
        return this.$store.getters.error
      },
      userError() {
        return this.$store.getters.getUserError;
      }
    },
    methods: {
      onSignup () {
        this.$store.dispatch('signUserUp', {email: this.email, password: this.password})
      }
    },
    watch: {
      user (value) {
        if (value !== null && value !== undefined) {
          this.$router.push('/')
        }
      }
    },
}
</script>
<style lang="stylus">
.q-input i.q-if-control.q-icon.material-icons
	display none
</style>