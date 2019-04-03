<template>
    <div>
        <q-page class="story-page row justify-center">
            <!-- Thumbs -->
            <div class="thumbs">
                <!-- List thumbs -->
                <div class="thumb-wrapper">
                    <div class="thumb" v-for="page of pages" :key="page.id" :class="{'active-thumb': page.id === activePage.id}">
                        <router-link :to="'/story/'+$route.params.id+'/'+page.id">
                            <img :src="active(page.id)? activeThumb : page.thumb" style="max-width: 100%" />
                        </router-link>
                    </div>
                </div>
                <!-- Add page -->
                <div class="add-page">
                    <q-btn color="primary" icon="add_circle" size="xl" round @click="addPage()" />
                </div>
                <!-- Thumb canvas -->
                <div class="thumb-generator">
                    <canvas id="thumbCanvas"></canvas>
                </div>
            </div>

            <!-- Canvas -->
            <transition appear>
                <router-view />
            </transition>

            <!-- Plan -->
            <div class="side-bar">
                <p>Plan</p>
                <ckeditor :editor="editor" v-model="editorData" :config="editorConfig" class="editor"></ckeditor>
            </div>
        </q-page>
    </div>
</template>

<script>
import { fabric } from 'fabric';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import * as b64toBlob from 'b64-to-blob';

export default {
    name: 'Story',
    data() {
        return {
            thumbCanvas: null,
            editor: ClassicEditor,
            activeThumb: {},
            editorData: '<p>Content of the editor.</p>',
            editorConfig: {
                // The configuration of the editor.
            },
        }
    },
    computed: {
        user() {
            return this.$store.getters.user;
        },
        loading() {
            return this.$store.getters.loading;
        },
        story() {
            return this.$store.getters.getStory;
        },
        pages() {
            return this.$store.getters.getPages;
        },
        activePage() {
            return this.$store.getters.getPage;
        },

    },
    mounted() {
        /** Set story from route */
        if ((!this.story || !this.story.hasOwnProperty('id')) && this.user) {
            const payload = {
                user : this.user,
                storyKey : this.$route.params.id
            };
            this.$store.dispatch('setStory', payload);
            this.storiesSet = true;
        }
        /** Set page from route */
        if((!this.activePage || !this.activePage.hasOwnProperty('pageJson')) && this.user) {
            const payload = {
                user: this.user,
                storyKey: this.$route.params.id,
                pageKey: this.$route.params.pageId ? this.$route.params.pageId : null
            }
            this.$store.dispatch('setPage', payload);
        }
        /** Set page from route */
        if(this.user) {
            const payload = {
                user: this.user,
                storyKey: this.$route.params.id,
            }
            this.$store.dispatch('setPages', payload);
        }
    },
    methods: {
        active(thumbId) {
            return this.activePage.id === thumbId ? true : false;
        },
        canvasInit() {
            /** Thumbnail canvas */
            this.thumbCanvas = new fabric.Canvas('thumbCanvas');
            this.thumbCanvas.setHeight(595);
            this.thumbCanvas.setWidth(842);
            this.thumbCanvas.backgroundColor = '#ffffff';

        },

        addPage() {
            const payload = {
                user: this.user,
                storyKey: this.$route.params.id,
                pageKey: this.$route.params.pageId ? this.$route.params.pageId : null,
                order: this.pages.length,
            }
            this.$store.dispatch('addPage', payload)
            .then(newPage => {
                console.log(newPage);
                this.$router.push({ path: newPage })
            }) ;
        },

        setZoom() {
            this.thumbCanvas.setHeight(595 * 0.5);
            this.thumbCanvas.setWidth(842 * 0.5)
            this.thumbCanvas.setZoom(0.5);
            this.thumbCanvas.renderAll();
        },

        generateThumb() {
            const _this = this;
            this.thumbCanvas.loadFromJSON(
                this.activePage.pageJson,
                function() {
                    _this.thumbCanvas.renderAll.bind(_this.thumbCanvas);
                    _this.setZoom();
                    const thumbImg = _this.thumbCanvas.toDataURL('png');
                    const blob = b64toBlob(thumbImg.split(',')[1], 'image/png');
                    _this.setThumb(blob);
                });
        },
        setThumb(thumbImg) {
            const payload = {
                user: this.user,
                storyKey: this.$route.params.id,
                pageKey: this.activePage.id,
                image: {
                    type: 'image/png',
                    dataUrl: thumbImg,
                },
                order: this.activePage.order
            };
            this.$store.dispatch('setThumb', payload)
                .then(imgUrl => {
                    // console.log('resolved', imgUrl);
                    this.activeThumb = null;
                    this.activeThumb =this.activePage.thumb + '?key=' + new Date().getTime();
                });
        },

    },
    watch: {
        user: {
            handler: function(newUser) {
                if (!this.story) {
                    const payload = {
                        user : this.user,
                        storyKey : this.$route.params.id
                    };
                    this.$store.dispatch('setStory', payload);
                    this.storiesSet = true;
                }
            }
        },
        activePage: {
            handler: function(newPage, oldPage) {
                if (!this.thumbCanvas) {
                    console.log('thumb canvas init');
                    this.canvasInit();
                }
                if (newPage.pageJson
                    && newPage.pageJson != oldPage.pageJson
                    && newPage.id === this.$route.params.pageId) {
                        console.log('gen theumb');
                    this.generateThumb();
                }
            },
            deep: true
        },
    },
}
</script>

<style>
.story-page {
    padding: 10px;
    background: #ddd;
    flex-wrap: nowrap;
}

.side-bar {
  min-width: 20%;
}
.thumbs {
    margin: 5px;
    padding: 5px;
    border: solid 1px #999;
    width: 92px;
    align-self: flex-start;
}
.thumb-wrapper {
    max-height: calc(100vh - 130px);
    overflow: auto;
}
.thumb {
    height: 60px;
    width: 80px;
    display: flex;
    justify-content: center;
    align-items: stretch;
    border: 1px solid #999;
    margin-bottom: 5px;
    background-size: cover;
    background-repeat: no-repeat;
    background-color: #fff;
}
.thumb.active-thumb {
    border: solid 3px red;
}
.thumb a {
    width: 100%;
}
.thumb-generator {
    /* display: none; */
    position: absolute;
    top: 0;
    left: -5000px;
    z-index: 999;
    border: solid 1px #999;
    background: #fff;
}
</style>