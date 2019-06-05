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
        <div class="text-center" style="margin-top: 30px">
          <q-btn color="primary" @click="onSignup">
            <span v-if="!loading">SIGN UP</span>
            <q-spinner-dots v-else/>
          </q-btn>
          <p>OR</p>
          <social-sign-in></social-sign-in>
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