import React from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { ArrowRight, Book, Code, Terminal } from 'lucide-react';

export default function Home() {
  return (
    <>
      <Head>
        <title>Rising BSM Documentation</title>
        <meta name="description" content="Documentation for Rising BSM - Business Service Management system" />
      </Head>
      
      <div className="px-4 py-12 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Rising BSM Documentation
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Comprehensive documentation for the Rising Business Service Management system.
            Explore our guides, API references, and examples to get the most out of the platform.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              href="/docs/"
              className="rounded-md bg-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 inline-flex items-center"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/docs/api"
              className="rounded-md border border-gray-300 dark:border-gray-700 px-6 py-3 text-lg font-semibold text-gray-900 dark:text-white shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              API Reference
            </Link>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-900 py-12 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Main Features
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Rising BSM provides a comprehensive backend system for business service management.
            </p>
          </div>
          
          <div className="mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-8 md:max-w-4xl md:grid-cols-3">
            <div className="flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900">
                <Book className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Guides</h3>
              <p className="mt-2 text-center text-gray-600 dark:text-gray-300">
                Step-by-step instructions to get you up and running with Rising BSM.
              </p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900">
                <Code className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">API Reference</h3>
              <p className="mt-2 text-center text-gray-600 dark:text-gray-300">
                Detailed documentation of all available API endpoints and models.
              </p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900">
                <Terminal className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Examples</h3>
              <p className="mt-2 text-center text-gray-600 dark:text-gray-300">
                Code samples and use cases to help you implement Rising BSM in your projects.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}