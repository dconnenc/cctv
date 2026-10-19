import { Button } from '@cctv/core';

import styles from './NotFound.module.scss';

export default function NotFound() {
  return (
    <section className={`page flex-centered ${styles.notFound}`}>
      <h1 className={styles.title}>{'Page not found'}</h1>
      <p className={styles.message}>{"We couldn't find anything at this address."}</p>
      <Button to="/">{'Back to home'}</Button>
    </section>
  );
}
