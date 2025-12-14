import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Helmet } from "react-helmet-async";
import {
  Camera,
  MapPin,
  Calendar,
  Leaf,
  Upload,
  History,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Plus,
} from "lucide-react";

// Mock data for demo
const mockPlots = [
  {
    id: 1,
    name: "North Field",
    crop: "Rice",
    area: "2.5 Acres",
    stage: "Flowering",
    status: "healthy",
    lastCapture: "2024-01-10",
    healthScore: 92,
  },
  {
    id: 2,
    name: "South Field",
    crop: "Wheat",
    area: "1.8 Acres",
    stage: "Vegetative",
    status: "warning",
    lastCapture: "2024-01-08",
    healthScore: 68,
  },
  {
    id: 3,
    name: "East Plot",
    crop: "Cotton",
    area: "3.2 Acres",
    stage: "Grain Filling",
    status: "healthy",
    lastCapture: "2024-01-09",
    healthScore: 85,
  },
];

const mockCaptures = [
  {
    id: 1,
    plot: "North Field",
    date: "2024-01-10",
    stage: "Flowering",
    status: "analyzed",
    result: "Healthy",
  },
  {
    id: 2,
    plot: "South Field",
    date: "2024-01-08",
    stage: "Vegetative",
    status: "analyzed",
    result: "Mild Stress Detected",
  },
  {
    id: 3,
    plot: "East Plot",
    date: "2024-01-09",
    stage: "Grain Filling",
    status: "pending",
    result: "Processing...",
  },
];

const FarmerDashboard = () => {
  const [activeTab, setActiveTab] = useState<"plots" | "capture" | "history">("plots");

  return (
    <>
      <Helmet>
        <title>Farmer Dashboard - CROPIC</title>
        <meta name="description" content="Manage your crop plots, capture photos, and track crop health with CROPIC's farmer dashboard." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            {/* Welcome Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Welcome, Raju Kumar
              </h1>
              <p className="text-muted-foreground">
                Farmer ID: FRM-2024-78542 | Village: Khirki, District: Ghaziabad
              </p>
            </motion.div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { icon: Leaf, label: "Active Plots", value: "3", color: "bg-primary" },
                { icon: Camera, label: "Photos Captured", value: "24", color: "bg-secondary" },
                { icon: CheckCircle2, label: "Healthy Crops", value: "2", color: "bg-success" },
                { icon: AlertTriangle, label: "Alerts", value: "1", color: "bg-warning" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="border-border/50">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                        <stat.icon className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                        <div className="text-sm text-muted-foreground">{stat.label}</div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {[
                { id: "plots", label: "My Plots", icon: MapPin },
                { id: "capture", label: "Capture Photo", icon: Camera },
                { id: "history", label: "Capture History", icon: History },
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "outline"}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className="flex-shrink-0"
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Tab Content */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "plots" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-foreground">Your Plots</h2>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4" />
                      Add Plot
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mockPlots.map((plot) => (
                      <Card key={plot.id} className="border-border/50 hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{plot.name}</CardTitle>
                            <div
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                plot.status === "healthy"
                                  ? "bg-success/10 text-success"
                                  : "bg-warning/10 text-warning"
                              }`}
                            >
                              {plot.status === "healthy" ? "Healthy" : "Needs Attention"}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Leaf className="w-4 h-4" />
                            <span>{plot.crop}</span>
                            <span className="text-border">•</span>
                            <span>{plot.area}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>Stage: {plot.stage}</span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Health Score</span>
                              <span className="font-medium text-foreground">{plot.healthScore}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  plot.healthScore > 80 ? "bg-success" : "bg-warning"
                                }`}
                                style={{ width: `${plot.healthScore}%` }}
                              />
                            </div>
                          </div>
                          <div className="pt-2">
                            <Button className="w-full" size="sm">
                              <Camera className="w-4 h-4" />
                              Capture Now
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "capture" && (
                <div className="max-w-2xl mx-auto">
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Camera className="w-5 h-5 text-primary" />
                        Capture Crop Photo
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Select Plot</label>
                        <select className="w-full h-11 px-3 rounded-lg border border-input bg-background text-foreground">
                          <option>North Field - Rice</option>
                          <option>South Field - Wheat</option>
                          <option>East Plot - Cotton</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Growth Stage</label>
                        <select className="w-full h-11 px-3 rounded-lg border border-input bg-background text-foreground">
                          <option>Sowing</option>
                          <option>Vegetative</option>
                          <option>Flowering</option>
                          <option>Grain Filling</option>
                          <option>Maturity</option>
                        </select>
                      </div>

                      <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                          <Upload className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-2">
                          Capture or Upload Photo
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Take a photo of your crop field. GPS location will be recorded automatically.
                        </p>
                        <Button variant="hero">
                          <Camera className="w-4 h-4" />
                          Open Camera
                        </Button>
                      </div>

                      <div className="bg-muted/50 rounded-xl p-4">
                        <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          Photo Guidelines
                        </h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Hold phone at chest height, pointing towards crop</li>
                          <li>• Include at least 50% crop and 30% sky in frame</li>
                          <li>• Ensure good lighting (avoid harsh shadows)</li>
                          <li>• Stand at the edge of your plot boundary</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "history" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground">Capture History</h2>
                  <div className="space-y-3">
                    {mockCaptures.map((capture) => (
                      <Card key={capture.id} className="border-border/50">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
                              <Camera className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground">{capture.plot}</h4>
                              <p className="text-sm text-muted-foreground">
                                {capture.date} • {capture.stage}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                                capture.status === "analyzed"
                                  ? capture.result.includes("Healthy")
                                    ? "bg-success/10 text-success"
                                    : "bg-warning/10 text-warning"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {capture.status === "analyzed" ? (
                                capture.result.includes("Healthy") ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                  <AlertTriangle className="w-4 h-4" />
                                )
                              ) : null}
                              {capture.result}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default FarmerDashboard;
