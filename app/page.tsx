/* eslint-disable react/no-unescaped-entities */
import { ImageUploader } from '@/components/ImageUploader';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Wand2, 
  Zap, 
  Shield, 
  Sparkles,
  Image as ImageIcon,
  FileType,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: "Conversion rapide",
    description: "Traitement instantané de vos fichiers",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20"
  },
  {
    icon: Shield,
    title: "100% sécurisé",
    description: "Traitement local, aucun stockage",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20"
  },
  {
    icon: FileType,
    title: "Multi-formats",
    description: "PNG, JPEG, WebP, AVIF, etc.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20"
  },
  {
    icon: CheckCircle2,
    title: "Haute qualité",
    description: "Compression optimisée",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20"
  }
];

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="container max-w-5xl flex-1 py-12 sm:py-16">
        <main className="h-full flex flex-col">
          <div className="space-y-8 text-center mb-12">
            {/* Hero Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 mb-6">
                <Badge variant="secondary" className="px-4 py-1 rounded-full">
                  <Sparkles className="w-3.5 h-3.5 mr-2" />
                  Nouveau
                </Badge>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary-foreground/20 blur-3xl -z-10" />
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                  <span className="bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Transformez vos fichiers
                  </span>
                  <br />
                  <span className="text-primary relative">
                    comme par magie
                    <Wand2 className="absolute -right-12 top-4 h-8 w-8 text-primary animate-pulse" />
                  </span>
                </h1>
              </div>

              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Convertissez et optimisez vos fichiers en quelques clics, sans compromis sur la qualité
              </p>
            </div>
            
            {/* Features Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {features.map((feature) => (
                <Card 
                  key={feature.title}
                  className={`p-4 border ${feature.borderColor} ${feature.bgColor} transition-all hover:scale-105`}
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className={`p-2.5 rounded-xl ${feature.bgColor}`}>
                      <feature.icon className={`h-5 w-5 ${feature.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* File Types Section */}
            <div className="flex flex-col items-center gap-6 pt-4">
              <div className="flex items-center gap-3 px-4 py-2 rounded-full border bg-card shadow-sm">
                <ImageIcon className="h-4 w-4 text-primary" />
                <p className="text-sm">
                  <span className="text-muted-foreground">Formats supportés :</span>
                  {" "}
                  <span className="font-medium">PNG, JPEG, WebP, AVIF, GIF, TIFF</span>
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="outline" className="py-1 text-xs">
                  <ArrowRight className="mr-1 h-3 w-3" /> Conversion instantanée
                </Badge>
                <Badge variant="outline" className="py-1 text-xs">
                  <ArrowRight className="mr-1 h-3 w-3" /> Sans perte de qualité
                </Badge>
                <Badge variant="outline" className="py-1 text-xs">
                  <ArrowRight className="mr-1 h-3 w-3" /> Traitement local
                </Badge>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div className="flex-1 flex flex-col">
            <ImageUploader />
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="py-6 border-t">
        <div className="container max-w-5xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              FileWizard — La magie de la conversion de fichiers
            </p>
            <div className="flex items-center gap-4">
              <a 
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Conditions d'utilisation
              </a>
              <a 
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Politique de confidentialité
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
