import CollectionCascade from "../components/collections/CollectionCascade";

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
          {/* Links */}
          <section className="text-center text-body max-w-2xl mx-auto bg-main text-inverse mt-4 px-2 py-4 rounded-lg">
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
            <p className="text-body  text-inverse">
              Explore the source code{" "}
              <a
                href="https://github.com/m1k3wn/nc-curation-platform"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent-primary"
              >
                HERE
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
