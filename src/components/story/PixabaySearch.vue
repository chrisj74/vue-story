<template>
  <q-modal-layout v-if="settings.showImageModal || profileSettings.showAvatarModal">
    <!-- HEADER -->
    <q-toolbar slot="header" class="search-container">
        <div class="search-header">
          <div class="flex row items-center" v-shortkey="['enter']" @shortkey="searchImages()">
            <q-search autofocus dark color="secondary" v-model="searchString" placeholder="Search for images" class="col-10"
              :after="[
                {
                  icon: 'mdi-image-search',
                  error: false,
                  handler () {
                    searchImages()
                  }
                }
              ]"  />
            <div class="col-2">
              <q-btn dense flat @click="croppa.chooseFile()">
                <q-icon size="3rem" color="secondary" name="mdi-cloud-upload" label="Upload" />
              </q-btn>
            </div>
          </div>
        </div>
    </q-toolbar>

    <!-- CONTENT -->
    <div class="search-body">
      <div v-if="results && results.hits && !croppa.originalImage && !croppa.loading" class="results-grid">
        <div v-for="(image, index) of results.hits" :key="'search-'+index" class="results-thumb">
          <img :src="image.previewURL" @click="selectImage(image)" />
        </div>

        <!-- Load More -->
        <q-btn class="load-more" @click="loadMore()" v-if="(results.page * 50) < results.totalHits > 0">Load More</q-btn>
      </div>
      <div v-show="croppa && (croppa.originalImage || croppa.loading)">
        <div class="croppa-wrapper">
          <croppa
            :height="sizes[selectedIndex].h"
            :width="sizes[selectedIndex].w"
            :show-loading="false"
            :prevent-white-space="true"
            :initial-image="selectedImage"
            v-model="croppa"
            disable-click-to-choose
            placeholder="click button on the right :)"
            :placeholder-font-size="14"
            :quality="zoomFactor"
            @new-image="!aspectRatio? getSize(croppa.aspectRatio) : null"
            @new-initial-image="!aspectRatio? getSize(croppa.aspectRatio) : null"
            @new-image-drawn="onNewImage"
            @zoom="onZoom">
            <div class="croppa-spinner" v-if="croppa && croppa.loading"><q-spinner-bars color="primary" :size="50" /></div>
          </croppa>

        </div>
        <div v-if="sliderMin > 0 && sliderMax > 0" class="croppa-slider" :style="{width: sizes[selectedIndex].w + 'px'}">
            <q-slider :min="sliderMin" :max="sliderMax" :step="sliderStep" :value="sliderVal" @input="val => onSliderChange(val)"></q-slider>
        </div>
        <!-- image size -->
        <div class="page-size-wrapper image-size-wrapper" v-if="!aspectRatio">
          <div class="page-size" v-for="(size, index) of sizes" :key="'size'+index" @click="setSize(index)" :class="{selected: selectedIndex === index}">
            <div class="outline" :class="size.className"></div>
            {{ size.label}}
          </div>
        </div>
      </div>

      <div v-if="!results.hits && allImages && !croppa.originalImage && !croppa.loading">
        <h5>Previously uploaded</h5>
        <div class="results-grid">
          <div v-for="(image, index) of allImages" :key="'lib-'+index" class="results-thumb">
            <img :src="image.thumbnail" @click="selectExistingImage(image.path)" />
          </div>
        </div>
      </div>
    </div>

    <!-- FOOTER -->
    <q-toolbar slot="footer">
      <q-btn color="white" text-color="black" @click="close()">Cancel</q-btn>
      <q-toolbar-title></q-toolbar-title>
      <q-btn color="secondary" text-color="black" icon="mdi-plus-circle" @click="setImage()" :disabled="!croppa || (croppa && !croppa.originalImage)">Use Image</q-btn>
    </q-toolbar>
  </q-modal-layout>
</template>

<script>
import * as b64toBlob from 'b64-to-blob';
export default {
  name: 'AddImage',
  props: ['aspectRatio', 'maxWidth'],
  data() {
    return {
      searchString: null,
      croppa: {},
      selectedWidth: 200,
      selectedHeight: 200,
      selectAutoSizing: false,
      selectedIndex: 0,
      selectedImage: null,
      sizes: [
        {
          w: 300,
          h: 200,
          label: 'Landscape',
          className: 'landscape'
        },
        {
          w: 200,
          h: 300,
          label: 'Portrait',
          className: 'portrait'
        },
        {
          w: 200,
          h: 200,
          label: 'Square',
          className: 'square'
        },
      ],
      sliderVal: 0,
      sliderMin: 0,
      sliderMax: 0,
      sliderStep: 0
    }
  },
  computed: {
    results () {
      return this.$store.getters.getImageSearchResults;
    },
    user () {
      return this.$store.getters.user;
    },
    loading () {
      return this.$store.getters.loading;
    },
    searchSize () {
      return this.$store.state.searchSize;
    },
    allImages () {
      return this.$store.getters.getAllImages;
    },
    zoomFactor () {
      if (this.maxWidth) {
        return (this.maxWidth / this.sizes[this.selectedIndex].w);
      } else if (this.croppa.naturalWidth && this.croppa.naturalWidth < 2000) {
        return (this.croppa.naturalWidth / this.sizes[this.selectedIndex].w);
      } else {
        return 10;
      }
    },
    settings() {
      return this.$store.getters.getSettings;
    },
    profileSettings () {
      return this.$store.getters.getProfileSettings;
    }
  },
  mounted () {
    if (this.aspectRatio) {
      this.getSize(this.aspectRatio);
    }
  },
  methods: {
    onNewImage() {
      this.setSlider();
      /* if (!this.aspectRatio) {
        this.getSize(this.croppa.aspectRatio);
      } */
    },

    onSliderChange(val) {
      this.croppa.scaleRatio = +val;
    },

    onZoom() {
      // To prevent zooming out of range when using scrolling to zoom
      if (this.sliderMax && this.croppa.scaleRatio >= this.sliderMax) {
        this.croppa.scaleRatio = this.sliderMax
      } else if (this.sliderMin && this.croppa.scaleRatio <= this.sliderMin) {
        this.croppa.scaleRatio = this.sliderMin
      }

      this.sliderVal = this.croppa.scaleRatio;
    },

    setSlider() {
      this.sliderVal = this.croppa.scaleRatio;
      this.sliderMin = Math.round((this.croppa.scaleRatio / 2) * 1000) / 1000;
      this.sliderMax = Math.round((this.croppa.scaleRatio * 5) * 1000) / 1000;
      this.sliderStep = 0.001;
    },

    setSize(index) {
      this.selectedIndex = index;
      this.setSlider();
    },

    getSize(ratio) {
      this.sliderStep = 0;
      if (ratio === 1) {
        this.selectedIndex = 2;
      } else if (ratio < 1) {
        this.selectedIndex = 1;
      } else if (ratio > 1) {
        this.selectedIndex = 0;
      }
      this.setSlider();
    },

    close() {
      let payload = {
        showImageModal: false,
      };
      this.$store.commit("clearImageSearchResults");
      this.$store.commit("clearInsertImage");
      this.searchString = '';
      this.$store.commit('setSettings', payload);
      this.croppa.remove();
      this.selectedImage = null;
      payload = {
        avatarModal: false
      }
      this.$store.commit('setProfileSettings', payload);
    },

    searchImages() {
      const payload = {
        str: this.searchString,
        page: 1
      };
      this.$store.dispatch('searchImages', payload);
    },

    loadMore(){
      const count = this.results.hits.length
      if (count < this.results.totalHits) {
        const newPage = Math.floor(count / this.searchSize) + 1;
        const payload = {
          str: this.searchString,
          page: newPage
        };
        this.$store.dispatch('searchImages', payload);
      }
    },

    selectImage(imageObj) {
      const _this = this;
      this.selectedImage = imageObj.webformatURL;
      this.croppa.refresh();
    },

    selectExistingImage(url) {
      const _this = this;
      this.getImageDimensions(url).then(dimensions => {
        const imgObj = {
          webformatURL: url,
          webformatWidth: dimensions.w,
          webformatHeight: dimensions.h,
        };
        this.$store.commit('setInsertImage', imgObj);
      });

    },

    getImageDimensions(file) {
      return new Promise (function (resolved, rejected) {
        const i = new Image();
        i.onload = function(){
          resolved({w: i.width, h: i.height})
        };
        i.src = file;
      })
    },

    setImage() {
      this.$store.commit('setLoading', true);
      const _user = this.user;
      this.croppa.promisedBlob('image/jpeg', 0.8)
      .then((blob) => {
        const imgObj = {
          user: _user,
          image: {
            dataUrl: blob,
            dimensions: {
              w: this.croppa.outputWidth,
              h: this.croppa.outputHeight
            },
            fileType: 'image/jpeg',
            name: '',
          }
        }
        this.croppa.remove();
        this.selectedImage = null;
        this.$store.dispatch('addImage', imgObj);
        this.searchString = '';
      });
    },
  },
  watch: {
    aspectRatio: {
      handler: function(newRatio, oldRatio) {
        this.getSize(aspectRatio);
      },
      deep: true
    },
  }
}
</script>
<style lang="stylus">
@import '~variables';
.croppa-wrapper {
  display: flex;
  justify-content: center;
  margin: 10px 0;
}
.croppa-spinner {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.croppa-slider {
  margin-bottom: 10px;
  position: relative;
  margin: 0 auto;
}
.image-size-wrapper {
  max-width: 600px;
  margin: 0 auto;
}
#fileInput {
  display: none;
}
.upload-btn {
  cursor: pointer;
  font-size: 2em;
  display: inline-block;
  width: 100%;
  text-align: right;
}
.search-container {
  display: flex;
  flex-direction: column;
}
.search-header {
  width: 100%;
}
.search-body {
  position: relative;
  z-index: 1;
  overflow: hidden;
}
.results-grid {
  display: flex;
  justify-content: center;
  flex-direction: row;
  flex-wrap: wrap;
  margin: 10px;
}
.results-thumb {
  padding: 5px;
  max-width: 200px;
}
.results-thumb img {
  max-width: 100%;
  cursor: pointer;
}
.load-more {
  flex-basis: 100%;
  margin-bottom: 100px;
}

</style>