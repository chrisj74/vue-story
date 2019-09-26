<template>
  <q-page class="user-index-container" v-if="profiles && activeProfile">
    <transition name="fade" mode="out-in">
      <div v-if="!profileSettings.editProfile && !profileSettings.addProfile" key="viewProfiles">
        <div class="row justify-center manage-profiles-wrapper" v-if="editProfiles">
          <span class="done-btn"><q-btn @click="showEdit()" size="sm">Done</q-btn></span>
          <h5>Manage Profiles</h5>
        </div>
        <div class="profiles-wrapper">
          <div class="row justify-center">
            <div class="profile"
              v-for="profile in profiles"
              :key="profile.id"
              @click="editProfiles ? editProfileById(profile.id) : switchProfile(profile.id)"
            >
              <div class="profile-avatar" :class="{'profile-active' : profile.id === activeProfile.id}">
                  <div :style="{backgroundImage: 'url(' + profile.profilePic + ')'}" class="profile-img"
                    v-if="profile && profile.profilePic"
                  ></div>
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
          <div class="row justify-center">
            <q-btn @click="showEdit()" icon="mdi-pencil" size="sm" v-if="!editProfiles">Manage Profiles</q-btn>
          </div>
        </div>
      </div>
      <div v-else-if="profileSettings.editProfile" key="editProfile">
        <edit-profile :profileId="profileToEdit"></edit-profile>
      </div>
      <div v-else-if="profileSettings.addProfile" key="editProfile">
        <add-profile></add-profile>
      </div>
    </transition>
  </q-page>
</template>

<script>
import EditProfile from '../../components/user/EditProfile';
import AddProfile from '../../components/user/AddProfile'
export default {
  name: 'Profiles',
  components: {EditProfile, AddProfile},
  data() {
    return {
      editProfiles: false,
      profileToEdit: null,
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
    },
    profileSettings () {
      return this.$store.getters.getProfileSettings;
    }
  },
  methods: {
    showEdit() {
      this.editProfiles = !this.editProfiles;
    },

    addProfile() {
      const payload = {
        addProfile: true
      }
      this.$store.commit('setProfileSettings', payload);
    },

    editProfileById(profileId){
      this.profileToEdit = profileId;
      const payload = {
        editProfile: true
      }
      this.$store.commit('setProfileSettings', payload);
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

.fade-enter-active, .fade-leave-active {
  transition: opacity .5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}

.user-index-container {
  padding: 10px;
}
.manage-profiles-wrapper {
  position: relative;
  .done-btn {
    position: absolute;
    top: 0;
    left: 0;
  }
  h5 {
    margin: 0 0 50px 0;
  }
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
      .avatar-img {
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