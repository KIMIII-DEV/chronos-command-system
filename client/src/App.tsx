import { Route, Switch } from 'wouter';
import PublicLayer from './pages/index';
import PrivateDashboard from './pages/Private';

/**
 * CHRONOS OSS - APP ROUTING (A2.4)
 */

export default function App() {
  return (
    <Switch>
      <Route path="/" component={PublicLayer} />
      <Route path="/private" component={PrivateDashboard} />
      <Route>
        <div className="bg-black h-screen flex items-center justify-center text-red-500 font-mono">
          404 - RESOURCE NOT FOUND
        </div>
      </Route>
    </Switch>
  );
}
