<template>
  <q-page class="user-index-container">
    <h2>Profile</h2>
    <div class="row justify-end">
      <q-btn @click="showEdit()" v-if="!editProfile">edit</q-btn>
      <q-btn @click="showEdit()" v-if="editProfile">done</q-btn>
    </div>
    <div class="profile-wrapper" v-if="profile">
      <div v-if="!editProfile">
        <p>Name: {{ profile.nickName }}<p>
        <p>Age: {{profile.age }}</p>
      </div>
      <div v-else>
        <edit-profile></edit-profile>
      </div>
    </div>
  </q-page>
</template>

<script>
import EditProfile from '../../components/user/EditProfile'
export default {
  name: 'UserIndex',
  components: {EditProfile},
  data() {
    return {
      editProfile: false,
    }
  },
  mounted() {
    /** Mounted */


  },
  destroyed() {
    this.profileData = null;
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
    showEdit() {
      this.editProfile = !this.editProfile;
    }
  }
}
</script>

<style lang="stylus">
.user-index-container {
  padding: 10px;
}
</style>