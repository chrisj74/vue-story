<template>
    <div>
        <q-page class="story-page row justify-center">
            <!-- Thumbs -->
            <div class="thumbs">
                <div class="actiion-buttons">
                    <q-btn size="sm" :round="true" @click="isEdit = !isEdit" :icon="isEdit? 'mdi-check-outline' : 'mdi-pencil'"></q-btn>
                    <q-btn size="sm" :round="true" @click="getPageImages()" icon="mdi-cloud-download"></q-btn>
                </div>

                <!-- List thumbs -->
                <div id="thumb-wrapper" v-if="isActiveRoute()">
                    <draggable v-model="pages" :disabled="!isEdit">
                        <div class="thumb" v-for="(page, index) of pages" :key="page.id" :id="'thumb'+page.id" :style="{backgroundColor: thumbBgColor(page)}" :class="{'active-thumb': activePage && page.id === activePage.id}">
                            <router-link :to="'/story/'+$route.params.id+'/'+page.id">
                                <img :src="getThumb(page)" style="max-width: 100%" />
                            </router-link>
                            <div v-if="isEdit" class="delete-page" @click="deletePage(page.id, pages[index-1].id)"><q-icon v-if="index !== 0" size="sm" color="negative" name="mdi-delete" /></div>
                        </div>
                    </draggable>
                </div>
                <!-- Add page -->
                <div class="add-page">
                    <q-btn color="primary" icon="mdi-plus-circle" :size="$q.screen.lt.sm ? 'md' : 'lg'" round @click="addPage()" />
                </div>
                <!-- Thumb canvas -->
                <div class="thumb-generator" ref="thumbGenerator">
                    <div v-if="activePage && activePage.pageSize" class="canvas-bg-img-wrapper" :style="{width: activePage.pageSize.width+'px', height: activePage.pageSize.height+'px'}">
                        <div v-if="activePage && activePage.background" class="canvas-bg-img" :style="{backgroundColor: activePage.background.color,
                        backgroundImage: activePage.background.image? 'url('+activePage.background.image+')' : 'none'}">

                        </div>
                    </div>

                    <canvas id="thumbCanvas"></canvas>
                    <img :src="thumbImgSrc" class="thumb-canvas-img" />

                    <div class="text-layer">
                        <!-- TEXT EDITOR -->
                        <text-editor :print="true" v-if="activePage && activePage.pageSize" :active="false" :zoom="1" :pageWidth="activePage.pageSize.width" :pageHeight="activePage.pageSize.height" ></text-editor>
                    </div>
                </div>
                <!-- <img :src="previewSrc" class=preview /> -->
                <!-- <div id="pdf" style="position: absolute; top: 0; background: red; z-index: 1000;">
                    <a :href="pdf" :download="'test'">download</a>
                </div> -->
            </div>

            <!-- Canvas -->
            <transition appear>
                <router-view />
            </transition>


        </q-page>
    </div>
</template>

<script>
import { fabric } from 'fabric';
import * as b64toBlob from 'b64-to-blob';
import * as _ from 'lodash';
import draggable from 'vuedraggable';
import TextEditor from "../../components/story/TextEditor";


import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.pdfMake.vfs;

export default {
    name: 'Story',
    components: {
        draggable,
        TextEditor
    },
    data() {
        return {
            thumbCanvas: null,
            editorConfig: {
                modules: {
                    blotFormatter: {},
                    toolbar: [
                        ['bold', 'italic', 'underline'],        // toggled buttons
                        ['blockquote'],

                        // [{ 'header': 1 }, { 'header': 2 }],               // custom button values
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        // [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
                        // [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
                        // [{ 'direction': 'rtl' }],                         // text direction

                        [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
                        // [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

                        [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
                        [{ 'font': [] }],
                        [{ 'align': [] }],
                        ['link', 'video']

                        // ['clean']                                         // remove formatting button
                    ]
                }
            },
            imageKey: 0,
            scrollTop: -1,
            cursorSelection: null,
            isEdit: false,
            thumbImgSrc: '',
            previewSrc: '',
            downloadPdf: false,
            // pdf: '',
        }
    },
    computed: {
        editor() {
            return this.$refs.guideEditor.quill
        },
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
        pdfImages() {
            return this.$store.getters.getPdfImages;
        },
        editorContent: {
            get() {
                return this.$store.getters.getStoryPlan;
                this.editor.setSelection(this.cursorSelection);
            },
            set: _.debounce(function(content) {
                this.cursorSelection = this.editor.getSelection();
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
        screen() {
            return this.$store.getters.screen;
        }
    },
    mounted() {
        this.imageKey = Math.random();
        /* if(this.activePage && this.activePage.canvasJson) {
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

    },
    methods: {
        getPageImages() {
            // console.log('getPageImages');
            const payload = {
                user: this.user,
                storyKey: this.$route.params.id,
            }
            this.$store.dispatch('genPdfImages', payload);
            this.$store.commit('setLoading', true);
            this.downloadPdf = true;
        },

        createPdf() {
            // const iframe = document.getElementById('pdf');
            console.log('createPdf');
            const docDefinition = {
                pageSize: 'A4',

                // by default we use portrait, you can change it to landscape if you wish
                pageOrientation: 'portrait',

                // [left, top, right, bottom] or [horizontal, vertical] or just a number for equal margins
                pageMargins: [ 40, 60, 40, 60 ],
            content: []};
            this.pdfImages.forEach(image => {
                docDefinition.content.push({
                    image: 'data:image/png;base64, ' + image,
                    fit: [(595 - 80), (868 - 120)],
                })
            })
            const pdfDocGenerator = pdfMake.createPdf(docDefinition).download('canvas');
            this.downloadPdf = false;
            this.$store.commit('setLoading', false);
        },

        onEditorFocus(quill){
            this.cursorSelection = quill.getSelection();
        },
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
                return this.previewSrc;
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
            if (this.activePage && this.activePage.canvasJson) {
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
            this.thumbCanvas.setHeight(842 * factor);
            this.thumbCanvas.setWidth(595 * factor)
            this.thumbCanvas.setZoom(factor);
            this.thumbCanvas.renderAll();
        },

        generateThumb() {
            this.setZoom(1);
            const _this = this;
            this.thumbCanvas.clear();
            this.thumbCanvas.loadFromJSON(
                this.activePage.canvasJson,
                function() {
                    _this.thumbCanvas.renderAll.bind(_this.thumbCanvas);
                    _this.thumbImgSrc = _this.thumbCanvas.toDataURL('png');
                    const el = _this.$refs.thumbGenerator;
                    // add option type to get the image version
                    // if not provided the promise will return
                    // the canvas.
                    const options = {
                        type: 'dataURL',
                        useCORS: true,
                        logging: false
                    }
                    _this.$html2canvas(el, options).then(th => {
                        let thumbImg = th;
                        _this.previewSrc = th;
                        _this.addThumbBack(thumbImg);
                    });
                });
        },

        addThumbBack(thumbImg) {
            /** export preview image */
            const previewBlob = b64toBlob(thumbImg.split(',')[1], 'image/png');
            this.setPreview(previewBlob);
            const _this = this;
            /** add canvas image back */
            fabric.Image.fromURL(thumbImg, function(myImg) {
                myImg.set({ left: 0, top: 0 });
                _this.thumbCanvas.add(myImg);
                _this.thumbCanvas.renderAll.bind(_this.thumbCanvas);
                /** export final image */
                _this.setZoom(0.5);
                const thumbImg = _this.thumbCanvas.toDataURL('png');
                /** convert to blob */
                const thumbBlob = b64toBlob(thumbImg.split(',')[1], 'image/png');
                _this.setThumb(thumbBlob);
            });
        },

        setPreview(previewImg) {
            const payload = {
                user: this.user,
                storyKey: this.$route.params.id,
                pageKey: this.activePage.id,
                image: {
                    type: 'image/png',
                    dataUrl: previewImg,
                },
            };
            this.$store.dispatch('setPreview', payload);
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
            const _this = this;
            this.$store.dispatch('setThumb', payload)
                .then(imgUrl => {
                    /** If this is page 1, set image as story cover */
                    if (this.activePage.order === 0) {
                        const payload = {
                            user: this.user,
                            storyKey : this.$route.params.id,
                            thumbUrl: imgUrl
                        };
                        this.$store.dispatch('updateStory', payload);
                    }
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
                    this.canvasInit();
                }
                if (newPage
                    && oldPage
                    && (newPage.canvasJson || newPage.textLayer.text)
                    && (newPage.canvasJson != oldPage.canvasJson
                        || newPage.id !== oldPage.id
                        || newPage.textLayer.text !== oldPage.textLayer.text
                        || newPage.background !== oldPage.background)
                    && (newPage.id === this.$route.params.pageId || !this.$route.params.pageId)) {
                    this.generateThumb();

                    /** Scroll active thumb into view */
                    const _this = this;

                    this.$nextTick()
                        .then(function () {
                            // DOM updated
                            const thumbWrapper = document.getElementById('thumb-wrapper');
                            if (_this.scrollTop === -1) {
                                _this.$scrollTo('#thumb'+_this.activePage.id, 0, {
                                    container: '#thumb-wrapper',
                                    force: false,
                                    duration: 10,
                                    onStart: function(element) {
                                    // scrolling started
                                    },
                                    onDone: function(element) {
                                        _this.scrollTop = thumbWrapper.scrollTop;
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
        pdfImages: {
            handler: function(newImages, oldImages) {
                console.log('pdfImages Watcher');
                if (this.downloadPdf) {
                    this.createPdf();
                }
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
    justify-content: flex-start;
}

.side-bar {
    min-width: 20%;
    max-width: 50%;
    width: 400px;
    position: fixed;
    top: 50px;
    right: 0;
    height: calc(100vh - 50px);
    background: rgba(255,255,255,.8);
    z-index: 3;
}
.actiion-buttons {
    display: flex;
    justify-comtent: space-between;
    flex-direction: row;
}
.add-page {
    text-align: center;
    width: 61px;
}
.thumbs {
    margin-top: 35px;
    width: 81px;
    align-self: flex-start;
}
#thumb-wrapper {
    margin-top: 5px;
    max-height: calc(100vh - 160px);
    overflow: auto;
}
.thumb {
    height: 84px;
    width: 61px;
    display: flex;
    justify-content: center;
    align-items: stretch;
    margin-bottom: 5px;
    margin-right: 10px;
    background-size: cover;
    background-repeat: no-repeat;
    background-color: #fff;
    position: relative;
    border: solid 3px #aeaeae;
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
    .text-layer {
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        z-index: 6;
    }
    #thumbCanvas {
        display: none;
    }
    .thumb-canvas-img {
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        z-index: 5;
    }
    .canvas-bg-img-wrapper {
        position: absolute;
        overflow: hidden;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        z-index: 4;
        .canvas-bg-img {
            position: absolute;
            top: 0;
            bottom: 0;
            width: 100%;
            z-index: 1;
            background: #fff;
            background-repeat: no-repeat;
            background-size: cover;
            background-position: center center;
        }
    }
}
@media(orientation: portrait) {
    .actiion-buttons {
        flex-direction: column;
    }
    .story-page {
        flex-direction: column
    }
    .side-bar {
        height: calc(100vh - (50px + 100px));
    }
    .thumbs {
        display: flex;
        flex-wrap: nowrap;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
        order: 2;
        width: 100%;
        margin-top: 5px;
    }
    #thumb-wrapper {
        >div {
            max-height: 60px;
            overflow: auto;
            display: flex;
            flex-direction: row;
            justify-content: flex-end;
            .thumb {
                width: 700px;
                height: 50px;
                flex-basis: 70px;
                min-width: 70px;
                margin-right: 5px;
                .delete-page {
                    display: none;
                }
            }
        }
    }
}
</style>