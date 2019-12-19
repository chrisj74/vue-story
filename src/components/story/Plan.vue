<template>
  <div class="plan" v-show="showPlan" ref="planContainer">
    <!-- PLAN -->
    <div class="plan-video" ref="planVideo" v-if="(story.plan[story.playback.currentVideoIndex].videoObj && story.plan[story.playback.currentVideoIndex].videoObj.id) || youtubeVideo">
      <div
        class="plan-video"
        ref="planPreviewVideo"
      >
        <div v-if="showCompleted" class="completed row justify-center items-center">
          <!-- AUTO PLAY -->
          <div class="column items-center" v-if="story.plan[story.playback.currentVideoIndex]['autoNext']">
            <span>Next Video starting</span>
            <span class="count-down">{{ completeCountDown }}</span>
            <q-btn color="white" text-color="black" @click="cancelCompletedTimer()">Cancel</q-btn>
          </div>
          <!-- CLICK TO PLAY -->
          <div class="column items-center" v-else>
            <q-btn color="white" text-color="black" @click="nextPlaylist()">Next</q-btn>
          </div>
        </div>
        <iframe
          style="width: 100%"
          :src="'https://www.youtube.com/embed/' + story.plan[story.playback.currentVideoIndex].videoObj.id + '?playsinline=1'"
          frameborder="0"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          v-if="story.plan[story.playback.currentVideoIndex].videoObj.service === 'youtube' && !youtubeVideo"
        ></iframe>
        <iframe
          :src="'https://player.vimeo.com/video/' + story.plan[story.playback.currentVideoIndex].videoObj.id + '?color=80a998&title=0&byline=0&portrait=0'"
          frameborder="0"
          allow="autoplay; fullscreen"
          allowfullscreen
          id="planPlayer"
          v-if="story.plan[story.playback.currentVideoIndex].videoObj.service === 'vimeo' && !youtubeVideo"
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
    <div :style="{height: textHeight, position: 'relative'}">
      <div v-if="showPlaylist" class="playlists">
        <div class="row justify-between">
          <h3>Playlist</h3>
          <q-btn icon="mdi-close" dense @click="togglePlaylist()"></q-btn>
        </div>
        <q-list>
          <!-- <q-list-header>General</q-list-header> -->
          <q-item tag="div" v-for="(playlist, index) of this.story.plan" :key="playlist.uuid">
            <q-item-side>
              <q-checkbox v-model="story.playback.videos[index].complete" color="primary" @input="(val) => {updatePlaylistCompleteness(index, val)}" />
            </q-item-side>
            <q-item-main>
              <q-item-tile link><span @click="changePlaylist(index)">{{ playlist.title }}</span></q-item-tile>
            </q-item-main>
          </q-item>
        </q-list>
      </div>
      <div class="q-modal-layout col column no-wrap plan-text" :style="{maxHeight: textHeight}">
        <div class="q-layout-header">
          <q-tabs v-model="tabsModel">
            <q-tab
              slot="title"
              name="tab-1"
              :default="story.plan && story.plan.length > 0"
              icon="mdi-file-document-box-outline"
              label="Playlist"
            />
            <q-tab
              slot="title"
              name="tab-2"
              :default="!story.plan || story.plan.length === 0"
              icon="mdi-wikipedia"
              label="Wikipedia"
            />
            <q-tab
              slot="title"
              name="tab-3"
              :default="!story.plan || story.plan.length === 0"
              icon="mdi-youtube"
              label="Video"
            />
            <q-tab
              slot="title"
              name="tab-4"
              :default="!story.plan || story.plan.length === 0"
              icon="mdi-earth"
              label="Web"
            />
          </q-tabs>
        </div>
        <div clss="tabs-content" style="overflow: auto;" ref="tabContent">
          <!-- NOTES -->
          <div v-if="tabsModel === 'tab-1'" class="ql-editor notes-tab">
            <div v-if="story.plan.length > 1">
              <q-progress :percentage="progress" color="secondary" />
            </div>
            <div v-if="story.plan.length > 1" class="row justify-between playlist-pagination">
              <div class="col-1">
                <q-btn icon="mdi-menu" dense @click="togglePlaylist()"></q-btn>
              </div>
              <div class="col-11 row justify-between ">
                <q-btn icon="mdi-chevron-left" dense :disable="story.playback.currentVideoIndex === 0" @click="prevPlaylist()">Previous</q-btn>
                <span>{{ (story.playback.currentVideoIndex + 1) + ' / ' + story.plan.length }}</span>
                <q-btn icon-right="mdi-chevron-right" dense :disable="story.playback.currentVideoIndex === story.plan.length - 1" @click="nextPlaylist()">Next</q-btn>
              </div>
            </div>
            <div class="playlist-wrapper">
              <div class="playlist-content">
                <div class="playlist-title"><h1>{{ story.plan[story.playback.currentVideoIndex].title }}</h1></div>
                <div @click="handleWikiClick" v-html="story.plan[story.playback.currentVideoIndex].text">
                </div>
              </div>
            </div>

          </div>
          <!-- WIKIPEDIA -->
          <div v-if="tabsModel === 'tab-2'" class="wiki-tab">
            <q-toolbar color="white">
              <div v-shortkey="['enter']" @shortkey="searchWiki()" class="tab-search">
                <q-search
                  :debounce="0"
                  no-icon
                  autofocus
                  inverted-light
                  color="secondary"
                  v-model="wikiSearchStr"
                  placeholder="Search wikipedia"
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
              <div v-if="showWikiResults" class="wiki-content">
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
              <div @click="handleWikiClick" class="wiki-content" :class="{'no-images' : noImages}" v-if="showWikiPage">
                <h1>{{ wikipediaResponse.title }}</h1>
                <div v-html="wikipediaResponse.html"></div>
                <div class="wiki-attribution">
                  <p>This article uses material from the Wikipedia article (https://simple.wikipedia.org/wiki/{{ wikipediaResponse.pageId }}),<br />which is released under the Creative Commons Attribution-Share-Alike License 3.0.</p>
                </div>
              </div>
            </div>
          </div>
          <!-- YOUTUBE -->
          <div v-if="tabsModel === 'tab-3'" class="youtube-tab">
            <q-toolbar color="white">
              <div v-shortkey="['enter']" @shortkey="searchYoutube()" class="tab-search">
                <q-search
                  :debounce="0"
                  no-icon
                  autofocus
                  inverted-light
                  color="secondary"
                  v-model="youtubeSearchStr"
                  placeholder="Search youtube"
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
              <div v-if="showYoutubeResults" class="youtube-content">
                <div v-if="youtubeObj && youtubeObj.length > 0">
                  <div class="row">
                    <div
                      v-for="(result, index) in youtubeObj"
                      :key="index"
                      @click="viewYoutube(result.id.videoId)"
                      class="result-card col-6"
                    >
                      <q-card>
                        <q-card-media>
                          <img :src="result.snippet.thumbnails.medium.url" />
                        </q-card-media>
                        <q-card-title>{{ result.snippet.title }}</q-card-title>
                      </q-card>
                    </div>
                  </div>
                  <div class="row justify-between tabs-pagination">
                    <q-btn icon="mdi-chevron-left" :disabled="!youtubePagination.prev" @click="searchYoutube('prev')">Previous</q-btn>

                    <q-btn icon="mdi-chevron-right" :disabled="!youtubePagination.next" @click="searchYoutube('next')">Next</q-btn>
                  </div>
                </div>
                <div v-if="youtubeObj && youtubeObj.length === 0">
                  <h2>Sorry... no results, check your spelling :)</h2>
                </div>
              </div>
            </div>
          </div>
          <!-- WEB -->
          <div v-if="tabsModel === 'tab-4'" class="web-tab">
            <q-toolbar color="white">
              <q-btn icon="mdi-chevron-left" color="primary" @click="webSearchBack()" :disable="!showWebPage"></q-btn>
              <div v-shortkey="['enter']" @shortkey="searchWeb()" class="tab-search">
                <q-search
                  :debounce="0"
                  no-icon
                  autofocus
                  inverted-light
                  color="primary"
                  v-model="webSearchStr"
                  placeholder="Search The Web"
                  :after="[
                    {
                      icon: 'mdi-magnify',
                      error: false,
                      handler () {
                        searchWeb()
                      }
                    }
                  ]"
                />
              </div>
            </q-toolbar>
            <!-- Search content -->
            <div class="web-wrapper">
              <!-- Web results -->
              <div v-if="showWebResults" class="web-content">
                <div v-if="webObj && webObj.length > 0">
                  <div
                    v-for="(result, index) in webObj"
                    :key="index"
                    @click="viewWeb(result.url)"
                    class="result-card"
                  >
                    <q-card>
                      <q-card-main>
                        <h3 v-html="result.name"></h3>
                        <p class="text-body-1" v-html="result.snippet"></p>
                        <p>{{ result.url }}</p>
                      </q-card-main>
                    </q-card>
                  </div>
                </div>
                <div v-else>
                  <h2>Sorry... no results, check your spelling :)</h2>
                </div>
              </div>
              <!-- Web page -->
              <div @click="handleWebClick" class="web-content" :class="{'no-images' : noImages}" v-if="showWebPage">
                <h1 v-if="webSearchResponse.title">{{ webSearchResponse.title }}</h1>
                <div v-html="webSearchResponse.html" v-if="webSearchResponse.html"></div>
                <div class="web-attribution" v-if="webSearchResponse.html && webSearchResponse.html.length > 50">
                  <p>This article uses material from ({{ webSearchResponse.pageUrl}}).</p>
                </div>
                <div class="web-attribution" v-else>
                  <p>The page we had problems loading was {{ webSearchResponse.pageUrl}}.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-show="(wikiLoading && tabsModel === 'tab-2') || webLoading && tabsModel === 'tab-4'" class="wiki-loading-box">
          <q-spinner-bars color="primary" :size="50" />
        </div>
      </div>
    </div>
    <div class="edit-plan-btn" v-if="!story.sourceId && tabsModel === 'tab-1'">
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
      v-if="pageDimensions && wikiImage"
      v-model="settings.showPlanModal"
      :content-css="{minWidth: '350px', height: '90vh', maxWidth: '100%', width: pageDimensions.width+'px'}"
    >
      <add-image v-if="settings.showPlanModal && wikiImage" :initialImage="wikiImage"></add-image>
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
import uuid from 'uuidv4';
import * as firebase from "firebase";

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
      tabsModel: null,
      wikipediaResponse: {
        html: '',
        title: '',
        pageId: ''
      },
      wikiObj: null,
      wikiSearchStr: '',
      showWikiResults: false,
      showWikiPage: false,
      wikiImage: null,
      wikiLoading: false,

      webSearchResponse: {
        html: '',
        title: '',
        pageUrl:  ''
      },
      webObj: null,
      webSearchStr: '',
      showWebResults: false,
      showWebPage: false,
      webImage: null,
      webLoading: false,

      noImages: false,
      youtubeSearchStr: '',
      youtubeObj: null,
      youtubeVideo: null,
      showYoutubeResults: false,
      youtubePagination: {
        next: null,
        prev: null
      },
      showPlaylist: false,
      showCompleted: false,
      completeCountDown: 6,
      completeCountDownTimer: null
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
    activePage() {
      return this.$store.getters.getPage;
    },
    pageDimensions() {
      return this.$store.getters.getPageDimensions;
    },
    settings() {
      return this.$store.getters.getSettings;
    },
    progress() {
      if (this.story.plan && this.story.plan.length > 0 && this.story.plan[this.story.playback.currentVideoIndex]) {
        const currentVideo = this.story.playback.videos.find(vid => {
          return vid.playlistId === this.story.plan[this.story.playback.currentVideoIndex].uuid;
        });

        return (currentVideo.playbackPosition / currentVideo.duration) * 100;
      } else {
        return 0;
      }
    }
  },
  mounted() {
    if (
      this.story.plan &&
      this.story.plan.length > 0 &&
      this.story.plan[this.story.playback.currentVideoIndex].videoObj &&
      this.story.plan[this.story.playback.currentVideoIndex].videoObj.service
    ) {
      this.videoSet = true;

      /* Ensure playback is in sync with the plan */
      const videos = [];
      if (!this.story.playback.videos || this.story.playback.videos.length !== this.story.plan.length) {
        this.story.plan.forEach((playlist, index) => {
          const vid = {
            index: index,
            playlistId: playlist.uuid,
            playbackPosition: 0,
            complete: false,
            duration: null
          };
          videos.push(vid);
        });

        const payload = {
          user: this.user,
          storyKey: this.$route.params.id,
          story: {
            playback: {
              currentVideoIndex: this.story.playback.currentVideoIndex,
              videos: videos
            }
          }
        };
        this.$store.dispatch("updateStory", _.cloneDeep(payload)).then(() => {
            this.initVideo();
          });
      } else {
        this.initVideo();
      }

    }

    this.getTextHeight();
  },
  methods: {
    initVideo() {
      if (this.story.plan[this.story.playback.currentVideoIndex].videoObj.service === "vimeo") {
        var iframe = document.querySelector("#planPlayer");
        this.player = new Player("planPlayer");
        const _this = this;
        if (this.playbackTimeout) {
          clearTimeout(this.playbackTimeout);
        }
        this.player.on("play", function() {
          _this.getPlaybackPosition();
        });

        this.player.on("pause", function() {
          clearTimeout(_this.playbackTimeout);
        });

        this.player.on("ended", this.endPlayer);

        this.player.getDuration().then(function(duration) {
          _this.playbackDuration = duration;
        });

        this.setPlaybackPosition();
        if (this.showPlan) {
          this.player.play();
        }
      }
      this.showCompleted = false;
      this.completeCountDown = 6;
      this.completeCountDownTimer = null;
    },

    closeModal(type) {
      const newSetting = {};
      newSetting[type] = false;
      this.$store.commit("setSettings", newSetting);
    },

    togglePlaylist() {
      this.showPlaylist = !this.showPlaylist;
    },

    updatePlaylistCompleteness(index, complete) {
      let videos;
      if (this.story.playback.videos.length > 0) {
        /* Update correct video */
        videos = _.cloneDeep(this.story.playback.videos);
        videos.forEach((vid, index) => {
          if (vid.playlistId === this.story.plan[this.story.playback.currentVideoIndex].uuid) {
            videos[index].complete = complete;
          }
        });
      }

      const payload = {
        user: this.user,
        storyKey: this.$route.params.id,
        story: {
          playback: {
            currentVideoIndex: this.story.playback.currentVideoIndex,
            videos: videos
          }
        }
      };
      this.$store.dispatch("updateStory", _.cloneDeep(payload));
    },

    nextPlaylist() {
      if (this.story.playback.currentVideoIndex < (this.story.plan.length - 1)) {
        this.changePlaylist(this.story.playback.currentVideoIndex + 1);
      }
    },

    prevPlaylist() {
      if (this.story.playback.currentVideoIndex > 0) {
        this.changePlaylist(this.story.playback.currentVideoIndex - 1);
      }
    },

    changePlaylist(playlistIndex) {
      this.player.pause();
      const payload = {
        user: this.user,
        storyKey: this.$route.params.id,
        story: {
          playback: {...this.story.playback}
        }
      }
      payload.story.playback.currentVideoIndex = playlistIndex;
      this.$store.dispatch("updateStory", payload).then(() =>{
          this.initVideo();
        });

      if (this.story.plan[playlistIndex].pages
        && this.story.plan[playlistIndex].pages.length > 0
        && !this.story.plan[playlistIndex].pages.includes(this.activePage.id)
      ) {
        this.$router.push({path: '/project/' + this.$route.params.id + '/' + this.story.plan[playlistIndex].pages[0]});
      }
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
          (this.$refs.planVideo.clientHeight) +
          "px";
      } else if (this.$refs.planContainer) {
        this.textHeight = this.$refs.planContainer.clientHeight + "px";
      } else {
        this.textHeight = "auto";
      }
    },

    endPlayer(playerData) {
      if (this.story.playback.currentVideoIndex < (this.story.plan.length - 1)) {
        this.showCompleted = true;
      }

      if (this.story.playback.currentVideoIndex < (this.story.plan.length - 1)
        && !this.completeCountDownTimer
        && this.story.plan[story.playback.currentVideoIndex].hasOwnProperty('autoNext')
        && this.story.plan[story.playback.currentVideoIndex].autoNext) {
        /* Check there is another video to play */
        this.completeCountDown = 6;
        this.showCompleted = true;
        this.completedTimer();
        this.getPlaybackPosition();
      }
      updatePlaylistCompleteness(this.story.playback.currentVideoIndex, true);
    },

    completedTimer() {
      if (this.completeCountDown === 0) {
        this.nextPlaylist();
      } else {
        this.completeCountDown--;
        const _this = this;
        this.completeCountDownTimer = setTimeout(() => {
          _this.completedTimer();
        }, 1000);
      }
    },

    cancelCompletedTimer() {
      if (this.completeCountDownTimer) {
        clearTimeout(this.completeCountDownTimer);
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
        const complete = seconds > _this.playbackDuration - 1;
        let videos;
        if (_this.story.playback.videos.length > 0) {
          /* Update correct video */
          videos = _.cloneDeep(_this.story.playback.videos);
          if (videos.length === 1 && !videos[0].playlistId) {
            videos[0].playlistId = _this.story.plan[0].uuid;
          }
          videos.forEach((vid, index) => {
            if (vid.playlistId === _this.story.plan[_this.story.playback.currentVideoIndex].uuid) {
              videos[index] = {
                index: vid.index,
                playbackPosition: seconds,
                complete: !vid.complete ? complete : vid.complete,
                duration: _this.playbackDuration,
                playlistId: vid.playlistId,
              }
            }
          });
        }

        const payload = {
          user: _this.user,
          storyKey: _this.$route.params.id,
          story: {
            playback: {
              currentVideoIndex: _this.story.playback.currentVideoIndex,
              videos: videos
            }
          }
        };
        _this.$store.dispatch("updateStory", _.cloneDeep(payload));
        _this.playbackTimeout = setTimeout(() => {
          _this.getPlaybackPosition();
        }, 5000);
      });
    },

    /* WEB */
    handleWebClick(e) {
      e.preventDefault();
      if (e.target.matches("img")) {
        let imageStr = e.target.getAttribute("src");
        this.wikiImage = imageStr;
        this.$store.commit("setMode", "photo");
        const newSetting = {
          showPlanModal: true
        };
        this.$store.commit("setSettings", newSetting);
      }
      if (e.target.matches("a")) {
        if (e.target.getAttribute("href")) {
          const pageRef = e.target.getAttribute("href");
          this.viewWeb(pageRef);
        }
      }
    },

    webSearchBack() {
      this.showWebResults = true;
      this.showWebPage = false;
    },

    searchWeb() {
      if (!blockList.blockList.includes(this.webSearchStr.toLowerCase()) && this.webSearchStr.length > 0) {
        this.webLoading = true;

        const search = firebase.functions().httpsCallable('search');
        search({'q': encodeURI(this.webSearchStr)})
        .then(response => {
          this.webObj = [];
          if (response.data.webPages && response.data.webPages.value) {
            response.data.webPages.value.forEach(result => {
              /* strip HTML from title before splitting */
              const regex = /(&nbsp;|<([^>]+)>)/ig,
              title = result.name.replace(regex, '');
              const titleArr = title.split(' ');
              const bodyArr = result.snippet.split(' ');
              const contentArr = titleArr.concat(bodyArr)
              let clean = true;
              contentArr.forEach(word => {
                if (blockList.blockList.includes(word.toLowerCase())) {
                  clean = false;
                }
              });
              if (clean) {
                this.webObj.push(result);
              } else {
                console.log('Naughty response');
              }
            });
          }

          this.showWebPage = false;
          this.showWebResults = true;
          this.webLoading = false;
        })
        .catch(err => {
          console.error(err);
          this.webObj = [];
          this.showWebPage = false;
          this.showWebResults = true;
          this.webLoading = false;
        });
      } else {
        this.webObj = [];
        console.log("Naughty search");
        this.showWebPage = false;
        this.showWebResults = true;
        this.$nextTick(() => {
          this.$refs.tabContent.scrollTop = 0;
        });
      }
    },

    viewWeb(pageUrl) {
      this.tabsModel = 'tab-4';
      this.webLoading = true;
      const webViewer = firebase.functions().httpsCallable('webViewer');
      webViewer({'url': pageUrl}).then((result) => {
        // Read result of the Cloud Function.
        this.noImages = false;
        this.webSearchResponse = {
            html: '',
            title: 'Sorry, there was a problem fetching this page',
            pageUrl:  pageUrl,
          };
        if (result.data) {
          const titleArr = result.data.title.split(' ');
          titleArr.forEach(word => {
            if (blockList.blockList.includes(word.toLowerCase())) {
              this.noImages = true
            }
          });

          this.webSearchResponse = {
            html: result.data.content,
            title: result.data.title,
            pageUrl:  result.data.url,
          };
        }

        this.showWebPage = true;
        this.showWebResults = false;
        this.webLoading = false;
        this.$nextTick(() => {
          this.$refs.tabContent.scrollTop = 0;
        });
      })
      .catch(error => {
        console.error(error)

        this.webSearchResponse = {
          html: '',
          title: 'Sorry, there was a problem fetching this page',
          pageUrl:  pageUrl,
        };

        this.showWebPage = true;
        this.showWebResults = false;
        this.webLoading = false;
        this.$nextTick(() => {
          this.$refs.tabContent.scrollTop = 0;
        });
      });
    },

    /* WIKI */
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
            showPlanModal: true
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
          if (this.tabsModel !== 'tab-2') {
            this.tabsModel = 'tab-2';
          }
        } else if (e.target.getAttribute("href").startsWith("#")) {
          this.$refs.tabContent.scrollTo(e.target.getAttribute("href"));
        } else if (e.target.getAttribute("href")) {
          console.log("external link");
          this.viewWeb(e.target.getAttribute("href"))
        }
      }
    },

    searchWiki() {
      const url =
        "https://simple.wikipedia.org/w/api.php?action=query&generator=search&gsrnamespace=0&exsentences=1&exintro&explaintext&exlimit=max&prop=extracts&gsrlimit=10&gsrsearch=" +
        encodeURI(this.wikiSearchStr) +
        "&format=json&origin=*";
      if (!blockList.blockList.includes(this.wikiSearchStr.toLowerCase()) && this.wikiSearchStr.length > 0) {
        this.wikiLoading = true;
        axios.get(url).then(response => {
          this.wikiObj = [];
          if (response.data.query) {
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
          }

          this.showWikiPage = false;
          this.showWikiResults = true;
          this.wikiLoading = false;
          this.$nextTick(() => {
            this.$refs.tabContent.scrollTop = 0;
          });
        });
      } else {
        this.wikiObj = [];
        console.log("naughty");
        this.showWikiPage = false;
        this.showWikiResults = true;
        this.$nextTick(() => {
          this.$refs.tabContent.scrollTop = 0;
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

        this.wikipediaResponse = {
          html: response.data.parse.text["*"],
          title: response.data.parse.title,
          pageId:  response.data.parse.title.replace(' ', '_'),
        };

        this.showWikiPage = true;
        this.showWikiResults = false;
        this.wikiLoading = false;
        this.$nextTick(() => {
          this.$refs.tabContent.scrollTop = 0;
        });
      })
      .catch(error => {
        this.wikiLoading = false;
      });
    },

    /* YOUTUBE */
    searchYoutube(dir) {
      let dirStr = '';
      if (dir) {
        if (dir === 'next') {
          dirStr = '&pageToken=' + this.youtubePagination.next;
        } else {
          dirStr = '&pageToken=' + this.youtubePagination.prev;
        }
      }
      const url = 'https://www.googleapis.com/youtube/v3/search?part=snippet%2Cid&maxResults=10&order=relevance&q=' +
        encodeURI(this.youtubeSearchStr) +
        '&safeSearch=strict&type=video&videoEmbeddable=true&videoType=any&key=' +
        youtubeApi.key + dirStr;
      if (!blockList.blockList.includes(this.youtubeSearchStr.toLowerCase())) {
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
          this.youtubePagination.next = response.data.nextPageToken ? response.data.nextPageToken : null;
          this.youtubePagination.prev = response.data.prevPageToken ? response.data.prevPageToken : null;
          this.showYoutubeResults = true;
          this.$nextTick(() => {
            this.$refs.tabContent.scrollTop = 0;
          });
        });
      } else {
        this.youtubeObj = [];
        console.log("naughty");
        this.showYoutubeResults = true;
        this.$nextTick(() => {
          this.$refs.tabContent.scrollTop = 0;
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
      },
      deep: true
    },
    showPlan: {
      handler() {
        this.$nextTick(() => {
          this.getTextHeight();
        });

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
.completed {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  background: rgba(0, 0, 0, 0.85);
  color: #fff;
  z-index: 2001;
  height: 100%;
  overflow: auto;
  padding: 10px;
  .count-down {
    font-size: 5em;
  }
}
.tabs-content {
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  will-change: scroll-position;
}
.tab-search {
  width: 100%;
  padding-left: 10px;
}
.tabs-pagination {
  margin-bottom: 10px;
  padding: 10px;
}
.playlist-pagination {
  margin-top: 5px;
}
.playlist-wrapper {
  .playlist-title {
    h3 {
      margin-top: 10px;
      margin-bottom: 10px;
      font-size: 25px;
    }
  }
  .playlist-content {

  }
}
.playlists {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  background: rgba(0, 0, 0, 0.85);
  color: #fff;
  z-index: 2001;
  height: 100%;
  overflow: auto;
  padding: 10px;
  h3 {
    margin-top: 10px;
    margin-bottom: 10px;
    font-size: 25px;
  }
}
.youtube-close {
  position: absolute;
  bottom: -17px;
  left: 50%;
  z-index: 2001;
  margin-left: -50px;
}
.result-card{
  cursor: pointer;
  margin-bottom: 10px;
  align-self: stretch;
  padding-right: 5px;
}
.notes-tab, .wiki-tab, .youtube-tab, .web-tab {
  padding: 10px;
  position: relative;
  z-index: 1;
}
.wiki-wrapper, .web-wrapper {
  position: relative;
}
.wiki-attribution, .web-attribution {
  padding: 10px;
  margin-bottom: 10px;
  background: #ccc;
  font-size: .8em;
}
.wiki-loading-box {
  position: absolute;
  top: 70px;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255, .8);
}

.wiki-content, .youtube-content, .web-content, .playlist-content {
  font-family: Gerogia, Cambria, "Times New Roman", Times, serif;
  line-height: 1.5
  font-size: 21px;
  letter-spacing: .2px;
  padding: 10px;
  font-weight: 400;
  &.no-images {
    img, .image {
      display: none;
    }
  }
  h1 {
    font-size: 40px;
    margin: 5px 0 10px 0;
    font-weight: bold;
  }

  h2 {
    font-size: 32px;
    margin: 5px 0 10px 0;
    font-weight: bold;
  }

  h3 {
    font-size: 26px;
    line-height: 1.2em;
    margin: 5px 0 10px 0;
    font-weight: bold;
  }

  img {
    max-width: 100%;
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
  #Other_websites, .external {
    display: none;
  }
  #References, .reflist {
    display: none;
  }
}
</style>