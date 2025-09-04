export default function Join() {
  return (
    <section className="page flex-centered">
      {/* <h2 className="hero-title">{'About'}</h2> */}
      <p className="hero-subtitle">{'Enter the secret code:'}</p>
      <input className="join-input" type="text" placeholder="Secret Code" />
      <button className="join-submit" type="button">
        {'submit'}
      </button>
    </section>
  );
}
