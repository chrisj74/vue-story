<template>
  <div>
    <h3>Edit Profile</h3>
    <div v-if="profileData">
      <q-input
        type="text"
        :error="$v.profileData.nickName.$error"
        v-model="profileData['nickName']"
        @input="$v.profileData.nickName.$touch"
        float-label="Name"
      />
      <q-input
        type="number"
        v-model="profileData['age']"
        float-label="Age"
      />

      <q-btn color="primary" icon="mdi-save" @click="saveProfile()">save</q-btn>
    </div>
  </div>
</template>

<script>
import * as _ from 'lodash';
import { required, email } from 'vuelidate/lib/validators'
export default {
  name: 'EditProfile',
  data() {
    return {
      profileData: null,
    }
  },
  validations: {
    profileData: {
      nickName: { required }
    }
  },
  mounted() {
    /** Mounted */
    this.setProfile(_.cloneDeep(this.profile));
  },
  computed: {
    user () {
      return this.$store.getters.user
    },
    loading () {
      return this.$store.getters.loading
    },
    profile () {
      return this.$store.getters.profile;
    }
  },
  methods: {
    setProfile(newProfile) {
      console.log('setProfile=', newProfile);
      this.profileData = newProfile;
    },

    saveProfile() {
      this.$store.dispatch('updateProfile', JSON.parse(JSON.stringify(this.profileData)));
    }
  },
  watch: {
    profile : {
      handler: function(newProfile, oldProfile) {
        this.profileData = _.cloneDeep(this.profile);
      },
      deep: true
    },
  }
}
</script>

<style lang="stylus">

</style>