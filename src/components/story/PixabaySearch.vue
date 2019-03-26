<template>
  <div>
    <div class="search-header">
      <div class="flex row q-pa-md" v-shortkey="['enter']" @shortkey="searchImages()">
        <q-input v-model="searchString" clearable class="col-8"  />
        <q-btn color="primary" icon="image_search" @click="searchImages()" class="col-1" />
        <div class="col-3">
          <image-uploader :debug="1" :maxWidth="512" :quality="0.7" :autoRotate=true outputFormat="verbose" :preview=false capture="environment" accept="video/*,image/*" doNotResize="['gif', 'svg']" @input="setImage" ref="imageUploader">
            <label for="fileInput" slot="upload-label">
              <figure>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                >
                  <path
                    class="path1"
                    d="M9.5 19c0 3.59 2.91 6.5 6.5 6.5s6.5-2.91 6.5-6.5-2.91-6.5-6.5-6.5-6.5 2.91-6.5 6.5zM30 8h-7c-0.5-2-1-4-3-4h-8c-2 0-2.5 2-3 4h-7c-1.1 0-2 0.9-2 2v18c0 1.1 0.9 2 2 2h28c1.1 0 2-0.9 2-2v-18c0-1.1-0.9-2-2-2zM16 27.875c-4.902 0-8.875-3.973-8.875-8.875s3.973-8.875 8.875-8.875c4.902 0 8.875 3.973 8.875 8.875s-3.973 8.875-8.875 8.875zM30 14h-4v-2h4v2z"
                  ></path>
                </svg>
              </figure>
              <!-- <span class="upload-caption">{{
                hasImage ? "Replace" : "Click to upload"
              }}</span> -->
            </label>
          </image-uploader>
        </div>
      </div>
    </div>

    <div class="search-body">
      <div v-if="results" class="results-grid">
        <div v-for="image of results.data.hits" :key="image.id" class="results-thumb">
          <img :src="image.previewURL" @click="selectImage(image)" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as b64toBlob from 'b64-to-blob';
export default {
  name: 'AddImage',
  data() {
    return {
      searchString: null,
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
  },
  methods: {
    searchImages() {
      this.$store.dispatch('searchImages', this.searchString);
    },
    selectImage(imageObj) {
      this.$store.dispatch('setInsertImage', imageObj);
    },
    getImageDimensions(file) {
      return new Promise (function (resolved, rejected) {
        console.log('promise');
        var i = new Image()
        i.onload = function(){
          console.log('image loaded');
          resolved({w: i.width, h: i.height})
        };
        i.src = file
      })
    },
    setImage(newImage) {
      const _user = this.user;
      const blob = b64toBlob(newImage.dataUrl.split(',')[1], newImage.type);
      this.getImageDimensions(newImage.dataUrl).then((dimensions) => {
        const imgObj = {
          user: _user,
          image: {
            dataUrl: blob,
            dimensions: dimensions,
            fileType: newImage.type,
            name: newImage.name,
          }
        }
        this.$store.dispatch('addImage', imgObj);
      });
    },
  },
}
</script>
<style>
.search-header {
  position: absolute;
  top: 0;
  left: 0;
  background: #fff;
  border-bottom: solid 1px #999;
  width: 100%;
  z-index: 2
}
.search-body {
  position: relative;
  margin-top: 80px;
  z-index: 1;
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

</style>