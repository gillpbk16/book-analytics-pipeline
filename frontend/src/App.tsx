import React from "react";
import Dashboard from "./components/Dashboard";
import Books from "./components/Books";
import PriceHistogram from "./components/PriceHistogram";
import TopTitleWords from "./components/TopTitleWords";


function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/*Header*/}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-6 py-2">
          <h1 className="text-xl font-bold text-gray-900">
            Book Analytics Platform
          </h1>
        </div>
      </header>

      {/*Main*/}
      <main className="flex-1 overflow-hidden">
        <div className="mx-auto max-w-7xl h-full px-4 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 h-full gap-4">
             {/*Main Content*/}
             <section className="lg:col-span-8 flex flex-col gap-4 h-full">
              
              {/* Dashboard + Books in vertical layout */}
              <div className="shrink-0">
                <Dashboard />
              </div>

              {/*Books*/}
              <div className="h-[40rem] overflow-auto rounded-xl">
                <Books />
              </div>
            </section>

            {/*Sidebar*/}
            <aside className="lg:col-span-4 flex flex-col gap-4 h-full overflow-hidden">
              <div className="h-[25rem] overflow-hidden rounded-xl">
                <PriceHistogram />
              </div>
              <div className="h-[20rem] overflow-hidden rounded-xl">
                <TopTitleWords />
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;