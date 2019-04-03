<template>
  <div>
    <div class="search-header">
      <div class="flex row q-pa-md" v-shortkey="['enter']" @shortkey="searchImages()">
        <q-input v-model="searchString" float-label="Search for images" class="col-8"  />
        <q-btn color="primary" icon="image_search" @click="searchImages()" class="col-1" />
        <div class="col-3">
          <image-uploader :debug="1" :maxWidth="512" :quality="0.7" :autoRotate=true outputFormat="verbose" :preview=false capture="environment" accept="video/*,image/*" doNotResize="['gif', 'svg']" @input="setImage" ref="imageUploader">
            <label for="fileInput" slot="upload-label">
              <q-icon color="primary" icon="cloud_upload" label="Upload" />
              <!-- <figure>
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
              </figure> -->
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
        <div v-for="(image, index) of results.hits" :key="index" class="results-thumb">
          <img :src="image.previewURL" @click="selectImage(image)" />
        </div>

        <!-- Load More -->
        <q-btn @click="loadMore()">Load More</q-btn>
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
    searchSize () {
      return this.$store.state.searchSize;
    }
  },
  methods: {
    searchImages() {
      const payload = {
        str: this.searchString,
        page: 1
      };
      this.$store.dispatch('searchImages', payload);
    },
    loadMore(){
      console.log('this.results', this.results);
      const count = this.results.hits.length
      console.log('count', count);
      if (count < this.results.totalHits) {
        const newPage = Math.floor(count / this.searchSize) + 1;
        console.log('newPage=', newPage);
        const payload = {
          str: this.searchString,
          page: newPage
        };
        this.$store.dispatch('searchImages', payload);
      }
    },
    selectImage(imageObj) {
      const _this = this;
      this.getDataUri(imageObj.webformatURL, function(dataUri) {
        // Do whatever you'd like with the Data URI!
        const imgObj = {
          dataUrl: dataUri,
          name: 'myimage',
          type: 'image/png'
        }
        _this.setImage(imgObj);
      });
    },
    getDataUri(url, callback) {
      const image = new Image();
      image.crossOrigin = 'Anonymous';

      image.onload = function () {
          const canvas2 = document.createElement('canvas');
          canvas2.width = this.naturalWidth; // or 'width' if you want a special/scaled size
          canvas2.height = this.naturalHeight; // or 'height' if you want a special/scaled size

          canvas2.getContext('2d').drawImage(this, 0, 0);

          // Get raw image data
          //callback(canvas2.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, ''));

          // ... or get as Data URI
          callback(canvas2.toDataURL('image/png'));
      };

      image.src = url;
    },
    getImageDimensions(file) {
      return new Promise (function (resolved, rejected) {
        var i = new Image()
        i.onload = function(){
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
#fileInput {
  display: none;
}
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