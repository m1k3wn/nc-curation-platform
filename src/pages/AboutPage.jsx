export default function AboutPage() {
  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Shonk</h1>
            <p className="text-xl text-gray-600">topline summary copy</p>
          </div>

          {/* Mission Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-semibold mb-6 border-b pb-2">INFO</h2>
            <p className="mb-4">some info copy</p>
            <p className="mb-4">copy copy copy xxxx</p>
          </section>

          {/* Contact Section */}
          <section>
            <h2 className="text-2xl font-semibold mb-6 border-b pb-2">
              Get In Touch
            </h2>
            <p className="mb-6">some more info</p>
            <button className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors">
              Contact Us
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
