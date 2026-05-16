import { ComponentPropsWithoutRef, ElementRef, HTMLAttributes, forwardRef } from 'react';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import styles from './Drawer.module.scss';

type Side = 'right' | 'left';

type DrawerRootProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Root>;

function Drawer({ modal = false, ...props }: DrawerRootProps) {
  return <DialogPrimitive.Root modal={modal} {...props} />;
}

const DrawerTrigger = DialogPrimitive.Trigger;
const DrawerPortal = DialogPrimitive.Portal;
const DrawerClose = DialogPrimitive.Close;

const DrawerOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={`${styles.overlay} ${className || ''}`}
    {...props}
  />
));
DrawerOverlay.displayName = 'DrawerOverlay';

interface DrawerContentProps extends ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: Side;
  showOverlay?: boolean;
}

const DrawerContent = forwardRef<ElementRef<typeof DialogPrimitive.Content>, DrawerContentProps>(
  ({ className, children, side = 'right', showOverlay = false, ...props }, ref) => (
    <DrawerPortal>
      {showOverlay && <DrawerOverlay />}
      <DialogPrimitive.Content
        ref={ref}
        className={`${styles.content} ${side === 'left' ? styles.left : styles.right} ${className || ''}`}
        onInteractOutside={(event) => {
          props.onInteractOutside?.(event);
        }}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className={styles.close} aria-label="Close drawer">
          <X className={styles.closeIcon} />
          <span className={styles.srOnly}>Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DrawerPortal>
  ),
);
DrawerContent.displayName = 'DrawerContent';

function DrawerHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`${styles.header} ${className || ''}`} {...props} />;
}

function DrawerBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`${styles.body} ${className || ''}`} {...props} />;
}

function DrawerFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`${styles.footer} ${className || ''}`} {...props} />;
}

const DrawerTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={`${styles.title} ${className || ''}`} {...props} />
));
DrawerTitle.displayName = 'DrawerTitle';

const DrawerDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={`${styles.description} ${className || ''}`}
    {...props}
  />
));
DrawerDescription.displayName = 'DrawerDescription';

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
