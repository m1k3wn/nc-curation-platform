import CollectionCascade from "../components/collections/CollectionCascade";
// import landingGraphic from "../assets/cura-landing-graphic.png";
import landingGraphic from "../assets/cura-landing-graphic-inv.png";

export default function AboutPage() {
  return (
    <div className="py-6">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-title text-6xl">CURA</h1>
            <p className="text-subtitle">Curating the World's Collections</p>
          </div>
        </div>
        <div>
          {/* Info */}
          <section className="text-center max-w-2xl mx-auto mb-2">
            <p>
              A platform for artists, designers, researches and curious minds.
              CURA searches millions of archive entries from the World's leading
              collections, to find only the most fascinating objects, artworks
              and images.
            </p>
          </section>
          {/* Graphic */}
          <div>
            <img
              src={landingGraphic}
              alt="Cura About Graphic"
              className="mx-auto mt-2 w-full max-w-2xl"
            />
          </div>
          {/* Links */}
          <section className="text-center text-subtitle text-ml max-w-2xl mx-auto bg-main text-inverse mt-0 px-2 py-4 rounded-lg">
            <p>
              Built by
              <a
                href="https://github.com/m1k3wn"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent-primary"
              >
                {" "}
                Mike Winnard
              </a>{" "}
              for
              <a
                href="https://www.techreturners.com/about-us/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent-primary"
              >
                {" "}
                Northcoders / Tech Returners.
              </a>
            </p>
            <p className="text-subtitle text-ml  text-inverse pt-4">
              <a
                href="https://github.com/m1k3wn/nc-curation-platform"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent-primary"
              >
                Explore the source code{" "}
              </a>
            </p>
          </section>
        </div>
        {/* Collections List */}
        <CollectionCascade />
      </div>
    </div>
  );
}
