import { ComponentType, FC, useCallback, useMemo, useState } from 'react';

import { Modal } from '@cctv/core';

type WithClose<P> = P & { closeModal: () => void };

export function useModal<P extends object>(Component: ComponentType<WithClose<P>>) {
  const [isOpen, setIsOpen] = useState(false);
  const [props, setProps] = useState<P | null>(null);

  const close = useCallback(() => setIsOpen(false), []);

  const open = useCallback((nextProps: P) => {
    setProps(nextProps);
    setIsOpen(true);
  }, []);

  const ModalContainer: FC = useMemo(() => {
    const C = Component;
    const M: FC = () => {
      if (!isOpen || props == null) return null;
      return (
        <Modal onClose={close}>
          <C {...(props as P)} closeModal={close} />
        </Modal>
      );
    };
    M.displayName = 'HookedModal';
    return M;
  }, [Component, close, isOpen, props]);

  return { open, close, isOpen, Modal: ModalContainer } as const;
}
