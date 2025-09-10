import Dashboard from "./components/Dashboard";
import Books from "./components/Books";
import PriceHistogram from "./components/PriceHistogram";
import TopTitleWords from "./components/TopTitleWords";


function App() {
  return (
    <div className="App">
      <Dashboard />
      <Books />
      <PriceHistogram bucketSize={5}/>
      <TopTitleWords topN={10}/>
    </div>
  );
}

export default App;