import '../static.css';

export const BackgroundStatic = () => {
  return (
    <div className="tv-static">
      <div className="tear-single" />
      <div className="tear-double">
        <span className="tear-band tear-band--small" />
        <span className="tear-band tear-band--medium" />
      </div>
      <div className="tv-on-effect" />
    </div>
  );
};
