<template>
    <div>
        <q-page class="story-page row justify-center">
            <!-- Thumbs -->
            <div class="thumbs">
                <!-- List thumbs -->
                <div id="thumb-wrapper" v-if="isActiveRoute()">
                    <draggable v-model="pages">
                        <div class="thumb" v-for="(page, index) of pages" :key="page.id" :id="'thumb'+page.id" :style="{backgroundColor: thumbBgColor(page)}" :class="{'active-thumb': activePage && page.id === activePage.id}">
                            <router-link :to="'/story/'+$route.params.id+'/'+page.id">
                                <img :src="getThumb(page)" style="max-width: 100%" />
                            </router-link>
                            <div class="delete-page" @click="deletePage(page.id, pages[index-1].id)"><q-icon v-if="index !== 0" size="sm" color="negative" name="mdi-delete" /></div>
                        </div>
                    </draggable>
                </div>
                <!-- Add page -->
                <div class="add-page">
                    <q-btn color="primary" icon="mdi-plus-circle" :size="$q.screen.lt.sm ? 'md' : 'lg'" round @click="addPage()" />
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
            <transition appear>
                <div class="side-bar" v-if="showPlan">
                    <p>Plan</p>
                    <ckeditor :editor="editor" v-model="editorContent" :config="editorConfig" class="editor"></ckeditor>
                </div>
            </transition>
        </q-page>
    </div>
</template>

<script>
import { fabric } from 'fabric';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import * as b64toBlob from 'b64-to-blob';
import * as _ from 'lodash';
import draggable from 'vuedraggable';

export default {
    name: 'Story',
    components: {
        draggable,
    },
    data() {
        return {
            thumbCanvas: null,
            editor: ClassicEditor,
            activeThumb: {},
            editorConfig: {
                // The configuration of the editor.
            },
            imageKey: 0,
            showPlan: false,
            scrollTop: -1,
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
        editorContent: {
            get() {
                return this.$store.getters.getStoryPlan;
            },
            set: _.debounce(function(content) {
                if (this.user) {
                    const payload = {
                        user: this.user,
                        storyKey : this.$route.params.id,
                        plan: content
                    };
                    this.$store.dispatch('updateStory', payload);
                }
            }, 500)
        },
        pages: {
            get() {
                return this.$store.getters.getPages;
            },
            set(value) {
                console.log('set value=', value);
                const payload = {
                    user: this.user,
                    storyKey: this.$route.params.id,
                    pageKey: this.$route.params.pageId ? this.$route.params.pageId : null,
                    pages: value
                }
                this.scrollTop = -1;
                this.$store.dispatch('updatePageOrder', payload);
            }

        },
        activePage() {
            return this.$store.getters.getPage;
        },

    },
    mounted() {
        console.log('story mounted');
        this.imageKey = Math.random();
        /* if(this.activePage && this.activePage.pageJson) {
            this.canvasInit();
        } */
        /** Set story from route */
        if ((!this.story || !this.story.hasOwnProperty('id') || this.story.id !== this.$route.params.id) && this.user) {
            const payload = {
                user : this.user,
                storyKey : this.$route.params.id
            };
            this.$store.dispatch('setStory', payload);
            this.storiesSet = true;
        }
        /** Set page from route */
        if(this.user) {
            const payload = {
                user: this.user,
                storyKey: this.$route.params.id,
                pageKey: this.$route.params.pageId ? this.$route.params.pageId : null
            }
            this.$store.dispatch('setPage', payload);
        }
        /** Set pages from route */
        if(this.user) {
            const payload = {
                user: this.user,
                storyKey: this.$route.params.id,
            }
            this.$store.dispatch('setPages', payload);
        }
        /** Media queries */
        if (this.$q.screen.lt.md) {
            this.showPlan = false
        } else {
            this.showPlan = true;
        }
    },
    methods: {
        isActiveRoute() {
            if ((this.activePage && this.$route.params.pageId === this.activePage.id)
                || !this.$route.params.pageId) {
                    return true;
            } else {
                return false;
            }
        },
        getThumb(page) {
            const isActive = this.activePage && this.activePage.id === page.id ? true : false;
            if (isActive) {
                return this.activeThumb;
            } else {
                return page.thumb + '&rnd=' + this.imageKey;
            }
            return isActive;
        },
        thumbBgColor(page) {
            if (this.activePage && page.id === this.activePage.id) {
                return this.activePage.background.color;
            } else {
                return page.background.color;
            }
        },
        canvasInit() {
            /** Thumbnail canvas */
            this.thumbCanvas = new fabric.Canvas('thumbCanvas');
            this.thumbCanvas.setHeight(595);
            this.thumbCanvas.setWidth(842);
            if (this.activePage && this.activePage.pageJson) {
                this.generateThumb()
            }
        },

        addPage() {
            const payload = {
                user: this.user,
                storyKey: this.$route.params.id,
                pageKey: this.$route.params.pageId ? this.$route.params.pageId : null,
                order: this.pages.length,
            }
            const storyKey = this.$route.params.id;
            this.$store.dispatch('addPage', payload)
            .then(newPage => {
                this.$router.push({ path: '/story/'+storyKey+'/'+newPage })
            }) ;
        },

        deletePage(pageId, prevId) {
            /** Don't navigate after delete if not on page being deleted */
            let moveTo = null;
            if (this.activePage.id === pageId) {
                moveTo = prevId
            }
            this.$q.dialog({title: 'Confirm',
                message: 'Delete page. There is no undo!',
                ok: 'OK',
                cancel: 'Cancel'})
            .then(() => {
                // Picked "OK"
                const payload = {
                    user: this.user,
                    storyKey: this.$route.params.id,
                    pageKey: pageId
                };
                this.$store.dispatch('deletePage', payload)
                    .then(res => {
                        if (moveTo)
                        this.$router.push({ path: moveTo });
                    });
            })
            .catch(() => {
                // Picked "Cancel" or dismissed
            })


        },

        setZoom(factor) {
            /** change zoom to load or export */
            this.thumbCanvas.setHeight(595 * factor);
            this.thumbCanvas.setWidth(842 * factor)
            this.thumbCanvas.setZoom(factor);
            this.thumbCanvas.renderAll();
        },

        generateThumb() {
            this.setZoom(1);
            this.activeThumb = this.activePage.thumb + '&rnd=' + this.imageKey;
            const _this = this;
            this.thumbCanvas.clear();
            this.thumbCanvas.loadFromJSON(
                this.activePage.pageJson,
                function() {
                    _this.thumbCanvas.renderAll.bind(_this.thumbCanvas);
                    let thumbImg = _this.thumbCanvas.toDataURL('png');
                    /** Apply background and reload image */
                    _this.thumbCanvas.clear();
                    /** set bg color */
                    if (_this.activePage.background.color) {
                        _this.thumbCanvas.setBackgroundColor(_this.activePage.background.color), _this.thumbCanvas.renderAll.bind(_this.thumbCanvas);
                    }
                    /** set bg image */
                    if (_this.activePage.background.image && _this.activePage.background.image !== 'none') {
                        fabric.Image.fromURL(_this.activePage.background.image, function(img) {

                            _this.thumbCanvas.setBackgroundImage(img, _this.thumbCanvas.renderAll.bind(_this.thumbCanvas), {
                                scaleX: _this.thumbCanvas.width / img.width,
                                scaleY: _this.thumbCanvas.height / img.height
                            });
                            /* myImg.set({ left: 0, top: 0 });
                            _this.thumbCanvas.add(myImg); */
                            _this.addThumbBack(thumbImg)
                        },  { crossOrigin: 'Anonymous' });
                    }else {
                        _this.addThumbBack(thumbImg)
                    }
                });
        },

        addThumbBack(thumbImg) {
            const _this = this;
            /** add canvas image back */
            fabric.Image.fromURL(thumbImg, function(myImg) {
                myImg.set({ left: 0, top: 0 });
                _this.thumbCanvas.add(myImg);
                _this.thumbCanvas.renderAll.bind(_this.thumbCanvas);
                _this.setZoom(0.5);
                /** export final image */
                const thumbImg = _this.thumbCanvas.toDataURL('png');
                /** convert to blob */
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
                     this.activeThumb = imgUrl;
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
                console.log('newPage Joson');
                if (!this.thumbCanvas) {
                    this.canvasInit();
                    this.generateThumb();
                }
                if (newPage
                    && oldPage
                    && newPage.pageJson
                    && (newPage.pageJson != oldPage.pageJson || newPage.id !== oldPage.id)
                    && (newPage.id === this.$route.params.pageId || !this.$route.params.pageId)) {
                    this.generateThumb();

                    /** Scroll active thumb into view */
                    const _this = this;
                    console.log('scrollTop=', this.scrollTop);

                    this.$nextTick()
                        .then(function () {
                            // DOM updated
                            const thumbWrapper = document.getElementById('thumb-wrapper');
                            console.log('then', _this.scrollTop );
                            if (_this.scrollTop === -1) {
                                _this.$scrollTo('#thumb'+_this.activePage.id, 0, {
                                    container: '#thumb-wrapper',
                                    force: false,
                                    duration: 10,
                                    onStart: function(element) {
                                    // scrolling started
                                    console.log('start scroll');
                                    },
                                    onDone: function(element) {
                                        _this.scrollTop = thumbWrapper.scrollTop;
                                        console.log('onDone', _this.scrollTop );
                                    }
                                });
                            } else {
                                thumbWrapper.scrollTop = _this.scrollTop;
                            }
                        })
                }
            },
            deep: true
        },
        $route: {
            handler: function(from, to){
                if(from.params.id === to.params.id && from.params.pageId != to.params.pageId) {
                    /** key to force refresh of thumbs and keep them fresh after page navigation */
                    this.imageKey = Math.random();
                    this.scrollTop = -1;
                }
            },
            deep: true
        },
        pages: {
            handler: function(newPages, oldPages) {

            }
        }
    },
}
</script>

<style lang="stylus">
@import '~variables'

.story-page {
    padding: 10px;
    background: #ddd;
    flex-wrap: nowrap;
    overflow: hidden;
}

.side-bar {
    min-width: 20%;
    max-width: 50%;
}
.add-page {
    text-align: center;
}
.thumbs {
    margin: 5px;
    padding: 5px;
    border: solid 1px #999;
    width: 96px;
    align-self: flex-start;
}
#thumb-wrapper {
    max-height: calc(100vh - 130px);
    overflow: auto;
}
.thumb {
    height: 61px;
    width: 84px;
    display: flex;
    justify-content: center;
    align-items: stretch;
    border: 1px solid #999;
    margin-bottom: 5px;
    background-size: cover;
    background-repeat: no-repeat;
    background-color: #fff;
    position: relative;
    border: solid 3px #fff;
    -webkit-transition: border-color 1s; /* Safari */
    transition: border-color 1s;
}
.delete-page {
    opacity: 0.5;
    cursor: pointer;
    transform-origin: top right;
    position: absolute;
    top: 2px;
    right: 2px;
}
.thumb:hover .delete-page {
    opacity: 1;
}
.delete-page:hover {
    -ms-transform: scale(1.5, 1.5); /* IE 9 */
    -webkit-transform: scale(1.5, 1.5); /* Safari */
    transform: scale(1.5, 1.5);

}
.thumb.active-thumb {
    border: solid 3px $primary;
}
.thumb a {
    width: 100%;
}
.thumb-generator {
    position: absolute;
    top: 0;
    left: -5000px;
    z-index: 999;
    border: solid 1px #999;
    background: #fff;
}
@media(orientation: portrait) {
    .story-page {
        flex-direction: column
    }
    .thumbs {
        display: flex;
        flex-wrap: nowrap;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
        order: 2;
        width: 100%;
    }
    #thumb-wrapper {
        max-height: 45px;
        overflow: auto;
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
        .thumb {
            width: 60px;
            height: 45px;
            flex-basis: 60px;
        }
    }
}

@media(max-width: $breakpoint-md) and (orientation: landscape) {
  .thumbs {
    margin-top: 50px;
  }
}
</style>