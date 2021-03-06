<template>
  <div class="edit-form">
    <h5>Edit Profile</h5>
    <div v-if="profileData">
      <div  class="profile">
        <div class="profile-avatar">
            <div :style="{backgroundImage: 'url(' + profileData.profilePic + ')'}" class="profile-img"
              v-if="profileData.profilePic"
            ></div>
            <div v-else class="profile-initials">
              {{ getInitials(profileData.nickName)}}
            </div>
        </div>
      </div>
      <div class="row justify-center form-button-wrapper">
        <q-btn color="primary" icon="mdi-pencil" @click="changeAvatar()">Change</q-btn>
      </div>
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
      <div class="row justify-center form-button-wrapper" v-if="!profileData.default">
        <q-btn color="negative" size="sm" icon="mdi-delete" @click="showDeleteProfile()">Delete</q-btn>
      </div>
      <div class="row justify-between form-button-wrapper">
        <q-btn color="white" text-color="black" icon="mdi-cancel" @click="close()">Cancel</q-btn>
        <q-btn color="primary" icon="mdi-save" @click="saveProfile()">Save</q-btn>
      </div>
    </div>

    <!-- Avatar Modal -->
    <q-modal
      v-model="profileSettings.avatarModal"
      :content-css="{minWidth: '350px', height: '90vh', maxWidth: '90vw', width: '800px'}">
      <add-image :maxWidth="300" :aspectRatio="1"></add-image>
    </q-modal>

    <!-- Confirm Delete Modal -->
    <q-modal
      v-model="profileSettings.confirmDelete"
      :content-css="{minWidth: '350px', maxWidth: '100%', width: '80vw'}">
      <q-modal-layout>
        <q-toolbar slot="header">
          <q-toolbar-title>
            DELETE PROFILE
          </q-toolbar-title>
        </q-toolbar>

        <q-toolbar slot="footer">
          <q-btn @click="closeConfirmDelete()">Cancel</q-btn>
          <q-toolbar-title></q-toolbar-title>
          <q-btn color="negative" icon="mdi-delete" @click="deleteProfile()" :disabled="confirmDelete !== 'DELETE PROFILE'">Delete</q-btn>
        </q-toolbar>

        <div class="layout-padding">
          <p>Are you sure you want to permanently delete this profile?</p>
          <p>You cannot undo deleting a profile, so please confirm you want to this by typing <strong>DELETE PROFILE</strong> exactly like this in the box below.
          Then click Delete</p>

          <q-input type="text" v-model="confirmDelete" />

        </div>
      </q-modal-layout>
    </q-modal>
  </div>
</template>

<script>
import * as _ from 'lodash';
import { required, email } from 'vuelidate/lib/validators';
import AddImage from "../story/PixabaySearch";

export default {
  name: 'EditProfile',
  components: { AddImage },
  props: ['profileId'],
  data() {
    return {
      profileData: null,
      confirmDelete: ''
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
      return this.$store.getters.getProfileById(this.profileId);
    },
    profileSettings () {
      return this.$store.getters.getProfileSettings;
    },
    insertImage() {
      return this.$store.getters.getInsertImage;
    },
  },
  methods: {
    showDeleteProfile() {
      const payload = {
        confirmDelete: true
      }
      this.$store.commit('setProfileSettings', payload);
    },

    closeConfirmDelete() {
      this.confirmDelete = '';
      const payload = {
        confirmDelete: false
      }
      this.$store.commit('setProfileSettings', payload);
    },

    deleteProfile() {
      this.closeConfirmDelete();
      this.$store.dispatch('deleteProfile', JSON.parse(JSON.stringify(this.profileData)))
        .then(() => {
          this.close();
        });
    },

    setProfile(newProfile) {
      this.profileData = newProfile;
    },

    saveProfile() {
      this.$store.dispatch('updateProfile', JSON.parse(JSON.stringify(this.profileData)))
        .then(() => {
          this.close();
        });
    },

    changeAvatar() {
      const payload = {
        avatarModal: true
      }
      this.$store.commit('setProfileSettings', payload);
    },

    updateAvatar(imageObj) {
      this.$store.commit("clearInsertImage");
      this.$store.commit("clearImageSearchResults");
      this.profileData.profilePic = imageObj.webformatURL;
      const newSetting = {
        avatarModal: false,
      };
      this.$store.commit('setProfileSettings', newSetting);
    },
  // TODO move to common
    getInitials(name) {
      let initialsStr = '';
      let initials = name.split(' ');
      initials.forEach((initial, index) => {
        if (index === 0 || index === (initials.length -1)) {
          initialsStr += initial.substr(0,1);
        }
      });
      return initialsStr;
    },

    close() {
      const payload = {
        editProfile: false
      }
      this.$store.commit('setProfileSettings', payload);
    }
  },
  watch: {
    profile : {
      handler: function(newProfile, oldProfile) {
        this.profileData = _.cloneDeep(this.profile);
      },
      deep: true
    },
    insertImage: {
      handler: function(newImage, oldImage) {
        this.$store.commit('setLoading', false);
        if (newImage && (this.profileSettings.editProfile || this.profileSettings.showWelcome)) {
          this.updateAvatar(newImage);
        }
      },
      deep: true
    }
  }
}
</script>

<style lang="stylus">
.edit-form {
  max-width: 500px;
  margin: 0 auto;
  h5 {
    margin: 0 0 50px 0;
    text-align: center;
  }
  .form-button-wrapper {
    margin-top: 20px;
  }
}
</style>