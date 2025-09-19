<script setup lang="ts">
import type { Props } from './types'
import Viewer from 'viewerjs'
import 'viewerjs/dist/viewer.min.css'

defineProps<Props>()

const images = ref<HTMLUListElement>()
let viewer: Viewer
onMounted(() => {
  viewer = new Viewer(images.value!, {
    toolbar: {
      zoomIn: 4,
      zoomOut: 4,
      oneToOne: 4,
      reset: 4,
      prev: 4,
      play: {
        show: 4,
        size: 'large',
      },
      next: 4,
      rotateLeft: 4,
      rotateRight: 4,
      flipHorizontal: 4,
      flipVertical: 4,
    },
    title: [4, (image: any, imageData: any) => `${image.alt} (${imageData.naturalWidth} × ${imageData.naturalHeight})`],
    fullscreen: true,
  })
})
onUnmounted(() => {
  viewer.destroy()
})
</script>

<template>
  <ul ref="images" class="overflow-hidden rounded-md cursor-pointer">
    <li v-for="img in imageList" :key="img.src">
      <img :src="img.src" :alt="img.alt">
    </li>
  </ul>
</template>

<style scoped>
</style>
