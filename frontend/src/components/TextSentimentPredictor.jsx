"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, Download, FileText, PieChart } from "lucide-react"

export default function TextSentimentPredictor() {
  const [review, setReview] = React.useState("")
  const [uploadedFile, setUploadedFile] = React.useState(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [result, setResult] = React.useState(null)
  const [downloadData, setDownloadData] = React.useState(null)
  const [fileName, setFileName] = React.useState("")
  const [graphImage, setGraphImage] = React.useState(null)

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setError("Please upload a valid CSV file")
        return
      }
      setUploadedFile(file)
      setFileName(file.name)
      setResult(null)
      setError(null)
      setDownloadData(null)
      setGraphImage(null)
    }
  }

  async function handleSinglePrediction() {
    if (!review.trim()) {
      setError("Please enter some text to analyze")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    setDownloadData(null)
    setGraphImage(null)

    try {
      const res = await fetch("http://localhost:5000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: review }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || `Request failed with status ${res.status}`)
      }

      const data = await res.json()
      let sentiment

      if (typeof data === 'string') sentiment = data
      else if (data.sentiment) sentiment = data.sentiment
      else if (data.prediction) sentiment = data.prediction
      else if (data.label) sentiment = data.label
      else sentiment = "Unknown"

      setResult(sentiment)
    } catch (e) {
      setError(e.message ? `Error: ${e.message}` : "Something went wrong while processing your request")
    } finally {
      setLoading(false)
    }
  }

  async function handleBulkPrediction() {
    if (!uploadedFile) {
      setError("Please upload a CSV file first")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    setGraphImage(null)

    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)

      const res = await fetch("http://localhost:5000/predict", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || `Request failed with status ${res.status}`)
      }

      // Extract graph data from headers
      const graphData = res.headers.get('X-Graph-Data')
      if (graphData) {
        setGraphImage(`data:image/png;base64,${graphData}`)
      }

      const blob = await res.blob()
      if (blob.type !== 'text/csv' && !res.headers.get('content-type')?.includes('csv')) {
        throw new Error("Server did not return a CSV file")
      }

      setDownloadData(blob)
      setResult("Bulk prediction completed! Download your results below.")
    } catch (e) {
      setError(e.message ? `Error: ${e.message}` : "Something went wrong while processing the file")
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (downloadData) {
      const url = URL.createObjectURL(downloadData)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Predictions.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const clearAll = () => {
    setReview("")
    setUploadedFile(null)
    setFileName("")
    setError(null)
    setResult(null)
    setDownloadData(null)
    setGraphImage(null)
    const fileInput = document.getElementById('csv-upload')
    if (fileInput) fileInput.value = ''
  }

  const onKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault()
      handleSinglePrediction()
    }
  }

  const canSubmitSingle = review.trim().length > 0 && !loading
  const canSubmitBulk = uploadedFile && !loading

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Customer Sentiment Prediction</h1>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Analyze sentiment of individual text or bulk process CSV files
          </p>
          {(review || uploadedFile || result || error) && (
            <button onClick={clearAll} className="mt-4 text-sm text-gray-600 hover:text-gray-800 underline">
              Clear all
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Bulk CSV Prediction */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-300 overflow-hidden">
            <div className="bg-gray-800 p-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Bulk CSV Prediction
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-800">Upload CSV File</label>

                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    uploadedFile ? 'border-gray-700 bg-gray-100' : 'border-gray-400 hover:border-gray-600'
                  }`}
                >
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="csv-upload" />
                  <label htmlFor="csv-upload" className="cursor-pointer block">
                    <FileText
                      className={`w-12 h-12 mx-auto mb-3 ${
                        uploadedFile ? 'text-gray-800' : 'text-gray-500'
                      }`}
                    />
                    <p className="text-sm text-gray-700 mb-2">
                      {uploadedFile ? (
                        <span className="text-gray-800 font-medium">{fileName}</span>
                      ) : (
                        "Choose a CSV file or drag and drop"
                      )}
                    </p>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      {uploadedFile ? "Change File" : "Select File"}
                    </button>
                  </label>
                </div>

                <p className="text-xs text-gray-600 text-center">
                  CSV should have a "Sentence" column containing text to analyze
                </p>
              </div>

              <button
                onClick={handleBulkPrediction}
                disabled={!canSubmitBulk}
                className="w-full bg-gray-800 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing Bulk Prediction...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Predict Bulk Sentiment
                  </>
                )}
              </button>

              {downloadData && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Predictions.csv
                  </button>
                </motion.div>
              )}
            </div>
          </div>

          {/* Single Text Prediction */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-300 overflow-hidden">
            <div className="bg-gray-700 p-4">
              <h2 className="text-xl font-semibold text-white">Single Text Prediction</h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <label htmlFor="review" className="block text-sm font-medium text-gray-800">
                  Enter Text to Analyze
                </label>
                <textarea
                  id="review"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Type or paste your text here..."
                  rows={6}
                  className="w-full resize-none rounded-lg border border-gray-400 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-gray-700 focus:ring-2 focus:ring-gray-200 focus:outline-none transition-colors"
                />
                <p className="text-xs text-gray-600">
                  Press Ctrl+Enter (Cmd+Enter on Mac) to submit
                </p>
              </div>

              <button
                onClick={handleSinglePrediction}
                disabled={!canSubmitSingle}
                className="w-full bg-gray-800 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Predict Sentiment"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results and Graph Section */}
        <div className="mt-8 space-y-6">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 border border-red-300 rounded-xl p-4"
              >
                <h3 className="text-red-800 font-medium">Error</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </motion.div>
            )}

            {!error && result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-gray-100 border border-gray-400 rounded-xl p-6"
              >
                <h3 className="font-semibold text-lg text-gray-800">Prediction Result</h3>
                <p className="text-gray-700 mt-1">{result}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Graph Visualization */}
          {graphImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-lg border border-gray-300 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-gray-700" />
                <h3 className="font-semibold text-lg text-gray-800">Sentiment Distribution</h3>
              </div>
              <div className="flex justify-center">
                <img src={graphImage} alt="Sentiment Distribution" className="max-w-full h-auto rounded-lg" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Status Indicator */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-300">
            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : error ? 'bg-red-500' : 'bg-green-500'}`} />
            <span className="text-sm text-gray-700">
              {loading ? "Processing..." : error ? "Connection error" : "Ready to analyze sentiment"}
            </span>
          </div>
        </div>
      </div>
    </main>
  )
}