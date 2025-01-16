'use client';

import { Moon, Sun, Github, Image, FileArchive, Wand2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Header() {
  const { setTheme } = useTheme();
  const pathname = usePathname();

  const navigation = [
    {
      name: "Images",
      href: "/",
      icon: Image,
      items: [
        { name: "Convertisseur", href: "/" },
        { name: "Optimisation Pro", href: "/image-optimizer", badge: "PRO" },
      ]
    },
    {
      name: "Archives",
      href: "/zip-viewer",
      icon: FileArchive,
      items: [
        { name: "Visualiseur ZIP", href: "/zip-viewer" },
      ]
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2">
            <Wand2 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              FileWizard
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navigation.map((category) => (
              <div key={category.name} className="relative group">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  <category.icon className="h-4 w-4" />
                  {category.name}
                </div>
                
                <div className="absolute left-0 top-full pt-2 opacity-0 translate-y-1 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible transition-all">
                  <div className="w-48 rounded-lg border bg-popover p-2 shadow-md space-y-1">
                    {category.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "relative flex items-center justify-between rounded-md px-3 py-2.5 text-sm transition-colors",
                          "hover:bg-accent hover:text-accent-foreground",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          pathname === item.href && "bg-accent text-accent-foreground",
                        )}
                      >
                        {item.name}
                        {item.badge && (
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "text-[10px] px-1.5 py-0 h-4",
                              "ml-2 font-medium"
                            )}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <Link
            href="https://github.com/dexctor"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:block"
          >
            <Button variant="outline" size="sm" className="h-8">
              <Github className="h-4 w-4 mr-2" />
              GitHub
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Changer le thème</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="h-4 w-4 mr-2" />
                Clair
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="h-4 w-4 mr-2" />
                Sombre
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
} 