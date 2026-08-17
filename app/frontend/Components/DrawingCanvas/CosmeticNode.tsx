import { useEffect, useRef, useState } from 'react';

import type Konva from 'konva';
import { Image as KonvaImage, Transformer } from 'react-konva';

import { cosmeticAssetUrl } from '@cctv/components/Cosmetics';
import { CosmeticPlacement } from '@cctv/types';

interface CosmeticNodeProps {
  placement: CosmeticPlacement;
  // When false the cosmetic is locked: not draggable/selectable and it ignores
  // pointer events so the user can draw over it.
  interactive: boolean;
  selected: boolean;
  onSelect: () => void;
  onChange: (next: CosmeticPlacement) => void;
}

export default function CosmeticNode({
  placement,
  interactive,
  selected,
  onSelect,
  onChange,
}: CosmeticNodeProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const nodeRef = useRef<Konva.Image>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    const url = cosmeticAssetUrl(placement.asset_key);
    if (!url) return;
    const img = new window.Image();
    img.addEventListener('load', () => setImage(img));
    img.src = url;
  }, [placement.asset_key]);

  // A selected, interactive cosmetic gets a rotate handle via the Transformer.
  const showTransformer = interactive && selected;
  useEffect(() => {
    if (showTransformer && transformerRef.current && nodeRef.current) {
      transformerRef.current.nodes([nodeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [showTransformer, image]);

  if (!image) return null;

  // Render about the center so drag and rotation share the same origin.
  const centerX = placement.x + placement.width / 2;
  const centerY = placement.y + placement.height / 2;

  const persist = () => {
    const node = nodeRef.current;
    if (!node) return;
    onChange({
      ...placement,
      x: node.x() - placement.width / 2,
      y: node.y() - placement.height / 2,
      rotation: node.rotation(),
    });
  };

  return (
    <>
      <KonvaImage
        ref={nodeRef}
        name="cosmetic"
        image={image}
        x={centerX}
        y={centerY}
        offsetX={placement.width / 2}
        offsetY={placement.height / 2}
        width={placement.width}
        height={placement.height}
        rotation={placement.rotation}
        listening={interactive}
        draggable={interactive}
        onMouseDown={interactive ? onSelect : undefined}
        onTouchStart={interactive ? onSelect : undefined}
        onDragStart={interactive ? onSelect : undefined}
        onDragEnd={interactive ? persist : undefined}
        onTransformEnd={interactive ? persist : undefined}
      />
      {showTransformer ? (
        <Transformer
          ref={transformerRef}
          rotateEnabled
          resizeEnabled={false}
          enabledAnchors={[]}
          rotateAnchorOffset={22}
          borderStroke="#c8f060"
          borderDash={[6, 4]}
          anchorStroke="#c8f060"
          anchorFill="#080808"
          anchorSize={12}
        />
      ) : null}
    </>
  );
}
