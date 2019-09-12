<template>
  <div class="search-container">
    <div class="search-header">
      <div class="flex row q-pa-sm" v-shortkey="['enter']" @shortkey="searchImages()">
        <q-input v-model="searchString" float-label="Search for images" class="col-8"  />
        <q-btn color="primary" icon="mdi-image-search" @click="searchImages()" class="col-1" />
        <div class="col-2">
          <image-uploader :debug="1" :maxHeight="2000" :maxWidth="2000" :quality="0.9" :autoRotate=true outputFormat="verbose" :preview=false :accept="'video/*,image/*'" doNotResize="['gif', 'svg', 'png']" @input="setImage" ref="imageUploader">
            <label for="fileInput" slot="upload-label" class="upload-btn">
              <q-icon color="primary" name="mdi-cloud-upload" label="Upload" />
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
        <q-btn class="load-more" @click="loadMore()" v-if="results && results.length > 0">Load More</q-btn>
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
        this.$store.commit('setLoading', true);
        this.$store.dispatch('addImage', imgObj);
        this.searchString = '';
      });
    },
  },
}
</script>
<style>
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
}

</style>