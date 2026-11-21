import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer.jsx';
import Header from '../components/Header.jsx';
import { useSite } from '../lib/SiteContext.jsx';

/** 404 page. Used for unknown URLs and for case studies whose slug does not exist. */
export default function NotFound({ title, body }) {
  const { t, href } = useSite();
  const heading = title ?? t.common.pageNotFoundTitle;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header onHome={false} />
      <main className="container-page flex min-h-[60vh] flex-1 flex-col items-start justify-center pt-24">
        <p className="label-mono">404</p>
        <h1 className="mt-4 font-display text-3xl font-medium tracking-tight">{heading}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{body ?? t.common.pageNotFoundBody}</p>
        <Link
          to={href('/#projects')}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t.caseStudy.back}
        </Link>
      </main>
      <Footer onHome={false} />
    </div>
  );
}
