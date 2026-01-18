import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            LexiGov AI
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            AI-Powered Ordinance & Policy Drafting Assistant
            <br />for Philippine Local Government Units
          </p>
          <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:mt-10">
            <div className="sm:flex sm:gap-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-8 py-3 text-base font-medium text-white hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
              >
                Get Started
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-8 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12" id="features">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 text-blue-600">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9 2v-6H7v-3h-2v6h2v6h2v-2h2v-6h6v6h6v2h6v6h2z"
                  />
                </svg>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">
                AI-Powered Generation
              </h3>
              <p className="mt-2 text-base text-gray-500">
                Create ordinance drafts in seconds with Google Gemini AI, following RA 7160 compliance.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-100 text-green-600">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2l-4-4m4 4l-2-2m-2-2l-2 2m0 4l-2 2m-2 2l-2 2m0-4l2-2m-2-2m0-4l-2 2"
                  />
                </svg>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">
                Philippine Compliance
              </h3>
              <p className="mt-2 text-base text-gray-500">
                Built for Philippine LGUs with automatic validation against Local Government Code of 1991.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-100 text-purple-600">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-5.357-5.356A1 1 0 00-1-1v-6h2v6h2V8h-2V6h-2V4h-2v-2H4v6h-2V8h-2v6h-2V6h-2v2H4zm2 6h2v-2H6v-2h2v-2h2V8h-2v-2H8v2z"
                  />
                </svg>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">
                Real-Time Collaboration
              </h3>
              <p className="mt-2 text-base text-gray-500">
                Multi-user document editing with CRDTs - work together in real-time.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-yellow-100 text-yellow-600">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5h6a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-3z"
                  />
                </svg>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">
                Template Library
              </h3>
              <p className="mt-2 text-base text-gray-500">
                Pre-built ordinance templates for common use cases across all LGU types.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-red-100 text-red-600">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l18 18v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2v-6a2 2 0 00-2-2H5zm4 6H5v4h2V9zm2 0h2v2h2v-2h-2v2h2V9z"
                  />
                </svg>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">
                Export Formats
              </h3>
              <p className="mt-2 text-base text-gray-500">
                Generate PDF and DOCX exports ready for official submission and archiving.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-100 text-indigo-600">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6-4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-2v2h2v-2h-2v-2h-2V9h-2v-2h-2v-2h-2V9z"
                  />
                </svg>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">
                Version Control
              </h3>
              <p className="mt-2 text-base text-gray-500">
                Track all changes, compare versions, and restore previous drafts effortlessly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
