/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { ImageUploader } from '@/components/ImageUploader';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
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
import { cn } from '@/lib/utils';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    }
  }
};

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
        <motion.main 
          className="h-full flex flex-col"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <div className="space-y-8 text-center mb-12">
            {/* Hero Section */}
            <div className="space-y-4">
              <motion.div 
                className="flex items-center justify-center gap-2 mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              >
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "px-4 py-1.5 rounded-full", 
                    "bg-gradient-to-r from-green-500/10 to-emerald-500/10",
                    "border border-green-500/20",
                    "text-emerald-500 font-medium",
                    "shadow-sm shadow-green-500/10",
                    "backdrop-blur-sm"
                  )}
                >
                  <motion.div
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-2" />
                  </motion.div>
                  Nouveau
                </Badge>
              </motion.div>

              <div className="relative">
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary-foreground/20 blur-3xl -z-10"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0.8, 0.5] 
                  }}
                  transition={{ 
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut" 
                  }}
                />
                <motion.h1 
                  className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight"
                  variants={itemVariants}
                >
                  <span className="bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Transformez vos fichiers
                  </span>
                  <br />
                  <span className="text-primary relative">
                    comme par magie
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ 
                        opacity: [0, 1, 1],
                        y: [10, 0, 0],
                        filter: [
                          'drop-shadow(0 0 0 rgba(255,255,255,0))',
                          'drop-shadow(0 0 8px rgba(255,255,255,0.5))',
                          'drop-shadow(0 0 0 rgba(255,255,255,0))'
                        ]
                      }}
                      transition={{ 
                        duration: 1.2,
                        delay: 0.5,
                        ease: [0.22, 1, 0.36, 1], // Cubic bezier pour une animation plus naturelle
                        filter: {
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                          times: [0, 0.5, 1]
                        }
                      }}
                      className="group"
                    >
                      <Wand2 
                        className={cn(
                          "absolute -right-12 top-4 h-8 w-8",
                          "text-primary transition-transform",
                          "group-hover:rotate-12 group-hover:scale-110",
                          "duration-300 ease-out"
                        )} 
                      />
                    </motion.div>
                  </span>
                </motion.h1>
              </div>

              <motion.p 
                className="text-xl text-muted-foreground max-w-2xl mx-auto"
                variants={itemVariants}
              >
                Convertissez et optimisez vos fichiers en quelques clics, sans compromis sur la qualité
              </motion.p>
            </div>
            
            {/* Features Grid */}
            <motion.div 
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto"
              variants={containerVariants}
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  whileHover={{ 
                    scale: 1.05,
                    transition: { type: "spring", stiffness: 300 }
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Card 
                    className={`p-4 border ${feature.borderColor} ${feature.bgColor} transition-all`}
                  >
                    <div className="flex flex-col items-center text-center gap-2">
                      <motion.div 
                        className={`p-2.5 rounded-xl ${feature.bgColor}`}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <feature.icon className={`h-5 w-5 ${feature.color}`} />
                      </motion.div>
                      <div>
                        <h3 className="font-semibold">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* File Types Section */}
            <motion.div 
              className="flex flex-col items-center gap-6 pt-4"
              variants={containerVariants}
            >
              <motion.div 
                className="flex items-center gap-3 px-4 py-2 rounded-full border bg-card shadow-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ImageIcon className="h-4 w-4 text-primary" />
                <p className="text-sm">
                  <span className="text-muted-foreground">Formats supportés :</span>
                  {" "}
                  <span className="font-medium">PNG, JPEG, WebP, AVIF, GIF, TIFF</span>
                </p>
              </motion.div>

              <motion.div 
                className="flex flex-wrap justify-center gap-2"
                variants={containerVariants}
              >
                {["Conversion instantanée", "Sans perte de qualité", "Traitement local"].map((text, i) => (
                  <motion.div
                    key={text}
                    variants={itemVariants}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Badge variant="outline" className="py-1 text-xs">
                      <ArrowRight className="mr-1 h-3 w-3" /> {text}
                    </Badge>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>

          {/* Upload Section */}
          <motion.div 
            className="flex-1 flex flex-col"
            variants={itemVariants}
          >
            <ImageUploader />
          </motion.div>
        </motion.main>
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
