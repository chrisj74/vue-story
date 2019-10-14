<template>
  <div id="login" v-if="setAuth">
    <div class="layout-padding">
      <div class="mid-bg"></div>
      <div class="login-card shadow-4 bg-white">
        <h5 class="login-title">LOGIN</h5>
        <div class="row gutter-md">
          <div class="col-xs-12">
            <q-input float-label="Email" type="email" v-model="email" />
          </div>
          <div class="col-xs-12">
            <q-input
              type="password"
              float-label="Password"
              v-model="password"
              ref="pw"
              :after="[{icon: 'mdi-eye-outline', content: false, condition: $refs.pw && !$refs.pw.showPass, handler () {$refs.pw.showPass = !$refs.pw.showPass}}, {icon: 'mdi-eye-off-outline', content: false, condition: $refs.pw && $refs.pw.showPass, handler () {$refs.pw.showPass = !$refs.pw.showPass}}]"
              @keyup.enter="onSignin"
            />
          </div>
        </div>
        <div v-if="userError" class="error-message">
          <q-alert type="negative" class="q-mb-sm" icon="mdi-alert">{{ userError.message }} <br> Don't have an account?
            <a href="/register">Register now</a></q-alert>
        </div>
        <div class="text-center" style="margin-top: 30px">
          <p>
            <q-btn color="primary" @click="onSignin" :disable="!password || !email">
              <span v-if="!loading">LOG IN WITH EMAIL</span>
              <q-spinner-dots v-else />
            </q-btn>
          </p>
          <p>OR</p>
          <p>
            <social-sign-in></social-sign-in>
          </p>
          <p>
            Don't have an account?
            <a href="/register">Register now</a>.
          </p>
          <p class="forgotten-password" @click="showForgottenPassword()">Forgotten password?</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { QSpinnerDots, Loading } from "quasar";
import SocialSignIn from "../../components/user/SocialSignIn.vue";
export default {
  components: {
    QSpinnerDots,
    SocialSignIn
  },
  data() {
    return {
      email: "",
      password: ""
    };
  },
  computed: {
    user() {
      return this.$store.getters.user;
    },
    setAuth() {
      return this.$store.getters.setAuth;
    },
    loading() {
      return this.$store.getters.loading;
    },
    userError() {
      return this.$store.getters.getUserError;
    }
  },
  methods: {
    showForgottenPassword() {
      this.$q
        .dialog({
          title: "Forgotten Password",
          message: "Enter the password you used to create an account and we'll send you an email with a link to reset your password.",
          prompt: {
            model: this.email,
            type: "text" // optional
          },
          cancel: true,
          color: "primary"
        })
        .then(forgottenEmail => {
          console.log('forgottenEmail=', forgottenEmail, 'email=', this.email);
          this.$store.dispatch("forgottenPassword", forgottenEmail).then(() => {
            this.$q.notify({
              message: `Check your email for instructions on how to reset your password.`,
              color: 'positive',
              textColor: 'black',
              icon: 'mdi-email'});
          });
        })
        .catch(() => {
          this.$q.notify("Eeeek, something went wrong :(");
        });
    },

    onSignin() {
      this.$store.dispatch("signUserIn", {
        email: this.email,
        password: this.password,
        redirect: this.$router.currentRoute.query
      });
    }
  },
  mounted() {
    this.$store.dispatch("setUserError", null);
    if(!this.setAuth) {
      this.$q.loading.show({
        delay: 200
      });
    }
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
  }
};
</script>
<style lang="stylus">
.q-input i.q-if-control.q-icon.material-icons {
  display: none;
}

.error-message {
  margin-top: 10px;
}
.forgotten-password {
  cursor: pointer;
  text-decoration: underline;
}
</style>