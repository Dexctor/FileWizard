"use client"

import React from 'react'
import { ZipViewer, ZipViewerProvider } from '@/components/features/zip-viewer/ZipViewer'
import { motion } from 'framer-motion'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    }
  }
}

export default function ZipViewerPage() {
  return (
    <ZipViewerProvider>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <ZipViewer />
      </motion.div>
    </ZipViewerProvider>
  )
} 