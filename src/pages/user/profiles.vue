<template>
  <q-page class="user-index-container">
    <div class="row justify-start">
      <q-btn @click="showEdit()" size="sm" v-if="!editProfiles">Manage Profiles</q-btn>
      <q-btn @click="showEdit()" size="sm" v-if="editProfiles">Done</q-btn>
    </div>
    <div class="profiles-wrapper" v-if="profiles">
      <div v-if="!editProfile" class="profiles-wrapper">
        <div class="row justify-center">
          <div class="profile"
            v-for="profile in profiles"
            :key="profile.id"
            @click="editProfiles ? editProfileById(profile.id) : switchProfile(profile.id)"
          >
            <div class="profile-avatar">
                <img :src="profile.profilePic" class="profile-img"
                  :class="{'profile-active' : profile.id === activeProfile.id}"
                  v-if="profile && profile.profilePic"
                />
                <div v-else class="profile-initials" :class="{'profile-active' : profile.id === activeProfile.id}">
                  {{ getInitials(profile.nickName)}}
                </div>
                <div class="profile-edit" v-if="editProfiles">
                  <i class="mdi mdi-pencil"></i>
                </div>
            </div>
            <div class="profile-label" v-if="profile && profile.nickName">
              {{profile.nickName}}
            </div>
          </div>
          <div class="profile" @click="addProfile()" v-if="!editProfiles">
            <q-btn icon="mdi-plus-circle" round size="xl" label="New Story" />
            <p>Add Profile</p>
          </div>
        </div>
        <div class="row justify-center" v-if="editProfiles">
          <div class="profile" @click="addProfile()">
            <q-btn icon="mdi-plus-circle" round size="xl" label="New Story" />
            <p>Add Profile</p>
          </div>
        </div>
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
  name: 'Profiles',
  components: {EditProfile},
  data() {
    return {
      editProfiles: false,
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
    profiles () {
      return this.$store.getters.profiles;
    },
    activeProfile () {
      return this.$store.getters.profile;
    }

  },
  methods: {
    showEdit() {
      this.editProfiles = !this.editProfiles;
    },

    addProfile() {

    },

    editProfileById(profileId){

    },

    switchProfile(profileId) {
      this.$store.dispatch('setProfile', profileId);
    },

    getInitials(name) {
      let initialsStr = '';
      let initials = name.split(' ');
      initials.forEach((initial, index) => {
        if (index === 0 || index === (initials.length -1)) {
          initialsStr += initial.substr(0,1);
        }
      });
      return initialsStr;
    }
  }
}
</script>

<style lang="stylus">
@import '~variables';
.user-index-container {
  padding: 10px;
}
.profiles-wrapper {
  margin-top: 10px;
  .profile {
    margin-right: 10px;
    margin-bottom: 20px;
    cursor: pointer;
    position: relative;
    .profile-avatar {
      position: relative;
      img {
        position: relative;
        z-index: 1;
      }
      .profile-edit {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 5em;
        z-index: 2;
        background-color: rgba(0,0,0,0.5);
        color: #fff;
      }
    }
  }
}

</style>