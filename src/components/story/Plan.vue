<template>
  <div class="plan" v-show="showPlan" ref="planContainer">
    <!-- PLAN -->
    <div class="plan-video" ref="planVideo">
      <div
        v-if="(story.plan[0].videoObj && story.plan[0].videoObj.id) || youtubeVideo"
        class="plan-video"
        ref="planPreviewVideo"
      >
        <iframe
          style="width: 100%"
          :src="'https://www.youtube.com/embed/' + story.plan[0].videoObj.id + '?playsinline=1'"
          frameborder="0"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          v-if="story.plan[0].videoObj.service === 'youtube' && !youtubeVideo"
        ></iframe>
        <iframe
          :src="'https://player.vimeo.com/video/' + story.plan[0].videoObj.id + '?color=80a998&title=0&byline=0&portrait=0'"
          frameborder="0"
          allow="autoplay; fullscreen"
          allowfullscreen
          id="planPlayer"
          v-if="story.plan[0].videoObj.service === 'vimeo' && !youtubeVideo"
        ></iframe>

        <iframe
          style="width: 100%"
          :src="'https://www.youtube.com/embed/' + youtubeVideo + '?playsinline=1&autoplay=1'"
          frameborder="0"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          v-if="youtubeVideo"
        ></iframe>
        <div class="youtube-close" v-if="youtubeVideo"><q-btn icon="mdi-close-circle" color="negative" @click="closeYoutube()">Close</q-btn></div>
      </div>
    </div>
    <div>
      <div class="q-modal-layout col column no-wrap plan-text" :style="{maxHeight: textHeight}">
        <div class="q-layout-header">
          <q-tabs v-model="tabsModel">
            <q-tab
              slot="title"
              name="tab-1"
              :default="story.plan && story.plan.length > 0"
              icon="mdi-file-document-box-outline"
              label="Notes"
            />
            <q-tab
              slot="title"
              name="tab-2"
              :default="!story.plan || story.plan.length === 0"
              icon="mdi-earth"
              label="Research"
            />
            <q-tab
              slot="title"
              name="tab-3"
              :default="!story.plan || story.plan.length === 0"
              icon="mdi-youtube"
              label="Video"
            />
          </q-tabs>
        </div>
        <div clss="q-modal-layout-content col scroll">
          <div v-if="tabsModel === 'tab-1'" v-html="story.plan[0].text" class="ql-editor wiki-tab"></div>
          <div v-if="tabsModel === 'tab-2'" class="wiki-tab">
            <q-toolbar color="white">
              <div v-shortkey="['enter']" @shortkey="searchWiki()">
                <q-search
                  :debounce="0"
                  no-icon
                  autofocus
                  inverted-light
                  color="secondary"
                  v-model="searchStr"
                  placeholder="Search"
                  :after="[
                    {
                      icon: 'mdi-magnify',
                      error: false,
                      handler () {
                        searchWiki()
                      }
                    }
                  ]"
                />
              </div>
            </q-toolbar>
            <!-- Search content -->
            <div class="wiki-wrapper">
              <!-- Wiki results -->
              <div v-if="showWikiResults" ref="wikiResults" class="wiki-content">
                <div v-if="wikiObj && wikiObj.length > 0">
                  <div
                    v-for="(result, index) in wikiObj"
                    :key="index"
                    @click="viewWiki(result.title)"
                    class="result-card"
                  >
                    <q-card>
                      <q-card-title>{{ result.title }}</q-card-title>
                      <q-card-main><p class="text-body-1">{{ result.extract }}</p></q-card-main>
                    </q-card>
                  </div>
                </div>
                <div v-if="wikiObj && wikiObj.length === 0">
                  <h2>Sorry... no results, check your spelling :)</h2>
                </div>
              </div>
              <!-- Wiki page -->
              <div @click="handleWikiClick" class="wiki-content" :class="{'no-images' : noImages}" v-if="showWikiPage" ref="wikiPage">
                <h5>{{ wikipediaResponse.title }}</h5>
                <div v-html="wikipediaResponse.html"></div>
              </div>
            </div>
          </div>
          <!-- Youtube -->
          <div v-if="tabsModel === 'tab-3'" class="youtube-tab">
            <q-toolbar color="white">
              <div v-shortkey="['enter']" @shortkey="searchYoutube()">
                <q-search
                  :debounce="0"
                  no-icon
                  autofocus
                  inverted-light
                  color="secondary"
                  v-model="youtubeSearchStr"
                  placeholder="Search"
                  :after="[
                    {
                      icon: 'mdi-magnify',
                      error: false,
                      handler () {
                        searchYoutube()
                      }
                    }
                  ]"
                />
              </div>
            </q-toolbar>
            <!-- Search content -->
            <div class="youtube-wrapper">
              <!-- Youtube results -->
              <div v-if="showYoutubeResults" ref="youtubeResults" class="youtube-content">
                <div v-if="youtubeObj && youtubeObj.length > 0">
                  <div
                    v-for="(result, index) in youtubeObj"
                    :key="index"
                    @click="viewYoutube(result.id.videoId)"
                    class="result-card"
                  >
                    <q-card>
                      <q-card-media>
                        <img :src="result.snippet.thumbnails.medium.url" />
                      </q-card-media>
                      <q-card-title>{{ result.snippet.title }}</q-card-title>
                    </q-card>
                  </div>
                </div>
                <div v-if="youtubeObj && youtubeObj.length === 0">
                  <h2>Sorry... no results, check your spelling :)</h2>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-show="wikiLoading" class="wiki-loading-box">
          <q-spinner-bars color="primary" :size="50" />
        </div>
      </div>
    </div>
    <div class="edit-plan-btn" v-if="!story.publishId && tabsModel === 'tab-1'">
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
          <q-toolbar-title></q-toolbar-title>
          <q-btn color="white" text-color="black" @click="closeModal('showEditPlan')">Done</q-btn>
        </q-toolbar>
      </q-modal-layout>
    </q-modal>

    <!-- IMAGE MODAL -->
    <q-modal
      v-if="pageDimensions"
      v-model="settings.showImageModal"
      :content-css="{minWidth: '350px', height: '90vh', maxWidth: '100%', width: pageDimensions.width+'px'}"
    >
      <add-image v-if="settings.showImageModal && wikiImage" :initialImage="wikiImage"></add-image>
    </q-modal>
  </div>
</template>

<script>
import Player from "@vimeo/player";
import EditPlan from "./EditPlan";
import AddImage from "./PixabaySearch";
import * as _ from "lodash";
import * as axios from "axios";
import * as blockList from "../../assets/blockList";
import * as youtubeApi from '../../assets/youtubeApi';

export default {
  name: "Plan",
  components: { EditPlan, AddImage },
  data() {
    return {
      videoSet: false,
      textHeight: "auto",
      playbackTimeout: null,
      playbackDuration: null,
      player: null,
      videoSource: null,
      wikipediaResponse: {
        html: '',
        title: ''
      },
      wikiObj: null,
      searchStr: '',
      showWikiResults: false,
      showWikiPage: false,
      tabsModel: null,
      wikiImage: null,
      wikiLoading: false,
      noImages: false,
      youtubeSearchStr: '',
      youtubeObj: null,
      youtubeVideo: null,
      showYoutubeResults: false,
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
    if (
      this.story.plan &&
      this.story.plan.length > 0 &&
      this.story.plan[0].videoObj &&
      this.story.plan[0].videoObj.service
    ) {
      this.videoSet = true;
      if (this.story.plan[0].videoObj.service === "vimeo") {
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
        this.story.playback.hasOwnProperty("currentVideoIndex")
      ) {
        const startTime = this.story.playback.videos[
          this.story.playback.currentVideoIndex
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
    },

    handleWikiClick(e) {
      e.preventDefault();
      if (e.target.matches("img")) {
        let imageStr = e.target.getAttribute("src");
        imageStr = imageStr.replace("thumb/", "");
        let suffix = -1;
        if (
          imageStr.indexOf("/" + e.target.getAttribute("width") + "px-") !== -1
        ) {
          suffix = imageStr.indexOf(
            "/" + e.target.getAttribute("width") + "px-"
          );
          imageStr = imageStr.substring(0, suffix);
          this.wikiImage = imageStr;
          this.$store.commit("setMode", "photo");
          const newSetting = {
            showImageModal: true
          };
          this.$store.commit("setSettings", newSetting);
        } else {
          console.error("not a thumbnail");
        }
      }
      if (e.target.matches("a")) {
        if (e.target.getAttribute("href").startsWith("/wiki")) {
          const pageRef = e.target.getAttribute("href").replace("/wiki/", "");
          this.viewWiki(pageRef);
        } else if (e.target.getAttribute("href").startsWith("#")) {
          this.$refs.wikiPage.scrollTo(e.target.getAttribute("href"));
        } else {
          console.log("external link");
        }
      }
    },

    searchWiki() {
      const url =
        "https://simple.wikipedia.org/w/api.php?action=query&generator=search&gsrnamespace=0&exsentences=1&exintro&explaintext&exlimit=max&prop=extracts&gsrlimit=10&gsrsearch=" +
        encodeURI(this.searchStr) +
        "&format=json&origin=*";
      if (!blockList.blockList.includes(this.searchStr.toLowerCase())) {
        this.wikiLoading = true;
        axios.get(url).then(response => {
          this.wikiObj = [];
          Object.keys(response.data.query.pages).forEach(key => {
            const titleArr = response.data.query.pages[key].title.split(' ');
            let clean = true;
            titleArr.forEach(word => {
              if (blockList.blockList.includes(word.toLowerCase())) {
                clean = false;
              }
            })
            if (clean) {
              this.wikiObj.push(response.data.query.pages[key]);
            }
          });
          this.showWikiPage = false;
          this.showWikiResults = true;
          this.wikiLoading = false;
          this.$nextTick(() => {
            this.$refs.wikiResults.scrollTop = 0;
          });
        });
      } else {
        this.wikiObj = [];
        console.log("naughty");
        this.showWikiPage = false;
        this.showWikiResults = true;
        this.$nextTick(() => {
          this.$refs.wikiResults.scrollTop = 0;
        });
      }
    },

    viewWiki(pageRef) {
      this.wikiLoading = true;
      const url =
        "https://simple.wikipedia.org/w/api.php?action=parse&page=" +
        encodeURI(pageRef) +
        "&format=json&&contentmodel=wikitext&mobileformat=true&origin=*";
      axios.get(url).then(response => {
        this.noImages = false;
        const titleArr = response.data.parse.title.split(' ');
        titleArr.forEach(word => {
          if (blockList.blockList.includes(word.toLowerCase())) {
            this.noImages = true
          }
        });

        this.wikipediaResponse.html = response.data.parse.text["*"];
        this.wikipediaResponse.title = response.data.parse.title;
        this.showWikiPage = true;
        this.showWikiResults = false;
        this.wikiLoading = false;
        this.$nextTick(() => {
          this.$refs.wikiPage.scrollTop = 0;
        });
      });
    },

    /* Youtube */
    searchYoutube() {
      const url = 'https://www.googleapis.com/youtube/v3/search?part=snippet%2Cid&maxResults=25&order=relevance&q=' +
        encodeURI(this.youtubeSearchStr) +
        'test&safeSearch=moderate&type=video&videoEmbeddable=true&videoType=any&key=' +
        youtubeApi.key;
      if (!blockList.blockList.includes(this.youtubeSearchStr.toLowerCase())) {
        console.log('url=', url);
        axios.get(url).then(response => {
          this.youtubeObj = [];

          Object.keys(response.data.items).forEach(key => {
            const titleArr = response.data.items[key].snippet.title.split(' ');
            let clean = true;
            titleArr.forEach(word => {
              if (blockList.blockList.includes(word.toLowerCase())) {
                clean = false;
              }
            })
            if (clean) {
              this.youtubeObj.push(response.data.items[key]);
            }
          });
          console.log('this.youtubeObj', this.youtubeObj);
          this.showYoutubeResults = true;
          this.$nextTick(() => {
            this.$refs.youtubeResults.scrollTop = 0;
          });
        });
      } else {
        this.youtubeObj = [];
        console.log("naughty");
        this.showYoutubeResults = true;
        this.$nextTick(() => {
          this.$refs.youtubeResults.scrollTop = 0;
        });
      }
    },

    viewYoutube(videoId) {
      this.youtubeVideo = videoId;
      if (this.player) {
        this.player.pause();
      };
    },

    closeYoutube() {
      this.youtubeVideo = null;
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
        console.log("Plan handler showPlan");
        if (this.showPlan && this.player) {
          this.player.play();
        } else if (this.player) {
          this.player.pause();
        }
      }
    }
  }
};
</script>

<style lang="stylus">
.youtube-close {
  position: absolute;
  bottom: 5px;
  right: 5px;
  z-index: 999;
}
.result-card{
  cursor: pointer;
  margin-bottom: 10px;
}
.wiki-tab, .youtube-tab {
  padding: 10px;
}
.wiki-wrapper {
  position: relative;
}
  .wiki-loading-box {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255, .8);
  }

.wiki-content, .youtube-content {
  &.no-images {
    img, .image {
      display: none;
    }
  }
  h1 {
    font-size: 25px;
    margin: 5px 0 10px 0;
    font-weight: bold;
  }

  h2 {
    font-size: 20px;
    margin: 5px 0 10px 0;
    font-weight: bold;
  }

  h3 {
    font-size: 18px;
    margin: 5px 0 10px 0;
  }

  #toc {
    display: none;
  }

  .mw-editsection {
    display: none;
  }

  .metadata {
    display: none;
  }

  .sistersitebox {
    display: none;
  }
}
</style>