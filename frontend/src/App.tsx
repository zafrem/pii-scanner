import React from 'react';
import LanguageSelector from './components/LanguageSelector';
import TextInput from './components/TextInput';
import ProgressIndicator from './components/ProgressIndicator';
import SearchControls from './components/SearchControls';
import { useSearch } from './hooks/useSearch';

function App() {
  const search = useSearch();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">PII Scanner</h1>
              <p className="text-gray-600 mt-1">Multi-language PII detection with 3-stage sequential analysis</p>
            </div>
            <div className="text-sm text-gray-500">
              v1.0.0
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <LanguageSelector
                  selectedLanguages={search.selectedLanguages}
                  onChange={search.updateLanguages}
                  disabled={search.isLoading}
                />
              </div>
              <div>
                <TextInput
                  value={search.text}
                  onChange={search.updateText}
                  disabled={search.isLoading}
                />
              </div>
            </div>

            {/* Error Display */}
            {search.error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <div className="text-red-400 mr-2">⚠️</div>
                  <p className="text-red-700 text-sm">{search.error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Progress Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <ProgressIndicator
              stages={search.stageProgress}
              currentStage={search.stage}
            />
          </div>

          {/* Controls Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <SearchControls
              currentStage={search.stage}
              isLoading={search.isLoading}
              canProceedToNext={search.canProceedToNext}
              onStartSearch={search.startBasicSearch}
              onNextStage={search.proceedToNextStage}
              onReset={search.resetSearch}
              disabled={!search.text.trim() || search.selectedLanguages.length === 0}
            />
          </div>

          {/* Results Section */}
          {search.hasResults && search.currentResults && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Detection Results - Stage {search.currentResults.stage || 'Current'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600">
                    {search.currentResults.summary.detectedItems || search.currentResults.summary.totalItems}
                  </div>
                  <div className="text-sm text-gray-600">
                    {'detectedItems' in search.currentResults.summary 
                      ? 'Items Detected' 
                      : 'Total Items'
                    }
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-secondary-600">
                    {search.currentResults.processingTime}ms
                  </div>
                  <div className="text-sm text-gray-600">Processing Time</div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-success">
                    {'detectionRate' in search.currentResults.summary 
                      ? `${search.currentResults.summary.detectionRate.toFixed(1)}%`
                      : `${Object.keys(search.currentResults.summary.languageBreakdown).length}`
                    }
                  </div>
                  <div className="text-sm text-gray-600">
                    {'detectionRate' in search.currentResults.summary 
                      ? 'Detection Rate' 
                      : 'Languages'
                    }
                  </div>
                </div>
              </div>

              {search.currentResults.items.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800">Detected Items:</h4>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {search.currentResults.items.map((item) => (
                      <div key={item.id} className="p-3 bg-gray-50 rounded border-l-4 border-primary-500">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-mono text-sm bg-white px-2 py-1 rounded">
                              {item.text}
                            </span>
                            <div className="text-xs text-gray-600 mt-1">
                              Type: {item.type} | Language: {item.language}
                              {'isDetected' in item 
                                ? ` | Status: ${item.isDetected ? 'Detected' : 'Not Detected'}`
                                : ` | Probability: ${(item.probability * 100).toFixed(1)}%`
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No PII detected in the provided text.
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>PII Scanner - Protecting privacy through intelligent detection</p>
            <p className="mt-1">Supports Korean, English, Chinese, Japanese, Spanish, and French</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
