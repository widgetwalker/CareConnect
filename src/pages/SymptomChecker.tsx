import { useState } from "react";
import { Brain, Send, AlertCircle, CheckCircle, Loader2, Stethoscope, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

interface SymptomResult {
    condition: string;
    probability: string;
    severity: "low" | "medium" | "high";
    description: string;
    recommendations: string[];
}

// Simulated AI symptom analysis (in production, this would call an AI API)
const analyzeSymptoms = (symptoms: string): Promise<SymptomResult[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const lowerSymptoms = symptoms.toLowerCase();
            const results: SymptomResult[] = [];

            if (lowerSymptoms.includes("headache") || lowerSymptoms.includes("head pain")) {
                results.push({
                    condition: "Tension Headache",
                    probability: "High",
                    severity: "low",
                    description: "A common type of headache characterized by mild to moderate pain, often described as feeling like a tight band around the head.",
                    recommendations: [
                        "Rest in a quiet, dark room",
                        "Stay hydrated - drink plenty of water",
                        "Consider over-the-counter pain relief",
                        "Practice stress-reduction techniques",
                        "Consult a doctor if headaches persist for more than a week"
                    ]
                });
            }

            if (lowerSymptoms.includes("fever") || lowerSymptoms.includes("temperature")) {
                results.push({
                    condition: "Possible Viral Infection",
                    probability: "Moderate",
                    severity: "medium",
                    description: "Fever is often a sign that your body is fighting an infection. Most fevers resolve on their own within a few days.",
                    recommendations: [
                        "Rest and get plenty of sleep",
                        "Stay well-hydrated with water and electrolytes",
                        "Monitor temperature regularly",
                        "Take fever-reducing medication if needed",
                        "Seek medical attention if fever exceeds 103°F (39.4°C)"
                    ]
                });
            }

            if (lowerSymptoms.includes("cough") || lowerSymptoms.includes("sore throat")) {
                results.push({
                    condition: "Upper Respiratory Infection",
                    probability: "Moderate",
                    severity: "low",
                    description: "Common respiratory infections affecting the nose, throat, and airways. Usually resolves within 7-10 days.",
                    recommendations: [
                        "Rest your voice and get adequate sleep",
                        "Drink warm liquids like tea with honey",
                        "Use a humidifier to add moisture to the air",
                        "Gargle with salt water for sore throat relief",
                        "See a doctor if symptoms worsen after a week"
                    ]
                });
            }

            if (lowerSymptoms.includes("fatigue") || lowerSymptoms.includes("tired")) {
                results.push({
                    condition: "General Fatigue",
                    probability: "High",
                    severity: "low",
                    description: "Persistent tiredness that can result from various factors including stress, poor sleep, or underlying health conditions.",
                    recommendations: [
                        "Aim for 7-9 hours of quality sleep",
                        "Maintain a balanced diet rich in nutrients",
                        "Exercise regularly but avoid overexertion",
                        "Manage stress through relaxation techniques",
                        "Consult a doctor if fatigue persists beyond 2 weeks"
                    ]
                });
            }

            if (lowerSymptoms.includes("chest pain") || lowerSymptoms.includes("difficulty breathing")) {
                results.push({
                    condition: "Respiratory or Cardiac Concern",
                    probability: "Requires Evaluation",
                    severity: "high",
                    description: "Chest pain or breathing difficulties can have various causes, some of which require immediate medical attention.",
                    recommendations: [
                        "Seek immediate medical attention if pain is severe",
                        "Call emergency services if experiencing crushing chest pain",
                        "Note any accompanying symptoms",
                        "Avoid physical exertion until evaluated",
                        "Do not delay seeking professional medical care"
                    ]
                });
            }

            // Default result if no specific symptoms matched
            if (results.length === 0) {
                results.push({
                    condition: "General Health Assessment",
                    probability: "Analysis Complete",
                    severity: "low",
                    description: "Based on your described symptoms, we recommend monitoring your condition and consulting with a healthcare professional for a thorough evaluation.",
                    recommendations: [
                        "Keep track of your symptoms and their duration",
                        "Maintain healthy lifestyle habits",
                        "Stay hydrated and get adequate rest",
                        "Consider scheduling a check-up with your doctor",
                        "Return if symptoms persist or worsen"
                    ]
                });
            }

            resolve(results);
        }, 2000);
    });
};

const getSeverityColor = (severity: "low" | "medium" | "high") => {
    switch (severity) {
        case "low":
            return "bg-green-100 text-green-700 border-green-200";
        case "medium":
            return "bg-amber-100 text-amber-700 border-amber-200";
        case "high":
            return "bg-red-100 text-red-700 border-red-200";
    }
};

const SymptomChecker = () => {
    const [symptoms, setSymptoms] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [results, setResults] = useState<SymptomResult[] | null>(null);

    const handleAnalyze = async () => {
        if (!symptoms.trim()) return;

        setIsAnalyzing(true);
        setResults(null);

        const analysisResults = await analyzeSymptoms(symptoms);
        setResults(analysisResults);
        setIsAnalyzing(false);
    };

    const handleReset = () => {
        setSymptoms("");
        setResults(null);
    };

    return (
        <div className="min-h-screen">
            <main className="pt-24 pb-16">
                {/* Header Section */}
                <section className="hero-gradient py-16">
                    <div className="container mx-auto px-4 text-center">
                        <div className="inline-flex items-center gap-2 mb-6">
                            <span className="px-4 py-2 rounded-full glass-card text-primary text-sm font-medium flex items-center gap-2">
                                <Brain className="w-4 h-4" />
                                AI-Powered Health Analysis
                            </span>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                            Symptom <span className="bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent">Checker</span>
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Describe your symptoms and get instant AI-powered health insights. Remember, this is for informational purposes and not a replacement for professional medical advice.
                        </p>
                    </div>
                </section>

                {/* Main Content */}
                <section className="py-12 wellness-gradient">
                    <div className="container mx-auto px-4 max-w-4xl">
                        {/* Symptom Input */}
                        <Card className="glass-card border-0 shadow-wellness mb-8">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Stethoscope className="w-5 h-5 text-primary" />
                                    Describe Your Symptoms
                                </CardTitle>
                                <CardDescription>
                                    Be as detailed as possible. Include when symptoms started, severity, and any related factors.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Textarea
                                    placeholder="Example: I've had a persistent headache for 2 days, along with mild fatigue and occasional dizziness. The headache is worse in the morning..."
                                    value={symptoms}
                                    onChange={(e) => setSymptoms(e.target.value)}
                                    className="min-h-[150px] text-base transition-wellness focus:shadow-wellness"
                                    disabled={isAnalyzing}
                                />
                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleAnalyze}
                                        disabled={!symptoms.trim() || isAnalyzing}
                                        className="flex-1 transition-wellness hover:scale-[1.02]"
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Analyzing Symptoms...
                                            </>
                                        ) : (
                                            <>
                                                <Brain className="w-4 h-4 mr-2" />
                                                Analyze Symptoms
                                            </>
                                        )}
                                    </Button>
                                    {(symptoms || results) && (
                                        <Button
                                            variant="outline"
                                            onClick={handleReset}
                                            disabled={isAnalyzing}
                                            className="transition-wellness"
                                        >
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Reset
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Loading State */}
                        {isAnalyzing && (
                            <Card className="glass-card border-0 shadow-wellness animate-fade-up">
                                <CardContent className="py-12 text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center animate-health-pulse">
                                        <Brain className="w-8 h-8 text-primary" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">Analyzing Your Symptoms</h3>
                                    <p className="text-muted-foreground">Our AI is reviewing your symptoms to provide personalized insights...</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Results */}
                        {results && (
                            <div className="space-y-6 animate-fade-up">
                                {/* Disclaimer */}
                                <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                                    <CardContent className="py-4">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                            <p className="text-sm text-amber-800 dark:text-amber-200">
                                                <strong>Important:</strong> This analysis is for informational purposes only and should not replace professional medical advice. Please consult a healthcare provider for proper diagnosis and treatment.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <h2 className="text-2xl font-bold">Analysis Results</h2>

                                {results.map((result, index) => (
                                    <Card key={index} className="glass-card border-0 shadow-wellness transition-wellness hover:shadow-wellness-lg">
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <CardTitle className="text-xl mb-2">{result.condition}</CardTitle>
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant="outline" className={getSeverityColor(result.severity)}>
                                                            {result.severity.charAt(0).toUpperCase() + result.severity.slice(1)} Severity
                                                        </Badge>
                                                        <Badge variant="secondary">
                                                            {result.probability} Match
                                                        </Badge>
                                                    </div>
                                                </div>
                                                {result.severity === "high" ? (
                                                    <AlertCircle className="w-6 h-6 text-red-500" />
                                                ) : (
                                                    <CheckCircle className="w-6 h-6 text-green-500" />
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <p className="text-muted-foreground">{result.description}</p>

                                            <Separator />

                                            <div>
                                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                                    <CheckCircle className="w-4 h-4 text-primary" />
                                                    Recommendations
                                                </h4>
                                                <ul className="space-y-2">
                                                    {result.recommendations.map((rec, recIndex) => (
                                                        <li key={recIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                            <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                                            {rec}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                                {/* CTA */}
                                <Card className="glass-card border-0 bg-gradient-to-r from-primary/10 to-teal-500/10">
                                    <CardContent className="py-8 text-center">
                                        <h3 className="text-xl font-semibold mb-2">Need Professional Guidance?</h3>
                                        <p className="text-muted-foreground mb-6">
                                            Connect with a certified healthcare professional for personalized medical advice.
                                        </p>
                                        <div className="flex flex-wrap justify-center gap-4">
                                            <Link to="/consultation">
                                                <Button className="transition-wellness hover:scale-105">
                                                    <Stethoscope className="w-4 h-4 mr-2" />
                                                    Book Consultation
                                                </Button>
                                            </Link>
                                            <Link to="/doctors">
                                                <Button variant="outline" className="transition-wellness hover:scale-105">
                                                    Browse Doctors
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default SymptomChecker;
