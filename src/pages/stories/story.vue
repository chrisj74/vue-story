<template>
    <div>
        <q-page class="story-page row justify-center" v-if="activePage">
            <!-- Thumbs -->
            <div class="thumbs" :class="{'active': settings.showThumbs}">
                <div class="action-buttons">
                    <q-btn size="sm" :round="true" @click="toggleEdit()" :icon="isEdit? 'mdi-check-outline' : 'mdi-pencil'"></q-btn>
                    <q-btn size="sm" :round="true" @click="getPageImages(true, true)" icon="mdi-cloud-download"></q-btn>
                </div>

                <!-- List thumbs -->
                <div id="thumb-wrapper" >
                    <draggable class="thumb-draggable" v-model="pages" :disabled="!isEdit">
                        <div
                            class="thumb" v-for="(page, index) of pages" :key="page.id"
                            :id="'thumb'+page.id"
                            :style="{
                                backgroundColor: thumbBgColor(page.page),
                                backgroundImage: thumbBgImage(page.page),
                                width: (page.pageSize.width * 0.1) + 'px',
                                height: (page.pageSize.height * 0.1) + 'px'
                            }"
                            :class="{'active-thumb': activePage && page.id === activePage.id}">
                            <router-link :to="'/story/'+$route.params.id+'/'+page.id">
                                <img :src="getThumbDrawing(page.page)" style="max-width: 100%" class="thumb-drawing" />
                                <img :src="getThumbPhoto(page.page)" style="max-width: 100%" class="thumb-photo" />
                                <div class="thumb-text"
                                    :style="{
                                        width: page.pageSize.width + 'px',
                                        height: page.pageSize.height + 'px',
                                    }">
                                    <div v-for="(pageText, tIndex) of page.page.textLayer" :key="page.id+'text'+tIndex"
                                        :style="{
                                            top: pageText.y + 'px',
                                            left: pageText.x + 'px',
                                            width: pageText.width +'px',
                                            height: pageText.height + 'px',
                                            borderWidth: pageText.borderWidth + 'px',
                                            borderColor: pageText.borderColor,
                                            background: getTextBoxBg(pageText)
                                        }"
                                        class="thumb-text-block text-render" v-html="pageText.text">
                                    </div>
                                </div>
                            </router-link>
                            <div class="thumb-actions" v-if="isEdit" :style="{
                                height: (page.pageSize.height * 0.1) + 'px'
                            }">
                                <div @click="showEditActions(page.id)" class="thumb-actions-toggle"><q-icon name="mdi-dots-vertical" /></div>
                                <div class="active-thumb-actions" v-if="activeEditActions === page.id">
                                    <div class="download-page" @click="downloadPage(index)"><q-icon name="mdi-cloud-download" /></div>
                                    <div class="delete-page" @click="deletePage(page.id, pages[index-1].id)"><q-icon v-if="index !== 0" color="negative" name="mdi-delete" /></div>
                                </div>
                            </div>
                        </div>
                    </draggable>
                </div>
                <!-- Add page -->
                <div class="add-page">
                    <q-btn color="primary" icon="mdi-plus-circle" :size="$q.screen.lt.sm ? 'md' : 'lg'" round @click="addPage()" />
                </div>

                <!-- Handle -->
                <div class="handle" @click="toggleThumbs()">
                    <i class="mdi" :class="{'mdi-chevron-double-right': !settings.showThumbs, 'mdi-chevron-double-left': settings.showThumbs}"></i>
                </div>

                <!-- Preview -->
                <div class="preview-generator" ref="previewGenerator" v-if="pages && pages.length > 0 && photoImagesGenerated">
                    <div
                        :style="{
                            backgroundColor: thumbBgColor(pages[previewIndex].page),
                            backgroundImage: thumbBgImage(pages[previewIndex].page),
                            width: (pages[previewIndex].pageSize.width) + 'px',
                            height: (pages[previewIndex].pageSize.height) + 'px'
                        }">
                        <img :src="getThumbDrawing(pages[previewIndex].page)" style="max-width: 100%" class="preview-drawing" />
                        <img :src="pageImages[pages[previewIndex].page.id]" style="max-width: 100%" class="preview-photo" />
                        <div class="preview-text ql-editor"
                            :style="{
                                width: pages[previewIndex].pageSize.width + 'px',
                                height: pages[previewIndex].pageSize.height + 'px',
                                top: '40px'
                            }">
                            <div v-for="(pageText, tIndex) of pages[previewIndex].page.textLayer" :key="pages[previewIndex].page.id+'PreviewText'+tIndex"
                                :style="{
                                    top: pageText.y + 'px',
                                    left: pageText.x + 'px',
                                    width: pageText.width +'px',
                                    height: pageText.height + 'px',
                                    borderWidth: pageText.borderWidth + 'px',
                                    borderColor: pageText.borderColor,
                                    borderStyle: 'solid',
                                    background: getTextBoxBg(pageText)
                                }"
                                class="preview-text-block text-render" v-html="pageText.text">
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Download image link -->
                <div class="image-download-link" v-if="previewImages.length === 1">
                    <a :href="previewImages[0]" ref="imageDownloadLink" download="page">Download</a>
                    <img :src="previewImages[0]" style="max-width: 100%" />
                </div>

                <!-- Photo image generator -->
                <div class="photo-generator" v-if="pages && pages.length > 0">
                    <canvas
                        id="photoCanvas"
                        ref="photoCanvas"
                        key="photoCanvas"
                        v-if="pageDimensions"
                        :style="{
                        width: (pages[previewIndex].pageSize.width * pageDimensions.pixelRatio) + 'px',
                        height: (pages[previewIndex].pageSize.height * pageDimensions.pixelRatio) + 'px',
                        top: 0,
                        left: 0,
                        }">
                    </canvas>
                </div>
            </div>

            <!-- Canvas -->
            <transition appear>
                <router-view />
            </transition>


        </q-page>
        <!-- IMAGE MODAL -->
        <q-modal
        v-if="pageDimensions"
        v-model="settings.showAddPage"
        :content-css="{minWidth: '350px', height: '90vh', maxWidth: '100%', width: pageDimensions.width+'px'}">
        <add-page></add-page>
        </q-modal>
    </div>
</template>

<script>
import { fabric } from 'fabric';
import * as b64toBlob from 'b64-to-blob';
import * as _ from 'lodash';
import draggable from 'vuedraggable';
import TextEditor from "../../components/story/TextEditor";
import DrawingCanvas from '../../components/story/DrawingCanvas';
import AddPage from '../../components/story/AddPage';



import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.pdfMake.vfs;

export default {
    name: 'Story',
    components: {
        draggable,
        TextEditor,
        DrawingCanvas,
        AddPage
    },
    data() {
        return {
            thumbCanvas: null,
            previewIndex: 0,
            previewImages: [],
            scrollTop: -1,
            cursorSelection: null,
            isEdit: false,
            thumbImgSrc: '',
            previewSrc: '',
            downloadPdf: false,
            showAddPage: false,
            canvas: null,
            activeEditActions: null,
            photoImagesGenerated: false,
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
        pageDimensions() {
          return this.$store.getters.getPageDimensions;
        },
        settings() {
            return this.$store.getters.getSettings;
        },
        pageImages() {
            return this.$store.getters.getPageImages;
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
    destroyed() {
        console.log('story destroyed');
        this.$store.commit('resetPage');
    },
    methods: {
        /** EDIT */
        toggleEdit(){
            if (this.isEdit) {
                this.activeEditActions = null;
                this.isEdit = false;
            } else {
                this.isEdit = true
            }
        },

        showEditActions(pageId) {
            if (this.activeEditActions && this.activeEditActions === pageId) {
                this.activeEditActions = null;
            } else {
                this.activeEditActions = pageId;
            }
        },
        /** PHOTO */
        photoCanvasInit() {
            /** Photo canvas */
            this.canvas = new fabric.Canvas("photoCanvas");
            const _this = this;
            const canvas = this.canvas;

            this.canvas.targetFindTolerance = 4;
            this.canvas.preserveObjectStacking = true;
            canvas.renderAll.bind(canvas);
        },

        generatePhotoImages() {
            this.previewIndex = 0;
            this.generatePhotoImage()
        },

        generatePhotoImage() {
            const _this = this;
            this.canvas.setHeight(this.pages[this.previewIndex].pageSize.height * this.pageDimensions.pixelRatio);
            this.canvas.setWidth(this.pages[this.previewIndex].pageSize.width * this.pageDimensions.pixelRatio);
            this.canvas.setZoom(this.pageDimensions.pixelRatio);
            if (this.pages[this.previewIndex].page.photoLayer.photoCanvasJson) {
                this.canvas.loadFromJSON(this.pages[this.previewIndex].page.photoLayer.photoCanvasJson, function() {
                    const imagePayload = {
                        pageId: _this.pages[_this.previewIndex].page.id,
                        imageData: _this.canvas.toDataURL(),
                    }
                    _this.$store.commit('setPageImage', imagePayload);
                    if (_this.previewIndex < (_this.pages.length -1)) {
                        _this.previewIndex++;
                        _this.generatePhotoImage();
                    } else {
                        _this.photoImagesGenerated = true;
                    }
                });
            } else if (this.previewIndex < (this.pages.length -1)) {
                    this.previewIndex++;
                    this.generatePhotoImage();
            } else {
                this.photoImagesGenerated = true;
            }
        },
        /** DOWNLOAD */
        getPageImages(pdf, allPages) {
            this.$store.commit('setLoading', true);
            this.previewIndex = 0;
            this.previewImages = [];
            this.getPageImage(pdf, allPages);
        },

        getPageImage(pdf, allPages, pageIndex) {
            if (!allPages && pageIndex) {
                this.$store.commit('setLoading', true);
                this.previewIndex = pageIndex;
                this.previewImages = [];
            }

            const el = this.$refs.previewGenerator;
            const _this = this;
            const _allPages = allPages, _pdf = pdf, _pageIndex = pageIndex;
            const options = {
                type: 'dataURL',
                useCORS: true,
                logging: false
            }
            this.$nextTick()
                .then(function () {
                    _this.$html2canvas(el, options).then(th => {
                        let thumbImg = th;
                        _this.previewImages.push(th);
                        if (_this.previewIndex < (_this.pages.length -1) && _allPages) {
                            _this.previewIndex++;
                            _this.getPageImage(_pdf, _allPages);
                        } else if (_pdf) {
                            _this.createPdf();
                        } else if (!_allPages && _pageIndex) {
                            _this.$store.commit('setLoading', false);
                            _this.doDownload();
                        }
                    });
                });
        },

        createPdf() {
            // const iframe = document.getElementById('pdf');
            const docDefinition = {
                pageSize: 'A4',

                // by default we use portrait, you can change it to landscape if you wish
                pageOrientation: 'portrait',

                // [left, top, right, bottom] or [horizontal, vertical] or just a number for equal margins
                pageMargins: [ 40, 60, 40, 60 ],
            content: []};
            this.previewImages.forEach(image => {
                docDefinition.content.push({
                    image: image,
                    fit: [(595 - 80), (868 - 120)],
                })
            })
            const pdfDocGenerator = pdfMake.createPdf(docDefinition).download('canvas');
            this.downloadPdf = false;
            this.$store.commit('setLoading', false);
        },

        downloadPage(pageIndex) {
            this.previewIndex = pageIndex;
            this.getPageImage(false, false, pageIndex)
        },

        doDownload() {
            const _this = this;
            this.$nextTick()
                .then(function () {
                    // DOM updated
                    _this.$refs.imageDownloadLink.click();
                });
        },

        onEditorFocus(quill){
            this.cursorSelection = quill.getSelection();
        },

        getTextBoxBg(pageText) {
            let hexOpacity = (pageText.opacity * 255).toString(16);
            while (hexOpacity.length < 2) {
                hexOpacity = "0" + hexOpacity;
            }
            let bgColor = pageText.backgroundColor;

            /* manipulate color to include opacity */
            return bgColor.substring(0, 7) + hexOpacity;
        },

        thumbBgColor(page) {
            return page.background.color;
        },

        thumbBgImage(page) {
            if (page.background.image){
                return 'url('+page.background.image+')';
            } else {
                return null
            }
        },
        getThumbDrawing(page) {
            return page.drawingLayer['drawingCanvasImage'];
        },

        getThumbPhoto(page) {
            return this.$store.getters.getPageImageById(page.id);
        },

        toggleThumbs() {
            const payload = {
                showThumbs: !this.settings.showThumbs,
            };
            this.$store.commit('setSettings', payload);
        },

        addPage() {
            const payload = {
                showAddPage: true,
            };
            this.$store.commit('setSettings', payload);
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
                if (newPage
                    && oldPage
                    && (newPage.canvasJson || newPage.textLayer.text)
                    && (newPage.canvasJson != oldPage.canvasJson
                        || newPage.id !== oldPage.id
                        || newPage.textLayer.text !== oldPage.textLayer.text
                        || newPage.background !== oldPage.background)
                    && (newPage.id === this.$route.params.pageId || !this.$route.params.pageId)) {

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
                    this.scrollTop = -1;
                }
                if (!from.params.id || (from.params.id !== to.params.id)) {
                    // changed story
                    if (!this.canvas) {
                        this.photoCanvasInit();
                    }
                }
            },
            deep: true
        },
        pages: {
            handler: function(oldPages, newPages){
                if(Object.keys(this.pageImages).length === 0) {
                    if (!this.canvas) {
                        this.photoCanvasInit();
                    }
                    this.generatePhotoImages();
                }
            },
            deep: true
        }
    },
}
</script>

<style lang="stylus">
@import '~variables'

.story-page {
    padding: 10px 0 10px 10px;
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
.action-buttons {
    display: flex;
    justify-content: space-around;
    flex-direction: row;
}
.add-page {
    text-align: center;
}
.thumbs {
    margin-top: 35px;
    width: 100px;
    align-self: flex-start;
    .handle {
        display: none;
    }
}
#thumb-wrapper {
    margin-top: 5px;
    padding-top: 3px;
    max-height: calc(100vh - 190px);
    overflow: auto;
    .thumb-draggable {
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: center;
    }
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
    background-position: center center;
    position: relative;
    outline: solid 3px #aeaeae;
    -webkit-transition: outline-color 1s; /* Safari */
    transition: outline-color 1s;
    position: relative;
    a {
        color: #000;
    }
    .thumb-drawing {
        position: absolute;
        z-index: 3;
    }
    .thumb-photo {
        position: absolute;
        z-index: 2;
    }
    .thumb-text {
        position: absolute;
        z-index: 4;
        transform: scale(0.1);
        transform-origin: top left;
        overflow: hidden;
        top: calc(40px * 0.1);
        .thumb-text-block {
            position: absolute;
            border-style: solid;
        }
    }
}
.thumb-actions {
    position: absolute;
    top: -3px;
    right: -3px;
    z-index: 5;
    background: rgba(255,255,255,0.95);
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    padding: 0 5px;
    .thumb-actions-toggle {
        cursor: pointer;
        font-size: 20px;
    }
    .active-thumb-actions{
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        .delete-page, .download-page {
            cursor: pointer;
            font-size: 26px;
        }
    }
}

.thumb.active-thumb {
    outline: solid 3px $primary;
}
.thumb a {
    width: 100%;
}
.photo-generator {
    position: absolute;
    top: 5000px;
    left: -5000px;
    z-index: 1000;
}

.image-download-link {
    display: none;
}
.preview-generator {
    position: absolute;
    top: 0;
    left: -5000px;
    z-index: 999;
    border: solid 1px #999;
    background-size: cover;
    background-repeat: no-repeat;
    background-color: #fff;
    background-position: center center;
    .preview-drawing {
        position: absolute;
        z-index: 3;
    }
    .preview-photo {
        position: absolute;
        z-index: 2;
    }
    .preview-text {
        position: absolute;
        z-index: 4;
        transform-origin: top left;
        overflow: hidden;
        .preview-text-block {
            position: absolute;
        }
    }
}
@media(orientation: portrait) {
    .thumbs {
        position: fixed;
        left: -79px;
        transition: all .5s ease-in-out;
        z-index: 2002;
        &.active {
            left: 0;
            background: #fff;
            .handle {
                right: -20px;
            }
        }
        #thumb-wrapper .thumb-draggable {
            align-items: flex-end;
        }
        .handle {
            display: flex;
            position: absolute;
            bottom: 0;
            right: -10px;
            width: 35px;
            height: 35px;
            border-radius: 0 5px 5px 0;
            border: none;
            justify-content: center;
            align-items: center;
            font-size: 1.5em;
            background-color: #fff;
        }
    }
}
@media(orientation: portrait) {
    .side-bar {
        height: calc(100vh - (50px + 100px));
    }
    /* .thumbs {
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
    } */
}
</style>