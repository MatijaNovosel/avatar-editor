<template>
  <div
    style="
      display: flex;
      flex-direction: column;
      align-items: center;
      grid-gap: 50px;
    "
  >
    <avatar-editor
      :width="400"
      :height="400"
      ref="avatarEditorRef"
      @image-ready="onImageReady"
      v-model:scale="scaleVal"
    />
    <input
      type="range"
      :min="scaleMin"
      :max="scaleMax"
      :step="scaleStep"
      v-model="scaleVal"
    />
    <button @click="save">Save</button>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from "vue";
import avatarEditor from "./components/avatarEditor.vue";
import { IAvatarEditor } from "./components/models";

const scaleVal = ref<number>(1);
const scaleStep = 0.02;
const scaleMin = 1;
const scaleMax = 3;

const avatarEditorRef = ref<IAvatarEditor | null>(null);

const onImageReady = (scale: number) => {
  scaleVal.value = scale;
};

const handleWheelEvent = (e: WheelEvent) => {
  if (e.deltaY > 0) {
    // Down
    if (scaleVal.value - scaleStep >= scaleMin) {
      scaleVal.value -= scaleStep;
    }
  } else {
    // Up
    if (scaleVal.value + scaleStep <= scaleMax) {
      scaleVal.value += scaleStep;
    }
  }
};

const save = () => {
  if (avatarEditorRef.value) {
    const canvasData = avatarEditorRef.value.getImageScaled();
    const img = canvasData.toDataURL("image/png");
    console.log(img);
  }
};

onMounted(() => {
  document.addEventListener("wheel", handleWheelEvent);
});

onUnmounted(() => {
  document.removeEventListener("wheel", handleWheelEvent);
});
</script>
