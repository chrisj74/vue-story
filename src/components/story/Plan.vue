<template>
  <div class="plan" v-show="showPlan" ref="planContainer">
    <!-- PLAN -->
    <div class="plan-video" ref="planVideo">
      <iframe
        style="width: 100%"
        :src="story.plan && story.plan.length > 0 && story.plan[0].video ? story.plan[0].video : ''"
        frameborder="0"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        v-show="videoSource === 'youtube'"
      ></iframe>
      <iframe
        :src="story.plan && story.plan.length > 0 && story.plan[0].video ? story.plan[0].video : ''"
        id="planPlayer"
        frameborder="0"
        allow="autoplay; fullscreen"
        allowfullscreen
        v-show="videoSource === 'vimeo'"
      ></iframe>
    </div>
    <div
      v-if="story.plan && story.plan.length > 0"
      v-html="story.plan[0].text"
      class="plan-text ql-editor"
      :style="{maxHeight: textHeight}"
    ></div>
    <div class="edit-plan-btn">
      <q-btn color="primary" @click="showEditPlan()">edit</q-btn>
    </div>
    <!-- EDIT PLAN MODAL -->
    <q-modal
      v-if="pageDimensions"
      v-model="settings.showEditPlan"
      :content-css="{minWidth: '350px', height: '90vh', maxWidth: '100%', width: '90%'}"
    >
      <q-modal-layout>
        <edit-plan v-if="settings.showEditPlan"></edit-plan>
        <q-toolbar slot="footer">
          <q-toolbar-title>
            <q-btn color="white" text-color="black" @click="closeModal('showEditPlan')">Close</q-btn>
          </q-toolbar-title>
        </q-toolbar>
      </q-modal-layout>
    </q-modal>
  </div>
</template>

<script>
import Player from "@vimeo/player";
import EditPlan from "./EditPlan";
import * as _ from "lodash";

export default {
  name: "Plan",
  components: { EditPlan },
  data() {
    return {
      videoSet: false,
      textHeight: "auto",
      playbackTimeout: null,
      playbackDuration: null,
      player: null,
      videoSource: null,
    };
  },
  computed: {
    user() {
      return this.$store.getters.user;
    },
    loading() {
      return this.$store.getters.loading;
    },
    showPlan() {
      return this.$store.getters.showPlan;
    },
    story() {
      return this.$store.getters.getStory;
    },
    pageDimensions() {
      return this.$store.getters.getPageDimensions;
    },
    settings() {
      return this.$store.getters.getSettings;
    }
  },
  mounted() {
    if (this.story.plan && this.story.plan.length > 0 && this.story.plan[0].video) {
      this.setVideoSource();
      this.videoSet = true;
      var iframe = document.querySelector("#planPlayer");
      this.player = new Player("planPlayer");
      const _this = this;
      this.player.on("play", function() {
        _this.getPlaybackPosition();
      });

      this.player.on("pause", function() {
        clearTimeout(_this.playbackTimeout);
      });

      this.player.getDuration().then(function(duration) {
        _this.playbackDuration = duration;
      });

      this.setPlaybackPosition();
    }
    this.getTextHeight();
  },
  methods: {
    closeModal(type) {
      const newSetting = {};
      newSetting[type] = false;
      this.$store.commit("setSettings", newSetting);
    },

    showEditPlan() {
      const payload = {
        showEditPlan: true
      };
      this.$store.commit("setSettings", payload);
    },

    setVideoSource() {
      if (
        this.story.plan[0].video &&
        this.story.plan[0].video.indexOf("youtube.") != -1
      ) {
        this.videoSource =  "youtube";
      }
      if (
        this.story.plan[0].video &&
        this.story.plan[0].video.indexOf("vimeo.") != -1
      ) {
        this.videoSource =  "vimeo";
      }
    },

    /* Plan  */
    getTextHeight() {
      if (this.$refs.planVideo && this.$refs.planContainer) {
        this.textHeight =
          this.$refs.planContainer.clientHeight -
          (this.$refs.planVideo.clientHeight + 10) +
          "px";
      } else if (this.$refs.planContainer) {
        this.textHeight = this.$refs.planContainer.clientHeight + "px";
      } else {
        this.textHeight = "auto";
      }
    },

    setPlaybackPosition() {
      if (
        this.story.playback &&
        this.story.playback.hasOwnProperty("currentVideo")
      ) {
        const startTime = this.story.playback.videos[
          this.story.playback.currentVideo
        ].playbackPosition;
        this.player
          .setCurrentTime(startTime)
          .then(function(seconds) {
            // `seconds` indicates the actual time that the player seeks to
          })
          .catch(function(error) {
            switch (error.name) {
              case "RangeError":
                // The time is less than 0 or greater than the video's duration
                break;

              default:
                // Some other error occurred
                break;
            }
          });
      }
    },

    getPlaybackPosition() {
      const _this = this;
      this.player.getCurrentTime().then(function(seconds) {
        const complete = seconds > _this.playbackDuration - 60;
        const payload = {
          user: _this.user,
          storyKey: _this.$route.params.id,
          story: {
            playback: {
              currentVideoIndex: 0,
              videos: [
                {
                  index: 0,
                  playbackPosition: seconds,
                  complete: complete,
                  duration: _this.duration
                }
              ]
            }
          }
        };
        _this.$store.dispatch("updateStory", _.cloneDeep(payload));
        _this.playbackTimeout = setTimeout(() => {
          _this.getPlaybackPosition();
        }, 5000);
      });
    }
  },
  watch: {
    story: {
      handler(newStory, oldStory) {
        this.getTextHeight();
        /* if (this.story.plan && this.story.plan[0].video && !this.videoSet) {
          this.videoSet = true;
          var iframe = document.getElementById("planPlayer");
          this.player = new Player("planPlayer");
          var _this = this;
          this.player.on("play", function() {
            _this.setPlaybackPosition();
          });
        } */
      },
      deep: true
    },
    showPlan: {
      handler() {
        if (this.showPlan) {
          this.player.play();
        } else {
          this.player.pause();
        }
      }
    }
  }
};
</script>

<style lang="stylus"></style>