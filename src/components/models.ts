export interface IAvatarEditor {
  getImageScaled: () => HTMLCanvasElement;
}

export interface ImageStateImage {
  x: number;
  y: number;
  width: number;
  height: number;
  resource: HTMLImageElement | null;
}

export interface ImageState {
  drag: boolean;
  my: number | null;
  mx: number | null;
  image: ImageStateImage;
}

export interface State {
  cursor: string;
  scale: number;
  canvas: CanvasRenderingContext2D | null;
  context: CanvasRenderingContext2D | null;
  dragged: boolean;
  imageLoaded: boolean;
  changed: boolean;
  imageState: ImageState;
}
