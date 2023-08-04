<div align="center">
  <img src="https://github.com/MatijaNovosel/avatar-editor/assets/36193643/c3e3daad-d27e-418e-bc8f-cfec9be0f625" />
</div>

<h1 align=center>Avatar editor</h1>
<p align=center>An avatar editor component for Vue 3.</p>

## 🚀 Installation

Install using your package manager of choice:

```bash
yarn add avatar-editor
```

## ⚙️ Usage

Import the component locally or define it globally and include the css file:

```vue
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
import { AvatarEditor } from "avatar-editor";
import "avatar-editor/dist/style.css";

const scaleVal = ref<number>(1);
const scaleStep = 0.02;
const scaleMin = 1;
const scaleMax = 3;

const avatarEditorRef = ref<any>(null);

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
```

The scale of the zoom is controlled from the outside through the `scale` prop.
To save the image call the exposed `getImageScaled` function.

## 📃 Props

| Name            | Type       | Default        | Description                                                                            |
| --------------- | ---------- | -------------- | -------------------------------------------------------------------------------------- |
| `v-model:scale` | `number`   | 1              | Standard two way input of the scale property which controls how zoomed in the image is |
| `width`         | `number`   | 200            | Width of the avatar editor                                                             |
| `height`        | `number`   | 200            | Height of the avatar editor                                                            |
| `border`        | `number`   | 25             | Border width of the outer selection area                                               |
| `borderRadius`  | `number`   | 0              | Border radius of the inner selection area, set to high values for a full circle        |
| `color`         | `number[]` | [0, 0, 0, 0.5] | RGBA value of the outer selection area                                                 |

## 🎺 Events

| Name          | Type                      | Description                                                                                                           |
| ------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `image-ready` | `(scale: number) => void` | An event that fires off after the selected picture is done loading, used for setting the ideal scale of the component |

## 🎯 Exposed functions

| Name             | Type                      | Description                                                                                                                                                                                         |
| ---------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getImageScaled` | `() => HTMLCanvasElement` | Fetches the current image inside of the inner selection area as a HTMLCanvasElement. It is advised to convert it to a familiar format further using the `toDataUrl` canvas function such as base64. |
