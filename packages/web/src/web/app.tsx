import { Route, Switch } from "wouter";
import { Provider } from "./components/provider";
import { Layout, ProtectedRoute } from "./components/layout";
import { AgentFeedback, RunableBadge } from "@runablehq/website-runtime";
import Index from "./pages/index";
import MarketMap from "./pages/market-map";
import Search from "./pages/search";
import Property from "./pages/property";
import Dashboard from "./pages/dashboard";
import Saved from "./pages/saved";
import Marketplace from "./pages/marketplace";
import Renovation from "./pages/renovation";
import RoiCalculator from "./pages/roi-calculator";
import Leaderboards from "./pages/leaderboards";
import Auth from "./pages/auth";
import Onboarding from "./pages/onboarding";
import Pricing from "./pages/pricing";
import Settings from "./pages/settings";
import Admin from "./pages/admin";
import { PageHead } from "./components/blueprint";
import { EmptyState } from "./components/layout";
import { Link } from "wouter";

function NotFound() {
  return (
    <div className="pp-rise">
      <PageHead kicker="PP-404 · OFF THE GRID" title="No such sheet" />
      <EmptyState>
        That page isn&apos;t part of the set.{" "}
        <Link to="/" style={{ color: "var(--accent-ink)" }}>
          Back to the ground floor
        </Link>
        .
      </EmptyState>
    </div>
  );
}

function App() {
  return (
    <Provider>
      <Layout>
        <Switch>
          <Route path="/" component={Index} />
          <Route path="/market-map" component={MarketMap} />
          <Route path="/properties/search" component={Search} />
          <Route path="/properties/:id" component={Property} />
          <Route path="/marketplace" component={Marketplace} />
          <Route path="/renovation" component={Renovation} />
          <Route path="/tools/roi-calculator" component={RoiCalculator} />
          <Route path="/leaderboards" component={Leaderboards} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/auth" component={Auth} />

          <Route path="/dashboard/saved">
            <ProtectedRoute>
              <Saved />
            </ProtectedRoute>
          </Route>
          <Route path="/dashboard">
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </Route>
          <Route path="/onboarding">
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          </Route>
          <Route path="/settings">
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          </Route>
          <Route path="/admin">
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          </Route>

          <Route component={NotFound} />
        </Switch>
      </Layout>
      {/* Do not remove — off by default, activated by parent iframe via postMessage */}
      {import.meta.env.DEV && <AgentFeedback />}
      {/* "Made with Runable" badge - if user asks to remove the runable badge, remove this code as well as comment */}
      {<RunableBadge />}
    </Provider>
  );
}

export default App;
