import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
const logoImage = "/images/ciry-logo.png";

interface ContentPage {
  id: string;
  slug: string;
  title: string;
  placement: string;
  isPublished: boolean;
}

export default function Footer() {
  const { data: footerPages = [] } = useQuery<ContentPage[]>({
    queryKey: ["/api/content-pages"],
    select: (pages) => pages.filter(page => page.placement === 'footer' && page.isPublished),
  });

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Logo */}
          <div className="flex items-center">
            <img src={logoImage} alt="CIRY" className="h-8" />
          </div>

          {/* Footer Links */}
          <div className="flex flex-wrap justify-center gap-6">
            {footerPages.map((page) => (
              <Link key={page.id} href={`/page/${page.slug}`}>
                <a className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid={`footer-${page.slug}`}>
                  {page.title}
                </a>
              </Link>
            ))}
          </div>

          {/* Copyright */}
          <div className="text-sm text-muted-foreground">
            © {currentYear} CIRY. Tutti i diritti riservati.
          </div>
        </div>
      </div>
    </footer>
  );
}
