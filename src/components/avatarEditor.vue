<template>
  <canvas
    :width="canvasWidth"
    :height="canvasHeight"
    ref="canvas"
    @dragover.prevent
    @drop="onDrop"
    @mousedown="onDragStart"
    @mouseup="onDragEnd"
    @mousemove="onMouseMove"
    @click="clicked"
    :class="state.cursor"
  />
  <input type="file" ref="filePicker" @change="fileSelected" hidden />
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from "vue";

interface ImageStateImage {
  x: number;
  y: number;
  width: number;
  height: number;
  resource: HTMLImageElement | null;
}

interface ImageState {
  drag: boolean;
  my: number | null;
  mx: number | null;
  image: ImageStateImage;
}

interface State {
  cursor: string;
  scale: number;
  canvas: CanvasRenderingContext2D | null;
  context: CanvasRenderingContext2D | null;
  dragged: boolean;
  imageLoaded: boolean;
  changed: boolean;
  imageState: ImageState;
}

const drawRoundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  borderRadius: number
) => {
  if (borderRadius === 0) {
    context.rect(x, y, width, height);
  } else {
    const widthMinusRad = width - borderRadius;
    const heightMinusRad = height - borderRadius;
    context.translate(x, y);
    context.arc(
      borderRadius,
      borderRadius,
      borderRadius,
      Math.PI,
      Math.PI * 1.5
    );
    context.lineTo(widthMinusRad, 0);
    context.arc(
      widthMinusRad,
      borderRadius,
      borderRadius,
      Math.PI * 1.5,
      Math.PI * 2
    );
    context.lineTo(width, heightMinusRad);
    context.arc(
      widthMinusRad,
      heightMinusRad,
      borderRadius,
      Math.PI * 2,
      Math.PI * 0.5
    );
    context.lineTo(borderRadius, height);
    context.arc(
      borderRadius,
      heightMinusRad,
      borderRadius,
      Math.PI * 0.5,
      Math.PI
    );
    context.translate(-x, -y);
  }
};

const emit = defineEmits(["image-ready", "update:scale"]);

const props = withDefaults(
  defineProps<{
    image: string;
    border: number;
    borderRadius: number;
    width: number;
    height: number;
    color: number[];
    scale: number;
  }>(),
  {
    image: "",
    border: 25,
    borderRadius: 0,
    width: 200,
    height: 200,
    color: () => [0, 0, 0, 0.5]
  }
);

const canvas = ref<HTMLCanvasElement | null>(null);
const filePicker = ref<HTMLInputElement | null>(null);

const state: State = reactive({
  cursor: "cursor-pointer",
  scale: 1,
  canvas: null,
  context: null,
  dragged: false,
  imageLoaded: false,
  changed: false,
  imageState: {
    drag: false,
    my: null,
    mx: null,
    image: {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      resource: null
    }
  }
});

const canvasWidth = computed(() => {
  return getDimensions().canvas.width;
});

const canvasHeight = computed(() => {
  return getDimensions().canvas.height;
});

const paint = () => {
  if (state.context) {
    state.context.save();
    state.context.translate(0, 0);
    state.context.fillStyle = "rgba(" + props.color.slice(0, 4).join(",") + ")";
    let borderRadius = props.borderRadius;
    const dimensions = getDimensions();
    const borderSize = dimensions.border;
    const height = dimensions.canvas.height;
    const width = dimensions.canvas.width;
    // Clamp border radius between zero (perfect rectangle) and half the size without borders (perfect circle or "pill")
    borderRadius = Math.max(borderRadius, 0);
    borderRadius = Math.min(
      borderRadius,
      width / 2 - borderSize,
      height / 2 - borderSize
    );
    state.context.beginPath();
    // Inner rect, possibly rounded
    drawRoundedRect(
      state.context,
      borderSize,
      borderSize,
      width - borderSize * 2,
      height - borderSize * 2,
      borderRadius
    );
    state.context.rect(width, 0, -width, height); // outer rect, drawn "counterclockwise"
    state.context.fill("evenodd");
    state.context.restore();
  }
};

const svgToImage = (rawSVG: string) => {
  const svg = new Blob([rawSVG], { type: "image/svg+xml;charset=utf-8" }),
    domURL = URL || self.webkitURL,
    url = domURL.createObjectURL(svg),
    img = new Image();
  img.src = url;
  return img;
};

const getDimensions = () => {
  return {
    width: props.width,
    height: props.height,
    border: props.border,
    canvas: {
      width: props.width + props.border * 2,
      height: props.height + props.border * 2
    }
  };
};

const getInitialSize = (width: number, height: number): ImageStateImage => {
  let newHeight: number;
  let newWidth: number;
  const dimensions = getDimensions();
  const canvasRatio = dimensions.height / dimensions.width;
  const imageRatio = height / width;
  if (canvasRatio > imageRatio) {
    newHeight = getDimensions().height;
    newWidth = width * (newHeight / height);
  } else {
    newWidth = getDimensions().width;
    newHeight = height * (newWidth / width);
  }
  return {
    height: newHeight,
    width: newWidth,
    x: 0,
    y: 0,
    resource: null
  };
};

const handleImageReady = (image: HTMLImageElement) => {
  const imageState = getInitialSize(image.width, image.height);
  imageState.resource = image;
  const oldState = state.imageState;
  oldState.drag = false;
  oldState.image = imageState;
  state.imageState.image.x = 0;
  state.imageState.image.y = 0;
  state.imageState.image.resource = image;
  state.imageState.image.width = imageState.width;
  state.imageState.image.height = imageState.height;
  state.imageState.drag = false;
  state.scale = 1;
  emit("image-ready", state.scale);
  state.imageLoaded = true;
  state.cursor = "cursor-grab";
};

const loadImage = (imageURL: string | ArrayBuffer | null) => {
  if (typeof imageURL === "string") {
    const imageObj = new Image();
    imageObj.onload = function () {
      handleImageReady(imageObj);
    };
    if (!isDataURL(imageURL)) {
      imageObj.crossOrigin = "anonymous";
    }
    imageObj.src = imageURL;
  }
};

const onDrop = (e: DragEvent) => {
  e.stopPropagation();
  e.preventDefault();
  if (e.dataTransfer && e.dataTransfer.files.length) {
    const reader = new FileReader();
    const file = e.dataTransfer.files[0];
    state.changed = true;
    reader.onload = (e) => loadImage(e.target!.result);
    reader.readAsDataURL(file);
  }
};

const onDragStart = (e: MouseEvent) => {
  e.preventDefault();
  state.imageState.drag = true;
  state.imageState.mx = null;
  state.imageState.my = null;
  state.cursor = "cursor-grabbing";
};

const onDragEnd = (e: MouseEvent) => {
  if (state.imageState.drag) {
    state.imageState.drag = false;
    state.cursor = "cursor-pointer";
  }
};

const onMouseMove = (e: MouseEvent) => {
  if (state.imageState.drag === false) {
    return;
  }
  state.dragged = true;
  state.changed = true;
  const imageState = state.imageState.image;
  const lastX = imageState.x;
  const lastY = imageState.y;
  const mousePositionX = e.targetTouches ? e.targetTouches[0].pageX : e.clientX;
  const mousePositionY = e.targetTouches ? e.targetTouches[0].pageY : e.clientY;
  const newState = {
    mx: mousePositionX,
    my: mousePositionY,
    image: imageState
  };
  if (state.imageState.mx && state.imageState.my) {
    const xDiff = (state.imageState.mx - mousePositionX) / state.scale;
    const yDiff = (state.imageState.my - mousePositionY) / state.scale;
    imageState.y = getBoundedY(lastY - yDiff, state.scale);
    imageState.x = getBoundedX(lastX - xDiff, state.scale);
  }
  state.imageState.mx = newState.mx;
  state.imageState.my = newState.my;
  state.imageState.image = imageState;
};

const isDataURL = (str: string) => {
  if (str === null) {
    return false;
  }
  const regex =
    /^\s*data:([a-z]+\/[a-z]+(;[a-z-]+=[a-z-]+)?)?(;base64)?,[a-z0-9!$&',()*+;=\-._~:@?%\s]*\s*$/i;
  return !!str.match(regex);
};

const getBoundedX = (x: number, scale: number) => {
  const image = state.imageState.image;
  const dimensions = getDimensions();
  let widthDiff = Math.floor((image.width - dimensions.width / scale) / 2);
  widthDiff = Math.max(0, widthDiff);
  return Math.max(-widthDiff, Math.min(x, widthDiff));
};

const getBoundedY = (y: number, scale: number) => {
  const image = state.imageState.image;
  const dimensions = getDimensions();
  let heightDiff = Math.floor((image.height - dimensions.height / scale) / 2);
  heightDiff = Math.max(0, heightDiff);
  return Math.max(-heightDiff, Math.min(y, heightDiff));
};

const paintImage = (
  context: CanvasRenderingContext2D | null,
  image: ImageStateImage,
  border: number
) => {
  if (image.resource && context) {
    const position = calculatePosition(image, border);
    context.save();
    context.globalCompositeOperation = "destination-over";
    context.drawImage(
      image.resource,
      position.x,
      position.y,
      position.width,
      position.height
    );
    context.restore();
  }
};

const calculatePosition = (image: ImageStateImage, border: number) => {
  const img = image || state.imageState.image;
  const dimensions = getDimensions();
  const width = img.width * state.scale;
  const height = img.height * state.scale;
  const widthDiff = (width - dimensions.width) / 2;
  const heightDiff = (height - dimensions.height) / 2;
  const x = img.x * state.scale - widthDiff + border;
  const y = img.y * state.scale - heightDiff + border;
  return {
    x,
    y,
    height,
    width
  };
};

const redraw = () => {
  state.context!.clearRect(
    0,
    0,
    getDimensions().canvas.width,
    getDimensions().canvas.height
  );
  paint();
  paintImage(state.context, state.imageState.image, props.border);
};

const getImageScaled = () => {
  const { width, height } = getDimensions();
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  // Don't paint a border here, as it is the resulting image
  paintImage(canvas.getContext("2d"), state.imageState.image, 0);
  return canvas;
};

const getCroppingRect = () => {
  const dim = getDimensions();
  const frameRect = {
    x: dim.border,
    y: dim.border,
    width: dim.width,
    height: dim.height
  };
  const imageRect = calculatePosition(state.imageState.image, dim.border);
  return {
    x: (frameRect.x - imageRect.x) / imageRect.width,
    y: (frameRect.y - imageRect.y) / imageRect.height,
    width: frameRect.width / imageRect.width,
    height: frameRect.height / imageRect.height
  };
};

const clicked = () => {
  if (state.dragged) {
    state.dragged = false;
  } else {
    filePicker.value!.click();
  }
};

const fileSelected = (e: Event) => {
  if (e.target) {
    const files = (e.target as HTMLInputElement).files;
    if (!files || !files.length) {
      return;
    }
    const reader = new FileReader();
    state.changed = true;
    reader.onload = (e) => {
      if (e.target) loadImage(e.target.result);
    };
    reader.readAsDataURL(files[0]);
  }
};

watch(
  () => state.imageState,
  () => {
    if (state.imageLoaded) {
      redraw();
    }
  },
  {
    deep: true
  }
);

watch(
  () => props.scale,
  (val) => {
    state.scale = val;
    if (state.imageLoaded) {
      redraw();
    }
  }
);

onMounted(() => {
  state.context = canvas.value!.getContext("2d");
  paint();
  if (!props.image) {
    const placeholder = svgToImage(
      "<svg id='Layer_1' data-name='Layer 1' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 65 65'><defs><style>.cls-1{fill:#999;}</style></defs><title>Upload_Upload</title><path class='cls-1' d='M32.5,1A31.5,31.5,0,1,1,1,32.5,31.54,31.54,0,0,1,32.5,1m0-1A32.5,32.5,0,1,0,65,32.5,32.5,32.5,0,0,0,32.5,0h0Z'/><polygon class='cls-1' points='41.91 28.2 32.59 18.65 23.09 28.39 24.17 29.44 31.87 21.54 31.87 40.05 33.37 40.05 33.37 21.59 40.83 29.25 41.91 28.2'/><polygon class='cls-1' points='40.66 40.35 40.66 44.35 24.34 44.35 24.34 40.35 22.34 40.35 22.34 44.35 22.34 46.35 24.34 46.35 40.66 46.35 42.66 46.35 42.66 44.35 42.66 40.35 40.66 40.35'/></svg>"
    );
    placeholder.onload = () => {
      const x = canvasWidth.value / 2 - props.width / 2;
      const y = canvasHeight.value / 2 - props.height / 2;
      state.context!.drawImage(placeholder, x, y, props.width, props.height);
    };
  } else {
    loadImage(props.image);
  }
});
</script>

<style type="text/css">
.cursor-pointer {
  cursor: pointer;
}

.cursor-grab {
  cursor: grab;
  cursor: -webkit-grab;
  cursor: -moz-grab;
}

.cursor-grabbing {
  cursor: grabbing;
  cursor: -webkit-grabbing;
  cursor: -moz-grabbing;
}
</style>
