// Kiểu cho thẻ <model-viewer> (web component của Google, nạp động trong Product3DViewer)
import type React from 'react';

export interface ModelViewerElement extends HTMLElement {
  canActivateAR: boolean;
  activateAR: () => Promise<void>;
  cameraOrbit: string;
  fieldOfView: string;
  autoRotate: boolean;
  jumpCameraToGoal: () => void;
  resetTurntableRotation: (theta?: number) => void;
  getDimensions: () => { x: number; y: number; z: number };
  getBoundingBoxCenter: () => { x: number; y: number; z: number };
}

type ModelViewerAttributes = React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
  src?: string;
  'ios-src'?: string;
  alt?: string;
  poster?: string;
  ar?: string;
  'ar-modes'?: string;
  'ar-scale'?: string;
  'ar-placement'?: string;
  'camera-controls'?: string;
  'auto-rotate'?: string;
  'auto-rotate-delay'?: string;
  'rotation-per-second'?: string;
  'camera-orbit'?: string;
  'min-camera-orbit'?: string;
  'max-camera-orbit'?: string;
  'field-of-view'?: string;
  'interaction-prompt'?: string;
  'shadow-intensity'?: string;
  'shadow-softness'?: string;
  exposure?: string;
  'environment-image'?: string;
  'touch-action'?: string;
  loading?: string;
  reveal?: string;
  'xr-environment'?: string;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerAttributes;
    }
  }
}
