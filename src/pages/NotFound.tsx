import { Link } from 'react-router-dom';
import { Compass, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 flex flex-col items-center justify-center p-6 text-center" id="not-found-page-root">
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 mb-6 flex items-center justify-center">
        <Compass className="h-10 w-10" />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-100">Page Not Found</h1>
      <p className="text-xs text-zinc-500 mt-2.5 max-w-xs leading-relaxed">
        The route or resource you are looking for has been moved, archived, or does not exist.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link to="/">
          <Button variant="outline" size="sm" className="text-xs">
            Back to Home
          </Button>
        </Link>
        <Link to="/dashboard">
          <Button size="sm" className="text-xs" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
